// components/map/DetailPanel.tsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation2, ChevronDown, ChevronUp, Loader2, AlertCircle, Radio } from 'lucide-react';
import { trainsService, type TrainMap, type TrainDetail } from '../../api/trainsService';
import { COLORS } from './MapConstants';

interface DetailPanelProps {
  train: TrainMap;
  onClose: () => void;
  isDarkMode: boolean;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ train, onClose, isDarkMode }) => {
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);

  const isCercanias = train.tipo === 'CERCANIAS';
  const accent = isCercanias ? COLORS.cercanias : COLORS.other;
  const accentLight = isCercanias ? '#ede9fe' : '#dbeafe';

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
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.85 }}
      className="absolute bottom-0 left-0 right-0 z-50 px-3 pointer-events-none"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className={`
        mx-auto max-w-lg rounded-[26px] pointer-events-auto overflow-hidden
        shadow-[0_-8px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl
        ${isDarkMode ? 'bg-[#0d0d1f]/96 border border-violet-500/15' : 'bg-white/97 border border-indigo-50'}
      `}>
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)` }} />
        <div className="flex justify-center pt-2.5">
          <div className={`w-9 h-[3px] rounded-full ${isDarkMode ? 'bg-violet-500/25' : 'bg-indigo-200/70'}`} />
        </div>

        <div className="px-5 pt-3 pb-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-[3px] rounded-full"
                  style={{ background: isDarkMode ? accent + '22' : accentLight, color: accent, border: `1px solid ${accent}30` }}>
                  <Radio size={8} /> {train.tipo}
                </span>
                <span className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {train.status}
                </span>
              </div>
              <h2 className={`text-[22px] font-black tracking-tight leading-none truncate ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
                {train.label}
              </h2>
            </div>
            <button onClick={onClose} className={`ml-3 p-2 rounded-full transition-all ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-indigo-900 hover:bg-indigo-50'}`}>
              <X size={16} />
            </button>
          </div>

          <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-[12px] tracking-wider ${isDarkMode ? 'bg-violet-500/[0.07] border border-violet-500/[0.12] text-violet-300' : 'bg-indigo-50 border border-indigo-100 text-indigo-400'}`}>
            <Navigation2 size={12} style={{ color: accent }} className="shrink-0" />
            {train.lat.toFixed(5)}°N &nbsp; {Math.abs(train.lon).toFixed(5)}°W
          </div>

          {error && (
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] ${isDarkMode ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-red-50 text-red-500 border border-red-100'}`}>
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence>
            {showItinerary && detail && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className={`rounded-xl overflow-hidden border ${isDarkMode ? 'border-violet-500/10' : 'border-indigo-50'}`}>
                  {detail.itinerary.slice(0, 9).map((stop, i) => (
                    <div key={i} className={`flex items-center gap-3 px-3.5 py-[9px] text-[12px] ${stop.isPassed ? 'opacity-35' : ''} ${isDarkMode ? (i % 2 === 0 ? 'bg-white/[0.03]' : '') : (i % 2 === 0 ? 'bg-indigo-50/60' : 'bg-white')}`}>
                      <div className="flex flex-col items-center self-stretch py-px gap-[2px] shrink-0">
                        <div className="w-px flex-1" style={{ background: stop.isPassed ? '#94a3b830' : accent + '35' }} />
                        <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: stop.isPassed ? '#94a3b8' : accent }} />
                        <div className="w-px flex-1" style={{ background: stop.isPassed ? '#94a3b830' : accent + '35' }} />
                      </div>
                      <span className={`flex-1 font-medium truncate ${isDarkMode ? 'text-violet-100' : 'text-indigo-900'}`}>
                        {stop.stopName}
                      </span>
                      <span className={`font-mono tabular-nums shrink-0 text-[11px] ${isDarkMode ? 'text-violet-400' : 'text-indigo-300'}`}>
                        {stop.actualArrival || stop.scheduledArrival}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleItinerary}
            disabled={loading}
            style={!loading && !showItinerary ? { background: `linear-gradient(135deg, ${accent}dd, ${accent})`, boxShadow: `0 4px 20px ${accent}45` } : undefined}
            className={`w-full py-3.5 rounded-[13px] font-bold text-[13px] tracking-wide flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${loading || showItinerary ? (isDarkMode ? 'bg-violet-500/10 text-violet-400 border border-violet-500/15' : 'bg-indigo-50 text-indigo-400 border border-indigo-100') : 'text-white'}`}
          >
            {loading ? <><Loader2 size={13} className="animate-spin" /> Cargando…</> : showItinerary ? <><ChevronUp size={13} /> Ocultar itinerario</> : <><ChevronDown size={13} /> Ver itinerario</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DetailPanel;