import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowUpDown, Search, X } from 'lucide-react'; // Cambiado a ArrowUpDown
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { estacionesService } from '../../api/estacionesService';
import CustomCalendar from '../../ui/CustomCalendar';
import { StationTrigger, DateTrigger } from './StationTriggers';
import { StationPanel } from './StationPanel';

interface Estacion { codigo: string; nombre: string; }
type ActiveField = 'origin' | 'destination' | null;
type ActivePicker = 'departure' | null;

const MOBILE_NAV_CLEARANCE = 96;

const StationSearch = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Estados de búsqueda
  const [origin, setOrigin] = useState<Estacion | null>(null);
  const [destination, setDestination] = useState<Estacion | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>(startOfDay(new Date()));
  
  // Estados de animación y UI
  const [rotation, setRotation] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda de estaciones
  useEffect(() => {
    if (query.length < 3) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try { setResults(await estacionesService.search(query)); }
      catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar paneles al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openField = (field: ActiveField) => {
    setActiveField(field);
    setQuery('');
    setResults([]);
    setActivePicker(null);
  };

  const selectStation = (estacion: Estacion) => {
    if (activeField === 'origin') setOrigin(estacion);
    if (activeField === 'destination') setDestination(estacion);
    setActiveField(null);
    setQuery('');
  };

  const swapStations = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(prev => prev + 180);
    
    const prevOrigin = origin;
    setOrigin(destination);
    setDestination(prevOrigin);
    
    setIsSwapped(!isSwapped);
  };

  const handleDateSelection = useCallback((selectedDate: Date) => {
    setDepartureDate(startOfDay(selectedDate));
    setActivePicker(null);
  }, []);

  const handleSearch = () => {
    if (!origin || !destination) return;
    const params = new URLSearchParams({
      origin: origin.codigo,
      destination: destination.codigo,
      date: format(departureDate, 'yyyy-MM-dd'),
    });
    navigate(`/trenes?${params.toString()}`);
  };

  // Sub-componente interno para manejar el LayoutId en vertical
  const RenderStation = ({ type }: { type: 'origin' | 'destination' }) => (
    <motion.div
      layout
      layoutId={`station-${type}`}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className="w-full" // Ocupa todo el ancho
    >
      <div className="w-full hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl">
        <StationTrigger
          icon={type}
          label={type === 'origin' ? "Origen" : "Destino"}
          value={type === 'origin' ? origin?.nombre : destination?.nombre}
          placeholder={type === 'origin' ? "¿Desde dónde?" : "¿A dónde vas?"}
          onClick={() => openField(type)}
        />
      </div>
    </motion.div>
  );

  return (
    <div ref={containerRef} className="relative w-full max-w-md mx-auto font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-100 dark:border-white/[0.05]">
        
        <div className="p-2" />

        {/* Contenedor Vertical de Estaciones */}
        <div className="px-4 relative flex flex-col items-center">
          <LayoutGroup>
            <div className="w-full flex flex-col relative">
              {!isSwapped ? (
                <>
                  <RenderStation type="origin" />
                  <RenderStation type="destination" />
                </>
              ) : (
                <>
                  <RenderStation type="destination" />
                  <RenderStation type="origin" />
                </>
              )}

              {/* Botón de Swap Flotante en el medio a la derecha */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                <SwapButton rotation={rotation} onClick={swapStations} />
              </div>
            </div>
          </LayoutGroup>
        </div>

        <div className="h-2" />

        {/* Date (Debajo de todo) */}
        <div className="px-4 border-t border-slate-100 dark:border-white/[0.07]">
          <div className="w-full hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl">
            <DateTrigger 
              label="Fecha de viaje" 
              date={format(departureDate, "eeee dd 'de' MMMM", { locale: es })} 
              active 
              onClick={() => { setActivePicker('departure'); setActiveField(null); }} 
            />
          </div>
        </div>

        {/* Botón Buscar */}
        <div className="p-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={!origin || !destination}
            className={`w-full h-14 rounded-[20px] text-[16px] font-bold flex items-center justify-center gap-3 transition-all duration-200 ${
              origin && destination
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-600'
            }`}
          >
            <Search size={20} strokeWidth={2.5} />
            Buscar trayectos
          </motion.button>
        </div>
      </div>

      {/* Panels y Modales */}
      <AnimatePresence>
        {activeField && (
          <>
            <motion.div
              key="desktop-station"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              className="hidden md:flex flex-col fixed right-0 top-0 bottom-0 w-[320px] z-[60] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-white/[0.07] shadow-[-8px_0_32px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.4)]"
            >
              <StationPanel field={activeField} query={query} onQueryChange={setQuery} results={results} loading={loading} onSelect={selectStation} onClose={() => setActiveField(null)} />
            </motion.div>
            <motion.div
              key="mobile-station"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="md:hidden fixed inset-0 z-[90] bg-white dark:bg-slate-950 flex flex-col"
            >
              <StationPanel field={activeField} query={query} onQueryChange={setQuery} results={results} loading={loading} onSelect={selectStation} onClose={() => setActiveField(null)} mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePicker && (
          <>
            <div className="hidden md:block fixed inset-0 z-[100]">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActivePicker(null)} className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  key="desktop-cal"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="pointer-events-auto bg-white dark:bg-slate-900 rounded-[28px] p-8 w-[380px] shadow-2xl border border-slate-100 dark:border-white/[0.07]"
                >
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-400">Seleccionar fecha</p>
                    <button onClick={() => setActivePicker(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                      <X size={18} className="text-slate-400" />
                    </button>
                  </div>
                  <CustomCalendar selectedDate={departureDate} minDate={startOfDay(new Date())} onDateSelect={handleDateSelection} />
                </motion.div>
              </div>
            </div>

            <div className="md:hidden fixed inset-0 z-[80] flex items-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActivePicker(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
                className="relative w-full bg-white dark:bg-slate-900 rounded-t-[28px] pt-3 px-5 shadow-2xl"
              >
                <div className="w-10 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-5" />
                <CustomCalendar selectedDate={departureDate} minDate={startOfDay(new Date())} onDateSelect={handleDateSelection} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Botón de intercambio vertical mejorado
const SwapButton = ({ rotation, onClick }: { rotation: number, onClick: any }) => (
  <motion.button 
    animate={{ rotate: rotation }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    onClick={onClick}
    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-500 shadow-md transition-colors hover:border-blue-200"
  >
    <ArrowUpDown size={18} />
  </motion.button>
);

export default memo(StationSearch);