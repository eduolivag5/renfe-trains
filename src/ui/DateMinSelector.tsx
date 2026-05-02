import { useMemo } from 'react';
import { format, addDays, subDays, isSameDay, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateSelectorProps {
  date: string;
  loading: boolean;
  onDateChange: (newDate: string) => void;
}

export const DateMinSelector = ({ date, loading, onDateChange }: DateSelectorProps) => {
  const dateRange = useMemo(() => {
    const current = new Date(date);
    const today = startOfDay(new Date());
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(subDays(current, 3), i);
      return {
        date: d,
        isPast: isBefore(startOfDay(d), today),
        isSelected: isSameDay(d, current)
      };
    });
  }, [date]);

  return (
    <nav className="pb-3 pt-1">
      <div className="max-w-md mx-auto px-4 flex items-center justify-between gap-1">
        {dateRange.map(({ date: d, isPast, isSelected }) => (
          <button
            key={d.toISOString()}
            type="button"
            disabled={isPast || loading}
            onClick={() => onDateChange(format(d, 'yyyy-MM-dd'))}
            className={`
              relative flex flex-col items-center justify-center w-[42px] h-11 rounded-xl transition-all duration-300
              ${isSelected 
                ? 'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105 z-10' 
                : isPast
                  ? 'opacity-10 cursor-not-allowed'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-500/10'
              }
            `}
          >
            <span className={`text-[7px] font-black uppercase mb-0.5 ${isSelected ? 'text-blue-100' : 'opacity-60'}`}>
              {format(d, 'eee', { locale: es })}
            </span>
            <span className="text-[13px] font-black tabular-nums leading-none tracking-tighter">
              {format(d, 'd')}
            </span>
            
            {/* Indicador sutil para el día seleccionado */}
            {isSelected && (
              <span className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};