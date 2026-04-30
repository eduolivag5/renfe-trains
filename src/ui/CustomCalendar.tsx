import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  format, addMonths, subMonths,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  isSameMonth, isSameDay, isBefore,
  startOfToday, eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const CustomCalendar = ({ selectedDate, onDateSelect, minDate = startOfToday() }: CustomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate ?? new Date());
  const [direction, setDirection] = useState(0);

  const nextMonth = () => { setDirection(1); setCurrentMonth(m => addMonths(m, 1)); };
  const prevMonth = () => { setDirection(-1); setCurrentMonth(m => subMonths(m, 1)); };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    <div className="w-full select-none mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[14px] font-semibold text-slate-800 dark:text-white first-letter:uppercase">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.07] flex items-center justify-center text-slate-400 transition-colors active:bg-slate-200 dark:active:bg-white/[0.12]"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={nextMonth}
            className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/[0.07] flex items-center justify-center text-slate-400 transition-colors active:bg-slate-200 dark:active:bg-white/[0.12]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500 text-center py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentMonth.toISOString()}
            custom={direction}
            initial={{ opacity: 0, x: direction * 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -12 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid grid-cols-7"
          >
            {days.map((day) => {
              const isOutside = !isSameMonth(day, currentMonth);
              const isDisabled = isOutside || isBefore(day, minDate);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  disabled={isDisabled}
                  onClick={() => onDateSelect(day)}
                  className={[
                    'relative h-9 w-full flex items-center justify-center rounded-full text-[13.5px] transition-all duration-150',
                    isDisabled ? 'text-slate-200 dark:text-slate-800 pointer-events-none' : 'text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-white/[0.08]',
                    isSelected ? '!bg-blue-600 !text-white font-semibold shadow-[0_2px_8px_rgba(0,122,255,0.35)]' : '',
                    isToday && !isSelected ? 'font-semibold text-blue-600 dark:text-blue-400' : '',
                  ].join(' ')}
                >
                  {format(day, 'd')}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomCalendar;