import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateSelectorProps {
  date: string; // yyyy-MM-dd
  loading: boolean;
  onDateChange: (newDate: string) => void;
}

const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);
/** Misma curva y duración para la tira y el resaltado: se mueven a la vez */
const MOTION = 'duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

/**
 * Tira continua de días desde hoy. Al elegir un día, la tira se desliza (transform)
 * hasta dejarlo en el centro y el resaltado azul viaja hasta él: nada se re-coloca de golpe.
 * Los días solo se añaden por el final, así las posiciones existentes nunca cambian.
 */
export const DateMinSelector = ({ date, loading, onDateChange }: DateSelectorProps) => {
  const today = startOfDay(new Date());
  const current = startOfDay(parseISO(date));
  const selected = Math.max(0, differenceInCalendarDays(current, today));

  const total = Math.max(60, selected + 30);
  const days = Array.from({ length: total }, (_, i) => addDays(today, i));
  const offset = Math.max(0, selected - CENTER);

  const go = (d: Date) => onDateChange(format(d, 'yyyy-MM-dd'));

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Día anterior"
        disabled={selected === 0 || loading}
        onClick={() => go(subDays(current, 1))}
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:scale-95 disabled:pointer-events-none disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/[0.06]"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>

      {/* Ventana de 5 días */}
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className={`relative flex transition-transform will-change-transform ${MOTION}`}
          style={{ transform: `translate3d(calc(${-offset} * 100% / ${VISIBLE}), 0, 0)` }}
        >
          {/* Resaltado del día elegido (viaja a la vez que la tira) */}
          <span
            aria-hidden
            className={`absolute left-0 top-0 h-14 px-0.5 transition-transform ${MOTION}`}
            style={{ width: `calc(100% / ${VISIBLE})`, transform: `translate3d(${selected * 100}%, 0, 0)` }}
          >
            <span className="block h-full rounded-2xl bg-accent-600 shadow-[0_8px_20px_-8px_rgba(124,58,237,0.9)] dark:bg-accent-500" />
          </span>

          {days.map((d, i) => {
            const isSelected = i === selected;
            return (
              <button
                key={i}
                type="button"
                tabIndex={i < offset || i >= offset + VISIBLE ? -1 : 0}
                disabled={loading && !isSelected}
                onClick={() => !isSelected && go(d)}
                aria-pressed={isSelected}
                aria-label={format(d, "EEEE d 'de' MMMM", { locale: es })}
                style={{ flexBasis: `calc(100% / ${VISIBLE})` }}
                className={`relative z-10 flex h-14 shrink-0 flex-col items-center justify-center rounded-2xl transition-colors duration-300 ${
                  isSelected
                    ? 'text-white'
                    : 'text-slate-600 hover:bg-slate-100 active:scale-95 dark:text-slate-300 dark:hover:bg-white/[0.06]'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 ${
                    isSelected ? 'text-accent-100' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {i === 0 ? 'Hoy' : format(d, 'EEE', { locale: es }).replace('.', '')}
                </span>
                <span className="text-[17px] font-black leading-tight tabular-nums">{format(d, 'd')}</span>
                {/* Mes siempre reservado en altura: el contenido no salta al seleccionar */}
                <span
                  className={`text-[9px] font-bold uppercase leading-none transition-opacity duration-300 ${
                    isSelected ? 'text-accent-100 opacity-100' : d.getDate() === 1 ? 'text-slate-400 opacity-100' : 'opacity-0'
                  }`}
                >
                  {format(d, 'MMM', { locale: es }).replace('.', '')}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-label="Día siguiente"
        disabled={loading}
        onClick={() => go(addDays(current, 1))}
        className="flex h-10 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 active:scale-95 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-white/[0.06]"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
};
