import { TriangleAlert } from 'lucide-react';
import { cleanAlertText, type ServiceAlert } from '../../api/alertsService';
import { formatAlertDate as formatDate } from './alertFormat';


interface AlertsButtonProps {
  count: number;
  open: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

/** Icono de aviso con el nº de alertas. No se renderiza si no hay ninguna. */
export const AlertsButton = ({ count, open, onToggle, size = 'md' }: AlertsButtonProps) => {
  if (count === 0) return null;
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <button
      type="button"
      onClick={onToggle}
      onPointerDown={(e) => e.stopPropagation()}
      aria-expanded={open}
      aria-label={`${count} ${count === 1 ? 'aviso' : 'avisos'} en esta línea`}
      title={`${count} ${count === 1 ? 'aviso' : 'avisos'} en esta línea`}
      className={`relative flex ${dim} shrink-0 items-center justify-center rounded-full transition-colors active:scale-95 ${
        open
          ? 'bg-amber-500 text-white'
          : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:bg-amber-400/15 dark:text-amber-400'
      }`}
    >
      <TriangleAlert size={size === 'sm' ? 15 : 18} strokeWidth={2.5} />
      <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-900">
        {count}
      </span>
    </button>
  );
};

/**
 * Lista de avisos que se despliega con CSS nativo (grid-template-rows) y un fundido:
 * mismo comportamiento suave y barato para la GPU que el resto de la web.
 */
export const AlertsList = ({ alerts, open }: { alerts: ServiceAlert[]; open: boolean }) => (
  <div
    className={`grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
      open && alerts.length ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
    }`}
    inert={!open}
    aria-hidden={!open}
  >
    <div className="min-h-0 overflow-hidden">
      <ul
        className={`space-y-2.5 pb-4 pt-1 transition-[opacity,transform] duration-300 ease-out ${
          open ? 'translate-y-0 opacity-100 delay-75' : '-translate-y-1 opacity-0'
        }`}
        aria-label="Avisos de la línea"
      >
        {alerts.map((a) => (
          <li
            key={a.id}
            className="rounded-2xl border border-amber-500/25 bg-amber-50 p-3.5 dark:border-amber-400/20 dark:bg-amber-400/[0.07]"
          >
            <div className="mb-1.5 flex items-center gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <TriangleAlert size={13} strokeWidth={2.5} />
              {a.alertId.startsWith('AVISO') ? 'Aviso' : 'Información'}
              {formatDate(a.fechaInicio) && (
                <span className="font-semibold text-amber-700/70 dark:text-amber-400/70">· desde {formatDate(a.fechaInicio)}</span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200">
              {cleanAlertText(a.descripcion)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
