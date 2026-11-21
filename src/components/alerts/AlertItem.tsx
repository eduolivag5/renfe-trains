import { memo, useState, type CSSProperties } from 'react';
import { CalendarClock, Info, TriangleAlert } from 'lucide-react';
import { cleanAlertText } from '../../api/alertsService';
import { networkName, relativeTime, type AlertService, type AlertView } from './alertFormat';

const LONG_TEXT = 240;

/** Símbolos mínimos de servicio (cuadrados): círculo de Cercanías y cuadrado de Rodalies */
const SERVICE_LOGOS: Record<AlertService, { src: string; alt: string }> = {
  CERCANIAS: { src: '/new_icons/cercanias_min.svg', alt: 'Cercanías' },
  RODALIES: { src: '/new_icons/rodalies_min.svg', alt: 'Rodalies' },
};

export const ServiceLogos = ({ services }: { services: AlertService[] }) =>
  services.length ? (
    <span className="flex items-center gap-1">
      {services.map((s) => {
        const logo = SERVICE_LOGOS[s];
        return (
          <img key={s} src={logo.src} alt={logo.alt} title={logo.alt} loading="lazy" width={16} height={16} className="h-4 w-4 shrink-0" />
        );
      })}
    </span>
  ) : null;

/** Aviso programado (empieza más adelante) */
export const ScheduledBadge = () => (
  <span className="flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:border-white/15 dark:text-slate-300">
    <CalendarClock size={12} strokeWidth={2.5} /> Programado
  </span>
);

/** Insignia más marcada para la página de avisos: aviso sólido en ámbar, información sutil en azul */
export const KindBadge =({ warning }: { warning: boolean }) =>
  warning ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.1em] text-white dark:bg-amber-400 dark:text-amber-950">
      <TriangleAlert size={12} strokeWidth={2.75} /> Aviso
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-sky-700 dark:bg-sky-400/10 dark:text-sky-300">
      <Info size={12} strokeWidth={2.5} /> Información
    </span>
  );

export const LineChips = ({ lines, max = 8 }: { lines: string[]; max?: number }) => {
  if (!lines.length) return null;
  const shown = lines.slice(0, max);
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((l) => (
        <span
          key={l}
          className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-black leading-none text-white dark:bg-white dark:text-slate-900"
        >
          {l}
        </span>
      ))}
      {lines.length > max && (
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black leading-none text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
          +{lines.length - max}
        </span>
      )}
    </span>
  );
};

/** Solo las primeras filas (las que se ven al cargar) tienen animación de entrada escalonada */
const ANIMATED_ROWS = 10;

/**
 * Fila editorial de un aviso (sin tarjeta): fecha a la izquierda, contenido a la derecha.
 * Los avisos llevan filete ámbar a la izquierda, fondo tintado y texto más contrastado; la
 * información queda en segundo plano.
 *
 * Rendimiento:
 * - `memo`: solo se re-renderiza si cambia su aviso, su posición o la hora de referencia.
 * - Entrada con animación CSS (opacity + transform, `.alert-enter` en index.css): la compone la
 *   GPU en su propio hilo, sin JavaScript por frame ni lecturas de layout.
 * - `.alert-row` usa `content-visibility: auto`: las filas fuera de pantalla no se maquetan ni pintan.
 */
export const AlertItem = memo(function AlertItem({ view, now, index }: { view: AlertView; now: number; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const text = cleanAlertText(view.alert.descripcion);
  const long = text.length > LONG_TEXT;
  const { start, isWarning } = view;
  const animated = index < ANIMATED_ROWS;

  return (
    <li
      style={animated ? ({ '--i': index } as CSSProperties) : undefined}
      className={`alert-row relative grid min-w-0 gap-x-8 gap-y-2 border-t border-slate-200/80 py-6 pl-4 pr-2 md:grid-cols-[8rem_minmax(0,1fr)] md:pl-5 dark:border-white/[0.07] ${
        isWarning ? 'bg-amber-50/70 dark:bg-amber-400/[0.035]' : ''
      } ${animated ? 'alert-enter' : ''}`}
    >
      {isWarning && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-amber-500 dark:bg-amber-400" />}

      {/* Fecha */}
      <div className="flex items-baseline gap-2 md:flex-col md:gap-1">
        {start ? (
          <>
            <time dateTime={view.alert.fechaInicio} className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">
              {start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              <span className="ml-1.5 font-bold tabular-nums text-slate-400 dark:text-slate-500">
                {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </time>
            <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500">{relativeTime(start, now)}</span>
          </>
        ) : (
          <span className="text-[12px] font-semibold text-slate-400">Sin fecha</span>
        )}
      </div>

      {/* Contenido */}
      <div className="min-w-0 space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <KindBadge warning={isWarning} />
          <ServiceLogos services={view.services} />
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
            {view.networks.map(networkName).join(' · ')}
          </span>
          <LineChips lines={view.lines} />
          {view.upcoming && <ScheduledBadge />}
        </div>
        <p
          className={`max-w-3xl text-[14px] leading-relaxed [overflow-wrap:anywhere] ${
            isWarning ? 'font-medium text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
          } ${long && !expanded ? 'line-clamp-3' : ''}`}
        >
          {text}
        </p>
        {long && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-[13px] font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
          >
            {expanded ? 'Ver menos' : 'Leer más'}
          </button>
        )}
      </div>
    </li>
  );
});

export const AlertItemSkeleton = () => (
  <li className="grid gap-x-8 gap-y-3 border-t border-slate-200/80 py-6 pl-4 pr-2 md:grid-cols-[8rem_minmax(0,1fr)] md:pl-5 dark:border-white/[0.07]">
    <span className="h-4 w-20 animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
    <div className="space-y-2.5">
      <span className="block h-3 w-40 animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
      <span className="block h-3 w-full max-w-2xl animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
      <span className="block h-3 w-2/3 max-w-xl animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
    </div>
  </li>
);
