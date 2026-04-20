// components/map/LiveCounter.tsx
import { motion } from 'framer-motion';

interface LiveCounterProps {
  count: number;
  lastUpdate: Date | null;
  isDarkMode: boolean;
}

export const LiveCounter: React.FC<LiveCounterProps> = ({ count, lastUpdate, isDarkMode }) => {
  const timeString = lastUpdate 
    ? lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        absolute top-6 left-6 z-40 flex items-center gap-3 px-4 py-2 rounded-full
        backdrop-blur-md border shadow-xl pointer-events-none select-none
        ${isDarkMode
          ? 'bg-slate-900/70 border-white/10 text-white'
          : 'bg-white/70 border-slate-200 text-slate-900'}
      `}
    >
      {/* Indicador de Punto Vivo */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black tabular-nums tracking-tighter">
            {count.toLocaleString('es-ES')}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider opacity-60`}>
            Trenes
          </span>
        </div>
      </div>

      {/* Separador Vertical */}
      <div className={`h-4 w-[1px] ${isDarkMode ? 'bg-white/20' : 'bg-slate-300'}`} />

      {/* Reloj de Actualización */}
      <div className="flex items-center gap-1.5">
        <svg 
          className={`w-3 h-3 ${isDarkMode ? 'text-violet-400' : 'text-indigo-500'}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-[11px] font-bold tabular-nums opacity-80 ${isDarkMode ? 'text-violet-200' : 'text-indigo-600'}`}>
          {timeString}
        </span>
      </div>
    </motion.div>
  );
};