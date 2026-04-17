import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  isBefore,
  startOfToday,
  eachDayOfInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

const CustomCalendar = ({ selectedDate, onDateSelect, minDate = startOfToday() }: CustomCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);

  const nextMonth = () => { setDirection(1); setCurrentMonth(addMonths(currentMonth, 1)); };
  const prevMonth = () => { setDirection(-1); setCurrentMonth(subMonths(currentMonth, 1)); };

  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  return (
    // max-w-[320px] asegura que en PC no se estire demasiado y mx-auto lo centra
    <div className="w-full max-w-[320px] mx-auto select-none">
      
      {/* HEADER MÁS COMPACTO */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-bold dark:text-white first-letter:uppercase">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <div className="flex gap-0.5">
          <button onClick={prevMonth} className="p-1.5 active:bg-slate-100 dark:active:bg-white/5 rounded-full">
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
          <button onClick={nextMonth} className="p-1.5 active:bg-slate-100 dark:active:bg-white/5 rounded-full">
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* DÍAS DE LA SEMANA MÁS PEQUEÑOS */}
      <div className="grid grid-cols-7 mb-1">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="text-[10px] font-bold text-slate-400 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* CELDAS COMPACTAS */}
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentMonth.toString()}
            custom={direction}
            initial={{ opacity: 0, x: direction * 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -10 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-7 gap-px" // gap-px para mínima separación
          >
            {daysInMonth.map((day) => {
              const isDisabled = !isSameMonth(day, currentMonth) || isBefore(day, minDate);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toString()}
                  disabled={isDisabled}
                  onClick={() => onDateSelect(day)}
                  className={`
                    relative h-9 w-full flex flex-col items-center justify-center text-xs rounded-lg transition-all
                    ${isDisabled ? 'text-slate-200 dark:text-slate-800' : 'text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-white/10'}
                    ${isSelected ? '!bg-blue-600 !text-white font-bold' : ''}
                  `}
                >
                  <span className="relative z-10">{format(day, 'd')}</span>
                  {isToday && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 bg-blue-500 rounded-full" />
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