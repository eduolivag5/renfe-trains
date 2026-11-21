import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { AlertCircle, Check, Clock3, MapPin, Share2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { fetchDetail, getCachedDetail } from '../../api/detailCache';
import type { TrainDetail } from '../../api/trainsService';
import {
  FALLBACK_LOGO,
  formatClock,
  formatDuration,
  getMapTrainInfo,
  getTrainIdentity,
  getTrainLogo,
  intermediateStops,
  stopsLabel,
  trainTypeHint,
  timeToMinutes,
} from '../../utils/trainUtils';
import type { ProcessedTrain } from './TrainCard';
import { useTrainAlerts } from '../../hooks/useTrainAlerts';
import { BACKDROP_MOTION, useSheetMotion } from '../../hooks/useSheetMotion';
import { AlertsButton, AlertsList } from '../alerts/TrainAlerts';

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const DESKTOP_QUERY = '(min-width: 768px)';
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useIsDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches);

/** Curva de apertura tipo iOS (salida rápida, frenada larga) */
const SHEET_EASE = [0.32, 0.72, 0, 1] as const;
/** Solo se muestra el esqueleto si la espera supera este umbral (evita parpadeos) */
const SKELETON_DELAY_MS = 250;

/* ------------------------------------------------------------------ */
/* Recorrido                                                           */
/* ------------------------------------------------------------------ */

