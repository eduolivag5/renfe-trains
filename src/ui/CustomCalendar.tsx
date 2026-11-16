import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  addDays,
  addMonths,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWeekend,
  nextSaturday,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/**
 * Calendario de un mes con rejilla fija de 6 semanas (la altura no salta al cambiar de mes),
 * accesos rápidos y animación de deslizamiento entre meses.
 */
const CustomCalendar = ({ selectedDate, onDateSelect, minDate = startOfToday() }: CustomCalendarProps) => {
  const [month, setMonth] = useState(() => startOfMonth(selectedDate ?? minDate));
  const [direction, setDirection] = useState(0);

  const canGoBack = isBefore(startOfMonth(minDate), month);

  const goTo = (target: Date) => {
    const m = startOfMonth(target);
    setDirection(m > month ? 1 : m < month ? -1 : 0);
    setMonth(m);
  };

  const days = useMemo(() => {
    const start = startOfWeek(month, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [month]);

  const today = startOfToday();
  const quickPicks = [
    { label: 'Hoy', date: today },
    { label: 'Mañana', date: addDays(today, 1) },
    { label: 'Sábado', date: nextSaturday(today) },
  ];

  const pick = (d: Date) => {
    if (!isSameMonth(d, month)) goTo(d);
    onDateSelect(d);
  };

  return (
    <div className="w-full select-none">
      {/* Cabecera del mes */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-black capitalize tracking-tight text-slate-900 dark:text-white">
            {format(month, 'MMMM', { locale: es })}
          </span>
          <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">{format(month, 'yyyy')}</span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Mes anterior"
            disabled={!canGoBack}
            onClick={() => goTo(addMonths(month, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Mes siguiente"
            onClick={() => goTo(addMonths(month, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_NAMES.map((d, i) => (
          <div
            key={d}
            className={`py-1 text-center text-[11px] font-bold ${
              i >= 5 ? 'text-accent-500/70 dark:text-accent-400/70' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Rejilla */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={month.toISOString()}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-7 gap-y-1"
          >
            {days.map((day) => {
              const inMonth = isSameMonth(day, month);
              const disabled = isBefore(day, minDate);
              const selected = !!selectedDate && isSameDay(day, selectedDate);
              const isToday = isSameDay(day, today);

              if (!inMonth) return <span key={day.toISOString()} className="h-10" aria-hidden />;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(day)}
                  aria-pressed={selected}
                  aria-label={format(day, "EEEE d 'de' MMMM", { locale: es })}
                  className={[
                    'relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-[14px] font-semibold tabular-nums transition duration-150',
                    disabled
                      ? 'cursor-default text-slate-300 dark:text-slate-700'
                      : selected
                        ? 'bg-accent-600 font-bold text-white shadow-[0_6px_16px_-6px_rgba(124,58,237,0.8)] dark:bg-accent-500'
                        : `hover:bg-slate-100 active:scale-90 dark:hover:bg-white/[0.07] ${
                            isWeekend(day) ? 'text-accent-600/90 dark:text-accent-300' : 'text-slate-700 dark:text-slate-200'
                          }`,
                    isToday && !selected ? 'ring-1 ring-inset ring-accent-500/50' : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                  {isToday && !selected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent-500" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Accesos rápidos */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-white/[0.07]">
        {quickPicks.map(({ label, date }) => {
          const active = !!selectedDate && isSameDay(date, selectedDate);
          return (
            <button
              key={label}
              type="button"
              onClick={() => pick(date)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-colors active:scale-95 ${
                active
                  ? 'bg-accent-600 text-white dark:bg-accent-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {label}
              <span className={`ml-1.5 font-semibold ${active ? 'text-accent-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {format(date, 'd MMM', { locale: es })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CustomCalendar;
