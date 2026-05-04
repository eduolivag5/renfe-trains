import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, ChevronRight, Info, Loader2, AlertCircle } from 'lucide-react';
import { TRAIN_BRAND_MAP } from '../../utils/trainUtils';
import { trainsService, type TrainDetail } from '../../api/trainsService';
import TrainItinerary from '../map/TrainItinerary';

export const TrainCard = ({ train, index }: any) => {
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showItinerary, setShowItinerary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brand = TRAIN_BRAND_MAP[train.trainType] || { logo: 'AVE', color: '#002147' };

  const handleFetchDetail = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Si ya está abierto, lo cerramos
    if (showItinerary) {
      setShowItinerary(false);
      return;
    }

    // Si ya tenemos los datos, solo mostramos
    if (detail) {
      setShowItinerary(true);
      return;
    }

    // Si no, llamamos a la API
    setLoading(true);
    setError(null);
    try {
      const data = await trainsService.getDetail(train.tripId);
      setDetail(data);
      setShowItinerary(true);
    } catch (err) {
      setError('No se pudieron cargar los detalles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group relative overflow-hidden bg-white dark:bg-slate-950 rounded-[2rem] p-6 flex flex-col gap-5 border border-slate-200 dark:border-white/5 shadow-sm transition-all duration-500"
    >
      {/* 1. Fondo de Cristal y Tags (Mantengo tu diseño original) */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out z-0"
        style={{
          background: `radial-gradient(circle at 50% -20%, ${brand.color}15, transparent 70%), 
                       linear-gradient(to bottom, transparent, ${brand.color}05)`
        }}
      />
      
      <div 
        className="absolute top-0 left-0 px-4 py-1.5 rounded-br-2xl text-[10px] font-black text-white uppercase tracking-widest z-20 shadow-md"
        style={{ backgroundColor: brand.color }}
      >
        {train.trainType}
      </div>

      {/* 2. Logo Centrado */}
      <div className="flex justify-center w-full mt-2 z-10">
        <img 
          src={`/icons/Renfe_${brand.logo}.svg`} 
          alt={train.trainType} 
          className="h-9 w-auto object-contain drop-shadow-sm" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/icons/Renfe.svg';
            target.onerror = null;
          }}
        />
      </div>

      {/* 3. Bloque Central: Horarios */}
      <div className="flex items-center justify-between relative z-10 px-2">
        <div className="flex flex-col w-[85px]">
          <span className="text-3xl font-black dark:text-white tabular-nums leading-none tracking-tighter">
            {train.departureTime.substring(0, 5)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest opacity-70">Salida</span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 mb-3">
            <Timer size={12} className="text-slate-400" />
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 tabular-nums">
              {Math.floor(train.durationMin / 60)}h {train.durationMin % 60}m
            </span>
          </div>
          <div className="w-full max-w-[120px] h-[1.5px] bg-slate-200 dark:bg-white/10 relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 rounded-full" style={{ backgroundColor: brand.color }} />
          </div>
        </div>

        <div className="flex flex-col text-right w-[85px]">
          <span className="text-3xl font-black dark:text-white tabular-nums leading-none tracking-tighter">
            {train.arrivalTime.substring(0, 5)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest opacity-70">Llegada</span>
        </div>
      </div>

      {/* 4. SECCIÓN DESPLEGABLE: Itinerario */}
      <AnimatePresence>
        {showItinerary && detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden z-10"
          >
            <div className="pt-2 pb-4">
               <TrainItinerary 
                  itinerary={detail.itinerary} 
                  accent={brand.color}
               />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Mensaje de Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-[11px] font-bold px-2 z-10">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* 6. Footer con Botón "Ver detalles" */}
      <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/5 relative z-10">
        <button
          onClick={handleFetchDetail}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Info size={14} className={showItinerary ? "rotate-180 transition-transform" : ""} />
          )}
          {showItinerary ? "Ocultar detalles" : "Ver detalles"}
          {!loading && <ChevronRight size={14} className={showItinerary ? "-rotate-90 transition-transform" : "transition-transform"} />}
        </button>
      </div>
    </motion.div>
  );
};