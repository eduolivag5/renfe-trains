import React from 'react';
import { motion } from 'framer-motion';
import { COLORS } from './MapConstants';

interface LiveCounterProps {
  count: number;
  lastUpdate: Date | null;
}

export const LiveCounter: React.FC<LiveCounterProps> = ({ count, lastUpdate }) => {
  const timeString = lastUpdate 
    ? lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : '--:--:--';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="
        absolute top-6 left-6 z-40 flex flex-col gap-3 p-2 rounded-[24px]
        backdrop-blur-md border shadow-xl pointer-events-none select-none w-[260px]
        bg-white/70 border-slate-200 text-slate-900
        dark:bg-slate-900/70 dark:border-white/10 dark:text-white
      "
    >
      {/* SECCIÓN SUPERIOR: CONTADOR VIVO Y RELOJ */}
      <div className="flex items-center justify-between px-2 py-1">
        {/* Indicador de Punto Vivo */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black tabular-nums tracking-tighter">
              {count.toLocaleString('es-ES')}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 ml-1">
              Trenes
            </span>
          </div>
        </div>

        {/* Reloj de Actualización */}
        <div className="flex items-center gap-1.5">
          <svg 
            className="w-4 h-4 text-indigo-500 dark:text-violet-400" 
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs opacity-80 text-indigo-600 dark:text-violet-200">
            {timeString}
          </span>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: QUAD-LEYENDA DE COLORES EN REJILLA */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2 px-2 pb-1 text-[10px] font-bold uppercase tracking-wider">
        {/* Alta Velocidad */}
        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: COLORS.altaVelocidad }}
          />
          <span className="text-slate-500 dark:text-slate-400 truncate">Alta Vel.</span>
        </div>

        {/* Media Distancia */}
        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: COLORS.mediaDistancia || '#ff9f43' }} // Fallback cosmético si varía el naming
          />
          <span className="text-slate-500 dark:text-slate-400 truncate">Media Dist.</span>
        </div>

        {/* Cercanías */}
        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: COLORS.cercanias }}
          />
          <span className="text-slate-500 dark:text-slate-400 truncate">Cercanías</span>
        </div>

        {/* Rodalies */}
        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
            style={{ backgroundColor: COLORS.rodalies || '#ff5252' }} // Fallback cosmético si varía el naming
          />
          <span className="text-slate-500 dark:text-slate-400 truncate">Rodalies</span>
        </div>
      </div>
    </motion.div>
  );
};