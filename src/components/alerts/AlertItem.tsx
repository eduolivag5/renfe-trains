import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { cleanAlertText } from '../../api/alertsService';
import { networkName, relativeTime, type AlertView } from './alertFormat';

const LONG_TEXT = 240;

/** Tipo de alerta: punto ámbar para avisos, lila para información */
export const AlertKind = ({ warning }: { warning: boolean }) => (
  <span
    className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${
      warning ? 'text-amber-600 dark:text-amber-400' : 'text-accent-600 dark:text-accent-400'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${warning ? 'bg-amber-500' : 'bg-accent-500'}`} />
    {warning ? 'Aviso' : 'Info'}
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

/** Fila editorial de una alerta (sin tarjeta): fecha a la izquierda, contenido a la derecha */
export const AlertItem = ({ view, now }: { view: AlertView; now: number }) => {
  const [expanded, setExpanded] = useState(false);
  const text = cleanAlertText(view.alert.descripcion);
  const long = text.length > LONG_TEXT;
  const { start } = view;

  return (
    <li className="grid min-w-0 gap-x-8 gap-y-2 border-t border-slate-200/80 py-6 md:grid-cols-[8rem_minmax(0,1fr)] dark:border-white/[0.07]">
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
          <AlertKind warning={view.isWarning} />
          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
            {view.networks.map(networkName).join(' · ')}
          </span>
          <LineChips lines={view.lines} />
          {view.upcoming && (
            <span className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-400">
              <CalendarClock size={12} strokeWidth={2.5} /> Programado
            </span>
          )}
        </div>
        <p
          className={`max-w-3xl text-[14px] leading-relaxed text-slate-600 [overflow-wrap:anywhere] dark:text-slate-300 ${
            long && !expanded ? 'line-clamp-3' : ''
          }`}
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
};

export const AlertItemSkeleton = () => (
  <li className="grid gap-x-8 gap-y-3 border-t border-slate-200/80 py-6 md:grid-cols-[8rem_minmax(0,1fr)] dark:border-white/[0.07]">
    <span className="h-4 w-20 animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
    <div className="space-y-2.5">
      <span className="block h-3 w-40 animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
      <span className="block h-3 w-full max-w-2xl animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
      <span className="block h-3 w-2/3 max-w-xl animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
    </div>
  </li>
);
