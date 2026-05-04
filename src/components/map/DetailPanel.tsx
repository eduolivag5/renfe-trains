import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation2, ChevronDown, ChevronUp, Loader2, AlertCircle, Radio } from 'lucide-react';
import { trainsService, type TrainMap, type TrainDetail } from '../../api/trainsService';
import { COLORS } from './MapConstants';
import TrainItinerary from './TrainItinerary';

interface DetailPanelProps {
  train: TrainMap;
  onClose: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ train, onClose }) => {
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);

  const isCercanias = train.tipo === 'CERCANIAS';
  const accent = isCercanias ? COLORS.cercanias : COLORS.other;

  const handleItinerary = useCallback(async () => {
    if (showItinerary) { setShowItinerary(false); return; }
    if (detail) { setShowItinerary(true); return; }
    
    setLoading(true);
    setError(null);
    try {
      const data = await trainsService.getDetail(train.tripId);
      setDetail(data);
      setShowItinerary(true);
    } catch {
      setError('No se pudo cargar el itinerario.');
    } finally {
      setLoading(false);
    }
  }, [detail, showItinerary, train.tripId]);

  return (
    <motion.div
      initial={{ y: '150%' }} 
      animate={{ y: 0 }}
      exit={{ y: '150%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.85 }}
      className="absolute bottom-24 md:bottom-6 left-0 right-0 z-50 px-3 pointer-events-none"
    >
      <div className={`
        mx-auto max-w-lg rounded-[26px] pointer-events-auto overflow-hidden
        shadow-[0_-8px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl
        bg-white/97 border border-indigo-50
        dark:bg-[#0d0d1f]/96 dark:border-violet-500/15
      `}>
        {/* Línea de acento superior */}
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)` }} />
        
        {/* Manejador visual superior */}
        <div className="flex justify-center pt-2.5">
          <div className="w-9 h-[3px] rounded-full bg-indigo-200/70 dark:bg-violet-500/25" />
        </div>

        <div className="px-5 pt-3 pb-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span 
                  className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-[3px] rounded-full border"
                  style={{ 
                    backgroundColor: `${accent}20`, // Opacidad del 12% aprox para el fondo
                    color: accent, 
                    borderColor: `${accent}30` 
                  }}
                >
                  <Radio size={8} /> {train.tipo}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {train.status}
                </span>
              </div>
              <h2 className="text-[22px] font-black tracking-tight leading-none truncate text-indigo-950 dark:text-white">
                {train.label}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="ml-3 p-2 rounded-full transition-all text-slate-400 hover:text-indigo-900 hover:bg-indigo-50 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {/* Coordenadas */}
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-[12px] tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-400 dark:bg-violet-500/[0.07] dark:border-violet-500/[0.12] dark:text-violet-300">
            <Navigation2 size={12} style={{ color: accent }} className="shrink-0" />
            {train.lat.toFixed(5)}°N &nbsp; {Math.abs(train.lon).toFixed(5)}°W
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/15">
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence>
            {showItinerary && detail && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="overflow-hidden"
              >
                <TrainItinerary 
                  itinerary={detail.itinerary} 
                  accent={accent} 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleItinerary}
            disabled={loading}
            style={!loading && !showItinerary ? { 
              background: `linear-gradient(135deg, ${accent}dd, ${accent})`, 
              boxShadow: `0 4px 20px ${accent}45` 
            } : undefined}
            className={`
              w-full py-3.5 rounded-[13px] font-bold text-[13px] tracking-wide 
              flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50
              ${loading || showItinerary 
                ? 'bg-indigo-50 text-indigo-400 border border-indigo-100 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/15' 
                : 'text-white'
              }
            `}
          >
            {loading ? (
              <><Loader2 size={13} className="animate-spin" /> Cargando…</>
            ) : showItinerary ? (
              <><ChevronUp size={13} /> Ocultar itinerario</>
            ) : (
              <><ChevronDown size={13} /> Ver itinerario</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DetailPanel;