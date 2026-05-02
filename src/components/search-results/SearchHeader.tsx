import { ArrowRight, TrainFront } from 'lucide-react';
import { DateMinSelector } from '../../ui/DateMinSelector';

interface StationInfo {
  nombre: string;
  provincia: string;
}

interface SearchHeaderProps {
  originDetail?: StationInfo;
  destinationDetail?: StationInfo;
  date: string;
  count: number;
  loading: boolean;
  onDateChange: (newDate: string) => void;
  onEditSearch: () => void;
}

export const SearchHeader = ({
  originDetail,
  destinationDetail,
  date,
  count,
  loading,
  onDateChange,
  onEditSearch
}: SearchHeaderProps) => {
  return (
    /* Aplicamos el cristal y la optimización GPU aquí para que afecte a todo el conjunto */
    <div className="sticky top-0 z-40 w-full transform-gpu bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm">
      
      {/* 1. Header Estaciones (Sin fondo propio) */}
      <header className="max-w-6xl mx-auto h-16 md:h-24 px-4 flex items-center justify-between gap-2">
        <button 
          type="button"
          onClick={onEditSearch} 
          className="flex items-center gap-2 md:gap-4 min-w-0 group flex-1"
        >
          <div className="flex items-center gap-2 md:gap-4 text-slate-900 dark:text-white min-w-0">
            {/* Origen */}
            <div className="flex flex-col items-start text-left min-w-0 max-w-[85px] sm:max-w-[120px] md:max-w-[160px] min-h-[34px] justify-center">
              <span className="text-[12px] md:text-[14px] font-black uppercase tracking-tighter leading-[1.1] line-clamp-2 group-hover:text-blue-500 transition-colors">
                {originDetail?.nombre || '...'}
              </span>
              <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter truncate w-full">
                {originDetail?.provincia || '...'}
              </span>
            </div>

            <ArrowRight size={14} className="text-blue-500 shrink-0 opacity-70 group-hover:translate-x-1 transition-transform" />

            {/* Destino */}
            <div className="flex flex-col items-start text-left min-w-0 max-w-[85px] sm:max-w-[120px] md:max-w-[160px] min-h-[34px] justify-center">
              <span className="text-[12px] md:text-[14px] font-black uppercase tracking-tighter leading-[1.1] line-clamp-2 group-hover:text-blue-500 transition-colors">
                {destinationDetail?.nombre || '...'}
              </span>
              <span className="text-[9px] font-bold opacity-40 uppercase tracking-tighter truncate w-full">
                {destinationDetail?.provincia || '...'}
              </span>
            </div>
          </div>
        </button>

        {/* Badge Trenes */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full shrink-0">
          <TrainFront size={13} className={`text-blue-500 ${loading ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] font-black dark:text-blue-400 tabular-nums uppercase">
            {loading ? '...' : `${count} Trenes`}
          </span>
        </div>
      </header>

      {/* 2. Selector de Fechas (Integrado sin bordes extra) */}
      <DateMinSelector 
        date={date} 
        loading={loading} 
        onDateChange={onDateChange} 
      />
    </div>
  );
};