/** Línea de paradas con eje continuo; origen y destino destacados y etiquetados */
const Itinerary = ({ stops }: { stops: TrainDetail['itinerary'] }) => (
  <ol className="min-w-0">
    {stops.map((stop, i) => {
      const first = i === 0;
      const last = i === stops.length - 1;
      const edge = first || last;
      return (
        <li key={`${stop.sequence}-${i}`} className="flex min-h-12 items-stretch gap-4">
          <span className="relative flex w-5 shrink-0 items-center justify-center">
            {!first && (
              <span className="absolute left-1/2 top-0 h-1/2 w-[3px] -translate-x-1/2 bg-[var(--c)] opacity-30 dark:bg-slate-500 dark:opacity-60" />
            )}
            {!last && (
              <span className="absolute bottom-0 left-1/2 h-1/2 w-[3px] -translate-x-1/2 bg-[var(--c)] opacity-30 dark:bg-slate-500 dark:opacity-60" />
            )}
            <span
              className={`relative z-10 rounded-full ${
                edge
                  ? 'h-4 w-4 border-4 border-[var(--c)] bg-white dark:border-slate-200 dark:bg-slate-900'
                  : 'h-2.5 w-2.5 bg-[var(--c)] ring-4 ring-white dark:bg-slate-400 dark:ring-slate-900'
              }`}
            />
          </span>
          <div className="min-w-0 flex-1 self-center py-2">
            {edge && (
              <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-accent-600 dark:text-accent-400">
                {first ? 'Salida' : 'Llegada'}
              </span>
            )}
            <span
              className={`block leading-snug [overflow-wrap:anywhere] ${
                edge ? 'text-[16px] font-bold text-slate-900 dark:text-white' : 'text-[15px] text-slate-600 dark:text-slate-300'
              }`}
            >
              {stop.stopName}
            </span>
          </div>
          <span
            className={`shrink-0 self-center font-mono text-[13px] font-semibold tabular-nums ${
              edge ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {formatClock(stop.actualArrival || stop.scheduledArrival)}
          </span>
        </li>
      );
    })}
  </ol>
);

const ItinerarySkeleton = () => (
  <div className="space-y-5 py-2" aria-hidden>
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <span className="h-3 w-5 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
        <span className="h-3.5 flex-1 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" style={{ maxWidth: `${55 + ((i * 29) % 35)}%` }} />
        <span className="h-3.5 w-10 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Compartir este tren                                                 */
/* ------------------------------------------------------------------ */

/**
 * Copia con un textarea temporal y execCommand('copy'): el único método que funciona fuera de
 * https. En iOS hay que seleccionar con setSelectionRange (select() no basta) y usar 16 px para
 * que Safari no haga zoom al enfocarlo.
 */
function legacyCopy(value: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;pointer-events:none;';
  document.body.appendChild(ta);
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(0, value.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  return ok;
}

type ShareInfo ={ date: string; route?: { from: string; to: string } };

/**
 * Comparte este horario concreto: menú nativo del sistema (móvil) o, si no existe, copia el
 * enlace. El enlace es la búsqueda con ?tren=… : quien lo abre ve el día y este tren abierto.
 */
const ShareTrainButton = ({ train, date, route }: { train: ProcessedTrain } & ShareInfo) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('tren', train.tripId);
    const day = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });
    const where = route ? ` de ${route.from} a ${route.to}` : '';
    const text = `${train.trainType.trim()}${where}: sale a las ${formatClock(train.departureTime)} y llega a las ${formatClock(train.arrivalTime)}, el ${day}`;
    const link = url.toString();

    // 1) Menú nativo de compartir. Solo existe en páginas seguras (https o localhost): en un
    //    iPhone abriendo la web por http en la red local, navigator.share no está
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url: link });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return; // el usuario cerró el menú
        // otro error (p. ej. NotAllowedError): se copia el enlace
      }
    }
    // 2) Portapapeles moderno (también solo en páginas seguras)
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        return;
      } catch {
        /* bloqueado: se prueba el método clásico */
      }
    }
    // 3) Copia clásica, que funciona en cualquier página (también http en iOS)
    if (legacyCopy(link)) setCopied(true);
  };

  return (
    <button
      type="button"
      onClick={share}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={copied ? 'Enlace copiado' : 'Compartir este tren'}
      title={copied ? 'Enlace copiado' : 'Compartir este tren'}
      /* Al copiar, el botón redondo se estira hasta píldora verde con "Enlace copiado" durante 2 s.
         Todo en CSS y siempre con la misma estructura (nada se monta ni desmonta):
         - el color de fondo y de texto se funden;
         - el icono de compartir gira y se encoge mientras el check crece y se "dibuja" (trazo SVG);
         - el texto se abre con grid-template-columns 0fr → 1fr (el ancho se anima solo, sin medir)
           y aparece con un fundido un poco después. Con "reducir movimiento", sin animaciones. */
      className={`flex h-10 shrink-0 items-center rounded-full transition-[background-color,color] duration-300 ease-out active:scale-95 motion-reduce:transition-none ${
        copied
          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/15'
      }`}
    >
      <span className="relative grid h-10 w-10 shrink-0 place-items-center">
        <Share2
          size={17}
          strokeWidth={2.5}
          className={`absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            copied ? '-rotate-45 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Check
          size={17}
          strokeWidth={2.75}
          className={`absolute transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none [&_path]:[stroke-dasharray:24] [&_path]:transition-[stroke-dashoffset] [&_path]:duration-[400ms] [&_path]:ease-out motion-reduce:[&_path]:transition-none ${
            copied
              ? 'scale-100 opacity-100 [&_path]:delay-100 [&_path]:[stroke-dashoffset:0]'
              : 'scale-50 opacity-0 [&_path]:[stroke-dashoffset:24]'
          }`}
        />
      </span>
      <span
        aria-hidden
        className={`grid transition-[grid-template-columns] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          copied ? 'grid-cols-[1fr]' : 'grid-cols-[0fr]'
        }`}
      >
        <span className="overflow-hidden">
          <span
            className={`block whitespace-nowrap pr-4 text-[13px] font-bold transition-opacity motion-reduce:transition-none ${
              copied ? 'opacity-100 delay-100 duration-300' : 'opacity-0 duration-150'
            }`}
          >
            Enlace copiado
          </span>
        </span>
      </span>
      {/* Aviso para lectores de pantalla (el texto visible va oculto para ellos) */}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Enlace copiado' : ''}
      </span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

const Panel = ({ train, date, route, onClose }: { train: ProcessedTrain; onClose: () => void } & ShareInfo) => {
  const desktop = useIsDesktop();
  const dragControls = useDragControls();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = useState<TrainDetail | null>(() => getCachedDetail(train.tripId));
  const [error, setError] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  // Avisos de la línea (icono en la cabecera; la lista se despliega al pulsarlo)
  const alerts = useTrainAlerts({ tripId: train.tripId, tipo: train.trainType, routeId: detail?.routeId });
  const [alertsOpen, setAlertsOpen] = useState(false);

  const logo = getTrainLogo(getTrainIdentity(train.trainType.trim().toUpperCase()).logo);
  const family = getMapTrainInfo(train.trainType).family;
  const color = family?.color ?? '#7c3aed';
  const nextDay = timeToMinutes(train.arrivalTime) < timeToMinutes(train.departureTime);

  // Datos: de la caché si ya están; si no, se piden (esqueleto solo si la espera se nota)
  useEffect(() => {
    if (getCachedDetail(train.tripId)) return;
    let alive = true;
    const t = setTimeout(() => alive && setShowSkeleton(true), SKELETON_DELAY_MS);
    fetchDetail(train.tripId)
      .then((d) => alive && setDetail(d))
      .catch(() => alive && setError(true))
      .finally(() => clearTimeout(t));
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [train.tripId]);

  // Escape para cerrar, foco en el botón de cerrar y sin scroll del fondo mientras está abierto
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const main = document.querySelector('main');
    const prev = main?.style.overflowY ?? '';
    if (main) main.style.overflowY = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      if (main) main.style.overflowY = prev;
    };
  }, [onClose]);

  // Móvil: arrastrar hacia abajo desde la cabecera cierra la hoja
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 600) onClose();
  };

  // PC: panel lateral que entra desde la derecha. Móvil: animación común de los paneles
  // (fundido + desplazamiento corto, ver useSheetMotion) en vez de subir toda la hoja
  const sheetMotion = useSheetMotion();
  const desktopTransition = { duration: 0.45, ease: SHEET_EASE };
  const motionProps = desktop
    ? { initial: { x: '100%' }, animate: { x: 0, transition: desktopTransition }, exit: { x: '100%', transition: desktopTransition } }
    : sheetMotion;

  return (
    <>
      {/* Fondo atenuado (solo opacidad, sin desenfoque) */}
      <motion.div
        className="fixed inset-0 z-[95] bg-slate-950/45"
        {...(desktop ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 } } : BACKDROP_MOTION)}
        onClick={onClose}
        aria-hidden
      />

      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label={`Recorrido del ${train.trainType} de las ${formatClock(train.departureTime)}`}
        style={{ '--c': color } as CSSProperties}
        {...motionProps}
        drag={desktop ? false : 'y'}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={onDragEnd}
        className={`fixed z-[96] flex flex-col bg-white shadow-[0_-24px_60px_-20px_rgba(2,6,23,0.45)] dark:bg-slate-900 ${
          desktop
            ? 'inset-y-0 right-0 w-[440px] max-w-[92vw] rounded-l-[28px]'
            : 'inset-x-0 bottom-0 max-h-[90dvh] rounded-t-[28px]'
        }`}
      >
        {/* Cabecera (zona de arrastre en móvil) */}
        <header
          onPointerDown={(e) => !desktop && dragControls.start(e)}
          className={`shrink-0 px-6 pb-5 ${desktop ? 'pt-6' : 'cursor-grab touch-none pt-3 active:cursor-grabbing'}`}
        >
          {!desktop && <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-white/15" />}

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-2.5">
              {family && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--c)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--c)] dark:bg-white/[0.06] dark:text-slate-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--c)] dark:bg-slate-300" />
                  {family.name}
                </span>
              )}
              <div className="flex items-center gap-2.5">
                <img
                  src={logo.src}
                  alt={train.trainType}
                  className={`h-5 w-auto max-w-[120px] object-contain object-left ${logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_LOGO;
                    e.currentTarget.onerror = null;
                  }}
                />
                {trainTypeHint(train.trainType) && (
                  <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">{trainTypeHint(train.trainType)}</span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <AlertsButton count={alerts.length} open={alertsOpen} onToggle={() => setAlertsOpen((v) => !v)} />
              <ShareTrainButton train={train} date={date} route={route} />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label="Cerrar"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-white/[0.08] dark:text-slate-300 dark:hover:bg-white/15"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Horario */}
          <div className="mt-5 flex items-center gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Salida</p>
              <p className="text-[34px] font-black leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
                {formatClock(train.departureTime)}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 pt-4">
              <div className="flex w-full items-center">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-[var(--c)] dark:border-slate-300" />
                <span className="h-0.5 flex-1 bg-[var(--c)] opacity-40 dark:bg-slate-500" />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--c)] dark:bg-slate-200" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Llegada</p>
              <p className="relative text-[34px] font-black leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
                {formatClock(train.arrivalTime)}
                {nextDay && <sup className="absolute -right-3 -top-1 text-[11px] font-bold text-accent-600 dark:text-accent-400">+1</sup>}
              </p>
            </div>
          </div>

          {/* Resumen */}
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
              <Clock3 size={13} strokeWidth={2.5} /> {formatDuration(train.durationMin)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
              <MapPin size={13} strokeWidth={2.5} /> {detail ? stopsLabel(intermediateStops(detail.itinerary.length)) : "Paradas…"}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
              Directo
            </span>
          </div>
        </header>

        {/* Recorrido (desplazable dentro de la hoja) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-slate-100 px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4 dark:border-white/[0.06]">
          <AlertsList alerts={alerts} open={alertsOpen} />
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">Recorrido</p>
          {detail ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Itinerary stops={detail.itinerary} />
            </motion.div>
          ) : error ? (
            <p className="flex items-center gap-2 py-4 text-[14px] font-semibold text-red-500" role="alert">
              <AlertCircle size={16} /> No se pudo cargar el recorrido.
            </p>
          ) : showSkeleton ? (
            <ItinerarySkeleton />
          ) : (
            <div className="h-40" />
          )}
        </div>
      </motion.section>
    </>
  );
};

/**
 * Detalle del trayecto en un panel aparte: hoja inferior en móvil (se cierra arrastrando)
 * y panel lateral en escritorio. Solo anima transform y opacity (GPU).
 */
const TrainDetailSheet = ({ train, date, route, onClose }: { train: ProcessedTrain | null; onClose: () => void } & ShareInfo) =>
  createPortal(
    <AnimatePresence>{train && <Panel key={train.tripId} train={train} date={date} route={route} onClose={onClose} />}</AnimatePresence>,
    document.body,
  );

export default TrainDetailSheet;
