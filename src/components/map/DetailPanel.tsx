import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Navigation2, ChevronDown, ChevronUp, Loader2, AlertCircle, Radio, Eye } from 'lucide-react';
import { trainsService, type TrainMap, type TrainDetail } from '../../api/trainsService';
import { COLORS } from './MapConstants';
import TrainItinerary from './TrainItinerary';
import { getMapTrainInfo, isRodalies } from '../../utils/trainUtils';
import { useTrainAlerts } from '../../hooks/useTrainAlerts';
import { AlertsButton, AlertsList } from '../alerts/TrainAlerts';
import { useSheetMotion } from '../../hooks/useSheetMotion';
import { useBreakpoint } from '../../hooks/use-breakpoint';

/** PC: aparece desde abajo con un recorrido corto y frenada suave; al cerrar, se desvanece bajando un poco */
const DESKTOP_MOTION = {
  initial: { opacity: 0, y: 48 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: 24, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as const } },
};

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
  // Móvil: animación común de los paneles (fundido + 16 px, ver useSheetMotion)
  const isDesktop = useBreakpoint('md');
  const sheetMotion = useSheetMotion();
  const [detail, setDetail] = useState<TrainDetail | null>(null);
  // Avisos de la línea del tren (icono junto a cerrar; lista desplegable bajo la cabecera)
  const alerts = useTrainAlerts({ tripId: train.tripId, tipo: train.tipo, routeId: detail?.routeId });
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);
  
  // Referencia para controlar el scroll de la lista de paradas
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Rodalies mantiene la cabecera original; el resto muestra logo nuevo + familia
  const rodalies = isRodalies(train.tipo);
  const info = rodalies ? null : getMapTrainInfo(train.tipo);
  const isCercanias = train.tipo.startsWith('C') || train.tipo === 'CERCANIAS';
  const accent = info?.family?.color ?? (isCercanias ? COLORS.cercanias : COLORS.altaVelocidad);
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
      {...(isDesktop ? DESKTOP_MOTION : sheetMotion)}
      className="absolute bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] md:bottom-6 left-0 right-0 z-50 px-3 pointer-events-none"
    >
      <div className={`
        mx-auto max-w-lg rounded-[26px] pointer-events-auto overflow-hidden
        shadow-[0_-8px_48px_rgba(0,0,0,0.28)]
        bg-white border border-accent-50
        dark:bg-[#0d0d1f] dark:border-accent-500/15
      `}>
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)` }} />
        
        <div className="flex justify-center pt-2.5">
          <div className="w-9 h-[3px] rounded-full bg-accent-200/70 dark:bg-accent-500/25" />
        </div>

        <div className="px-5 pt-3 pb-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {info ? (
                <div className="mb-2.5 space-y-2">
                  {/* Logo del servicio + código de línea/subtipo */}
                  <div className="flex items-center gap-2.5">
                    <img
                      src={info.logo.src}
                      alt={train.tipo}
                      className={`h-6 w-auto max-w-[140px] object-contain object-left ${info.logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
                    />
                    {info.code && (
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[11px] font-black leading-none text-white"
                        style={{ backgroundColor: accent }}
                      >
                        {info.code}
                      </span>
                    )}
                  </div>
                  {/* Familia + estado */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {info.family && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10px] font-black uppercase tracking-[0.08em] bg-[var(--fam-bg)] text-[var(--fam)] dark:bg-white/[0.06] dark:text-slate-200"
                        style={{
                          '--fam': info.family.color,
                          '--fam-bg': `${info.family.color}14`,
                          borderColor: `${info.family.color}40`,
                        } as React.CSSProperties}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: info.family.color }} />
                        {info.family.name}
                      </span>
                    )}
                    <span className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400">
                      {translatedStatus}
                    </span>
                  </div>
                </div>
              ) : (
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
              )}
              <h2 className="text-[22px] font-black tracking-tight leading-none truncate text-accent-950 dark:text-white">
                {train.label}
              </h2>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-1.5">
              <AlertsButton size="sm" count={alerts.length} open={alertsOpen} onToggle={() => setAlertsOpen((v) => !v)} />
              <button
                onClick={onClose} 
                aria-label="Cerrar"
                className="p-2 rounded-full transition text-slate-400 hover:text-accent-900 hover:bg-accent-50 dark:text-slate-500 dark:hover:text-white dark:hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {alerts.length > 0 && <AlertsList alerts={alerts} open={alertsOpen} />}

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-[12px] tracking-wider bg-accent-50 border border-accent-100 text-accent-400 dark:bg-accent-500/[0.07] dark:border-accent-500/[0.12] dark:text-accent-300">
            <Navigation2 size={12} style={{ color: accent }} className="shrink-0" />
            {train.lat.toFixed(5)}°N &nbsp; {Math.abs(train.lon).toFixed(5)}°W
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] bg-red-50 text-red-500 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/15">
              <AlertCircle size={12} className="shrink-0" /> {error}
            </div>
          )}

          {/* Itinerario: apertura con grid-template-rows (CSS nativo) + fundido con transform */}
          {detail && (
            <div
              className={`grid transition-[grid-template-rows] duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${
                showItinerary ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
              inert={!showItinerary}
              aria-hidden={!showItinerary}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={`flex flex-col space-y-2 transition-[opacity,transform] duration-300 ease-out ${
                    showItinerary ? 'translate-y-0 opacity-100 delay-75' : '-translate-y-1.5 opacity-0'
                  }`}
                >
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
                  className="mx-auto text-[11px] font-semibold text-slate-500 hover:text-accent-600 dark:text-slate-400 dark:hover:text-accent-400 flex items-center gap-1 py-1 px-3 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mt-1"
                >
                  <Eye size={12} />
                  Ir al origen del trayecto
                </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleItinerary}
            disabled={loading}
            style={!loading && !showItinerary ? { 
              background: `linear-gradient(135deg, ${accent}dd, ${accent})`, 
              boxShadow: `0 4px 20px ${accent}45` 
            } : undefined}
            className={`
              w-full py-3.5 rounded-[13px] font-bold text-[13px] tracking-wide 
              flex items-center justify-center gap-2 transition duration-150 active:scale-[0.98] disabled:opacity-50
              ${loading || showItinerary 
                ? 'bg-accent-50 text-accent-400 border border-accent-100 dark:bg-accent-500/10 dark:text-accent-400 dark:border-accent-500/15' 
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