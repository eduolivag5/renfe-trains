import { useState, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown, Zap } from 'lucide-react';
import { FALLBACK_LOGO, formatDuration, getMapTrainInfo, getTrainIdentity, getTrainLogo, timeToMinutes } from '../../utils/trainUtils';
import { trainsService, type TrainDetail, type TrainSearchResult } from '../../api/trainsService';

export type TrainStatus = 'departed' | 'next' | null;

export interface ProcessedTrain extends TrainSearchResult {
  durationMin: number;
  isFastest: boolean;
}

interface TrainCardProps {
  train: ProcessedTrain;
  index: number;
  status: TrainStatus;
}

const hhmm = (t?: string) => (t ? t.slice(0, 5) : '--:--');

/** Altura fija del recorrido desplegado: no cambia mientras llega la respuesta de la API */
const ITINERARY_HEIGHT = 'h-64';

/* ------------------------------------------------------------------ */
/* Recorrido                                                           */
/* ------------------------------------------------------------------ */

/** Usa el color de la familia (variable --c del artículo); en oscuro, tonos neutros legibles */
const Itinerary = ({ stops }: { stops: TrainDetail['itinerary'] }) => (
  <ol>
    {stops.map((stop, i) => {
      const edge = i === 0 || i === stops.length - 1;
      return (
        <li key={`${stop.sequence}-${i}`} className="flex h-9 items-center gap-4">
          <span className="relative flex w-4 shrink-0 justify-center self-stretch">
            {i > 0 && (
              <span className="absolute left-1/2 top-0 h-1/2 w-0.5 -translate-x-1/2 bg-[var(--c)] opacity-25 dark:bg-slate-500 dark:opacity-50" />
            )}
            {i < stops.length - 1 && (
              <span className="absolute bottom-0 left-1/2 h-1/2 w-0.5 -translate-x-1/2 bg-[var(--c)] opacity-25 dark:bg-slate-500 dark:opacity-50" />
            )}
            <span
              className={`relative z-10 my-auto rounded-full ${
                edge
                  ? 'h-3 w-3 border-[3px] border-[var(--c)] bg-white dark:border-slate-300 dark:bg-slate-900'
                  : 'h-2 w-2 bg-[var(--c)] opacity-60 dark:bg-slate-400'
              }`}
            />
          </span>
          <span className="w-11 shrink-0 font-mono text-[12px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
            {hhmm(stop.actualArrival || stop.scheduledArrival)}
          </span>
          <span
            className={`min-w-0 flex-1 truncate text-[13.5px] ${
              edge ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {stop.stopName}
          </span>
        </li>
      );
    })}
  </ol>
);

/** Esqueleto con la misma métrica de filas (h-9) que el recorrido real */
const ItinerarySkeleton = () => (
  <div>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex h-9 items-center gap-4">
        <span className="flex w-4 justify-center">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        </span>
        <span className="h-3 w-11 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
        <span
          className="h-3 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]"
          style={{ width: `${40 + ((i * 37) % 45)}%` }}
        />
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Tarjeta de tren                                                     */
/* ------------------------------------------------------------------ */

export const TrainCard = ({ train, index, status }: TrainCardProps) => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const logo = getTrainLogo(getTrainIdentity(train.trainType.trim().toUpperCase()).logo);
  const family = getMapTrainInfo(train.trainType).family;
  const color = family?.color ?? '#7c3aed';
  const nextDay = timeToMinutes(train.arrivalTime) < timeToMinutes(train.departureTime);
  const departed = status === 'departed';

  const toggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (!willOpen || detail || loading) return;
    setLoading(true);
    setError(false);
    try {
      setDetail(await trainsService.getDetail(train.tripId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03 }}
      style={{ '--c': color } as CSSProperties}
      className={`overflow-hidden rounded-2xl border bg-white transition-colors dark:bg-slate-900/60 ${
        open
          ? 'border-slate-300 shadow-[0_12px_32px_-16px_rgba(2,33,71,0.25)] dark:border-white/15'
          : 'border-slate-200/80 hover:border-slate-300 dark:border-white/[0.07] dark:hover:border-white/15'
      } ${departed ? 'opacity-55' : ''}`}
    >
      <button type="button" onClick={toggle} aria-expanded={open} className="block w-full px-4 pb-4 pt-3 text-left md:px-5">
        {/* Fila de etiquetas: familia (izquierda) · más rápido (derecha) */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {family && (
              <span className="flex items-center gap-1.5 truncate rounded-full bg-[var(--c)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--c)] dark:bg-white/[0.06] dark:text-slate-200">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c)] dark:bg-slate-300" />
                {family.name}
              </span>
            )}
            {status === 'next' && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Próximo
              </span>
            )}
            {departed && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                Ha salido
              </span>
            )}
          </div>
          {train.isFastest && !departed && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <Zap size={11} strokeWidth={2.75} fill="currentColor" /> Más rápido
            </span>
          )}
        </div>

        {/* Servicio · horario · desplegar */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[8.5rem_1fr_auto] md:gap-x-6">
          <div className="flex min-w-0 items-center gap-2.5 md:flex-col md:items-start md:gap-1">
            <img
              src={logo.src}
              alt={train.trainType}
              className={`h-[18px] w-auto max-w-[110px] object-contain object-left ${logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_LOGO;
                e.currentTarget.onerror = null;
              }}
            />
            <span className="truncate text-[11px] font-semibold text-slate-400 dark:text-slate-500">{train.trainType}</span>
          </div>

          <span
            className={`col-start-2 row-start-1 flex h-8 w-8 items-center justify-center justify-self-end rounded-full transition-colors md:col-start-3 ${
              open ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'
            }`}
          >
            <ChevronDown size={16} strokeWidth={2.5} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
          </span>

          <div className="col-span-2 flex items-center gap-3 md:col-span-1 md:col-start-2 md:row-start-1 md:gap-5">
            <time className="text-[26px] font-black leading-none tracking-tight tabular-nums text-slate-900 md:text-[28px] dark:text-white">
              {hhmm(train.departureTime)}
            </time>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-[12px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                {formatDuration(train.durationMin)}
              </span>
              <div className="flex w-full items-center">
                <span className="h-2 w-2 shrink-0 rounded-full border-2 border-[var(--c)] dark:border-slate-400" />
                <span className="h-0.5 flex-1 bg-[var(--c)] opacity-50 dark:bg-slate-500" />
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--c)] dark:bg-slate-300" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Directo</span>
            </div>
            <time className="relative text-[26px] font-black leading-none tracking-tight tabular-nums text-slate-900 md:text-[28px] dark:text-white">
              {hhmm(train.arrivalTime)}
              {nextDay && <sup className="absolute -right-4 -top-1 text-[11px] font-bold text-accent-600 dark:text-accent-400">+1</sup>}
            </time>
          </div>
        </div>
      </button>

      {/* Recorrido: altura fija para que no salte al llegar los datos */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-3 md:px-5 dark:border-white/[0.06]">
              <p className="mb-2 flex h-4 items-center text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                Recorrido completo
                {detail && <span className="ml-1.5 font-semibold normal-case tracking-normal">· {detail.itinerary.length} paradas</span>}
              </p>
              <div className={`${ITINERARY_HEIGHT} overflow-y-auto overscroll-contain pr-1`}>
                {loading ? (
                  <ItinerarySkeleton />
                ) : error ? (
                  <p className="flex h-full items-center justify-center gap-2 text-[13px] font-semibold text-red-500">
                    <AlertCircle size={15} /> No se pudo cargar el recorrido.
                  </p>
                ) : detail ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    <Itinerary stops={detail.itinerary} />
                  </motion.div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};
