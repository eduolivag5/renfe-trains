import { motion } from 'framer-motion';
import { Timer, Zap, ChevronRight, Info } from 'lucide-react';

const TRAIN_BRAND_MAP: Record<string, { logo: string; color: string }> = {
  'AVE': { logo: 'AVE', color: '#002147' },
  'AVE INT': { logo: 'AVE', color: '#002147' },
  'AVLO': { logo: 'AVLO', color: '#4d148c' },
  'ALVIA': { logo: 'ALVIA', color: '#002147' },
  'EUROMED': { logo: 'EUROMED', color: '#002147' },
  'INTERCITY': { logo: 'INTERCITY', color: '#002147' },
  'AVANT': { logo: 'AVANT', color: '#ee7b10' },
  'AVANT EXP': { logo: 'AVANT', color: '#ee7b10' },
  'MD': { logo: 'MD', color: '#ee7b10' },
  'REGIONAL': { logo: 'REGIONAL', color: '#ee7b10' },
  'REG.EXP.': { logo: 'REGIONAL', color: '#ee7b10' },
  'BUS': { logo: 'BUS', color: '#333333' },
  'TRENCELTA': { logo: 'TRENCELTA', color: '#002147' },
  'PROXIMIDAD': { logo: 'MD', color: '#ee7b10' },
};

export const TrainCard = ({ train, onClick, index }: any) => {
  const brand = TRAIN_BRAND_MAP[train.trainType] || { logo: 'AVE', color: '#002147' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="group relative overflow-hidden bg-white dark:bg-slate-950 rounded-[2rem] p-6 flex flex-col gap-5 border border-slate-200 dark:border-white/5 shadow-sm cursor-pointer transition-all duration-500"
    >
      {/* 1. Fondo de Cristal Reactivo (Atmósfera) */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-0"
        style={{
          background: `radial-gradient(circle at 50% -20%, ${brand.color}15, transparent 70%), 
                       linear-gradient(to bottom, transparent, ${brand.color}05)`
        }}
      />
      
      {/* Brillo sutil en el borde inferior al hacer hover */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 blur-[2px] transition-all duration-500 z-0"
        style={{ backgroundColor: brand.color }}
      />

      {/* 2. Tag Superior Izquierdo (Tipo de Tren) */}
      <div 
        className="absolute top-0 left-0 px-4 py-1.5 rounded-br-2xl text-[10px] font-black text-white uppercase tracking-widest z-20 shadow-md"
        style={{ backgroundColor: brand.color }}
      >
        {train.trainType}
      </div>

      {/* 3. Logo Centrado (Estático y a full color) */}
      <div className="flex justify-center w-full mt-2 z-10">
        <img 
          src={`/icons/Renfe_${brand.logo}.svg`} 
          alt={train.trainType} 
          className="h-9 w-auto object-contain drop-shadow-sm" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/icons/Renfe.svg'; // Imagen de fallback
            target.onerror = null; // Evita bucles infinitos si Renfe.svg tampoco existe
          }}
        />
      </div>

      {/* 4. Bloque Central: Horarios y Trayecto */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col w-[85px]">
          <span className="text-3xl font-black dark:text-white tabular-nums leading-none tracking-tighter transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {train.departureTime.substring(0, 5)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest opacity-70">Salida</span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex flex-col items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <Timer size={12} className="text-slate-400" />
              <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 tabular-nums">
                {Math.floor(train.durationMin / 60)}h {train.durationMin % 60}m
              </span>
            </div>
            
            {train.isFastest && (
              <div className="flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Zap size={10} className="text-emerald-600 fill-current" />
                <span className="text-emerald-600 text-[9px] font-black uppercase tracking-tighter">Más rápido</span>
              </div>
            )}
          </div>
          
          <div className="w-full max-w-[140px] h-[1.5px] bg-slate-200 dark:bg-white/10 relative overflow-visible">
            {/* Efecto de Brillo Incandescente en el nodo (Hover) */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full transition-all duration-500 group-hover:scale-[2.8] group-hover:blur-[3px] opacity-0 group-hover:opacity-40"
              style={{ backgroundColor: brand.color }}
            />
            {/* Nodo central físico */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full z-10 transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundColor: brand.color }}
            />
          </div>
        </div>

        <div className="flex flex-col text-right w-[85px]">
          <span className="text-3xl font-black dark:text-white tabular-nums leading-none tracking-tighter transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {train.arrivalTime.substring(0, 5)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest opacity-70">Llegada</span>
        </div>
      </div>

      {/* 5. Footer con Botón "Ver detalles" */}
      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/5 relative z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Info size={14} className="group-hover:rotate-12 transition-transform" />
          Ver detalles
          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};