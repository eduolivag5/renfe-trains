import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation2, ChevronDown, ChevronUp, Loader2, AlertCircle, Radio, Eye } from 'lucide-react';
import { trainsService, type TrainMap, type TrainDetail } from '../../api/trainsService';
import { COLORS } from './MapConstants';
import TrainItinerary from './TrainItinerary';

interface DetailPanelProps {
  train: TrainMap;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  'IN_TRANSIT_TO': 'En trayecto a',
  'INCOMING_AT': 'Llegando a',
  'STOPPED_AT': 'Detenido en',
};

const DetailPanel: React.FC<DetailPanelProps> = ({ train, onClose }) => {
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);
  
  // Referencia para controlar el scroll de la lista de paradas
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const isCercanias = train.tipo.startsWith('C') || train.tipo === 'CERCANIAS';
  const accent = isCercanias ? COLORS.cercanias : COLORS.altaVelocidad;
  const translatedStatus = STATUS_LABELS[train.status] || train.status;

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

  // Auto-scroll a la parada actual cuando se abre el itinerario por primera vez
  useEffect(() => {
    if (showItinerary && detail?.itinerary && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      // Buscamos el índice de la estación actual o la siguiente
      const currentIndex = detail.itinerary.findIndex((stop: any) => !stop.passed);
      const baseIndex = currentIndex === -1 ? detail.itinerary.length - 1 : currentIndex;

      // Estimación de altura de cada fila de parada (aprox 55px por parada en TrainItinerary)
      // Nos desplazamos para que queden visibles las paradas anteriores
      const stopHeight = 55;
      const targetScroll = Math.max(0, (baseIndex - 2) * stopHeight);

      // Scroll instantáneo inicial sin que el usuario lo note
      container.scrollTop = targetScroll;
    }
  }, [showItinerary, detail]);

  // Función para llevar al usuario suavemente al inicio de la lista
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

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
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)` }} />
        
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
                    backgroundColor: `${accent}20`,
                    color: accent, 
                    borderColor: `${accent}30` 
                  }}
                >
                  <Radio size={8} /> {train.tipo}
                </span>
                <span className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400">
                  {translatedStatus}
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

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-[12px] tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-400 dark:bg-violet-500/[0.07] dark:border-violet-500/[0.12] dark:text-violet-300">
            <Navigation2 size={12} style={{ color: accent }} className="shrink-0" />
            {train.lat.toFixed(5)}°N &nbsp; {Math.abs(train.lon).toFixed(5)}°W
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/15">
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence initial={false}>
            {showItinerary && detail && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="space-y-2 flex flex-col overflow-hidden"
              >
                {/* 
                  ALTO FIJO INMUTABLE (h-[230px]):
                  El contenedor no cambia de tamaño nunca. Evitamos tirones y bailes de Layout.
                */}
                <div 
                  ref={scrollContainerRef}
                  className="h-[230px] overflow-y-auto pr-2 scroll-smooth
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-slate-200/80
                    dark:[&::-webkit-scrollbar-thumb]:bg-slate-800
                    hover:[&::-webkit-scrollbar-thumb]:bg-slate-300
                    dark:hover:[&::-webkit-scrollbar-thumb]:bg-slate-700"
                >
                  <TrainItinerary 
                    itinerary={detail.itinerary} 
                    accent={accent} 
                  />
                </div>

                {/* Botón secundario: Ahora es un acceso directo de scroll elegante */}
                <button
                  onClick={scrollToTop}
                  className="mx-auto text-[11px] font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-violet-400 flex items-center gap-1 py-1 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mt-1"
                >
                  <Eye size={12} />
                  Ir al origen del trayecto
                </button>
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