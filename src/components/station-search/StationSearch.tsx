import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { estacionesService } from '../../api/estacionesService';
import CustomCalendar from '../../ui/CustomCalendar';
import { StationTrigger, DateTrigger } from './StationTriggers';
import { StationPanel } from './StationPanel';

interface Estacion { codigo: string; nombre: string; }
type ActiveField = 'origin' | 'destination' | null;
type ActivePicker = 'departure' | 'return' | null;

const MOBILE_NAV_CLEARANCE = 96;

const StationSearch = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const [origin, setOrigin] = useState<Estacion | null>(null);
  const [destination, setDestination] = useState<Estacion | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>(startOfDay(new Date()));
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round');

  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(false);

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
    setOrigin(destination);
    setDestination(origin);
  };

  const handleDateSelection = useCallback((selectedDate: Date) => {
    const d = startOfDay(selectedDate);
    if (activePicker === 'departure') {
      setDepartureDate(d);
      if (returnDate && d > returnDate) setReturnDate(d);
    } else if (activePicker === 'return' && d >= departureDate) {
      setReturnDate(d);
    }
    setActivePicker(null);
  }, [activePicker, departureDate, returnDate]);

  const handleSearch = () => {
    if (!origin || !destination) return;
    const params = new URLSearchParams({
      origin: origin.codigo,
      destination: destination.codigo,
      date: format(departureDate, 'yyyy-MM-dd'),
    });
    if (tripType === 'round' && returnDate) params.append('returnDate', format(returnDate, 'yyyy-MM-dd'));
    navigate(`/trenes?${params.toString()}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_2px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.4)] overflow-hidden">
        
        {/* Trip type */}
        <div className="flex gap-1 p-2.5 pb-0">
          {(['round', 'one-way'] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setTripType(type); if (type === 'one-way') setReturnDate(null); }}
              className={`flex-1 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
                tripType === type ? 'bg-slate-100 dark:bg-white/10 text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {type === 'round' ? 'Ida y vuelta' : 'Solo ida'}
            </button>
          ))}
        </div>

        {/* Stations */}
        <div className="flex items-center px-3 py-1 border-b border-slate-100 dark:border-white/[0.07]">
          <StationTrigger icon="origin" label="Origen" value={origin?.nombre} placeholder="¿Desde dónde?" onClick={() => openField('origin')} />
          <motion.button whileTap={{ scale: 0.85, rotate: 180 }} onClick={swapStations}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 flex items-center justify-center shrink-0 text-slate-400">
            <ArrowUpDown size={13} />
          </motion.button>
          <StationTrigger icon="destination" label="Destino" value={destination?.nombre} placeholder="¿A dónde vas?" onClick={() => openField('destination')} />
        </div>

        {/* Dates */}
        <div className="flex border-b border-slate-100 dark:border-white/[0.07]">
          <DateTrigger label="Ida" date={format(departureDate, 'eee dd MMM', { locale: es })} active onClick={() => { setActivePicker('departure'); setActiveField(null); }} />
          <div className="w-px bg-slate-100 dark:bg-white/[0.07] my-2" />
          <DateTrigger
            label="Vuelta"
            date={returnDate ? format(returnDate, 'eee dd MMM', { locale: es }) : 'Añadir fecha'}
            active={!!returnDate}
            disabled={tripType === 'one-way'}
            onClick={() => { setActivePicker('return'); setActiveField(null); }}
          />
        </div>

        {/* Search button */}
        <div className="p-2.5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={!origin || !destination}
            className={`w-full h-12 rounded-[14px] text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              origin && destination
                ? 'bg-blue-600 text-white shadow-[0_4px_16px_rgba(0,122,255,0.3)]'
                : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600'
            }`}
          >
            <Search size={16} strokeWidth={2.5} />
            Buscar trenes
          </motion.button>
        </div>
      </div>

      {/* Panels (Desktop Sidebar & Mobile Fullscreen) */}
      <AnimatePresence>
        {activeField && (
          <>
            {/* Desktop */}
            <motion.div
              key="desktop-station"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              className="hidden md:flex flex-col fixed right-0 top-0 bottom-0 w-[320px] z-[60] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-white/[0.07] shadow-[-8px_0_32px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.4)]"
            >
              <StationPanel field={activeField} query={query} onQueryChange={setQuery} results={results} loading={loading} onSelect={selectStation} onClose={() => setActiveField(null)} />
            </motion.div>
            {/* Mobile */}
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

      {/* Calendar Popups (Desktop & Mobile) */}
      <AnimatePresence>
        {activePicker && (
          <>
            {/* Desktop Calendar */}
            <div className="hidden md:block fixed inset-0 z-[100]">
              {/* Overlay para oscurecer el fondo */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setActivePicker(null)} 
                className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" 
              />
              
              {/* Contenedor central */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  key="desktop-cal"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="pointer-events-auto bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-white/[0.07] p-8 w-[380px]"
                >
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-[13px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Seleccionar {activePicker === 'departure' ? 'ida' : 'vuelta'}
                    </p>
                    <button 
                      onClick={() => setActivePicker(null)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X size={18} className="text-slate-400" />
                    </button>
                  </div>
                  
                  <CustomCalendar 
                    selectedDate={activePicker === 'departure' ? departureDate : returnDate} 
                    minDate={activePicker === 'return' ? departureDate : startOfDay(new Date())} 
                    onDateSelect={handleDateSelection} 
                  />
                </motion.div>
              </div>
            </div>

            {/* Mobile Calendar Bottom Sheet */}
            <div className="md:hidden fixed inset-0 z-[80] flex items-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActivePicker(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                style={{ paddingBottom: MOBILE_NAV_CLEARANCE }}
                className="relative w-full bg-white dark:bg-slate-900 rounded-t-[28px] pt-3 px-5 shadow-2xl"
              >
                <div className="w-10 h-1 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400 text-center mb-4">
                  Fecha de {activePicker === 'departure' ? 'ida' : 'vuelta'}
                </p>
                <CustomCalendar selectedDate={activePicker === 'departure' ? departureDate : returnDate} minDate={activePicker === 'return' ? departureDate : startOfDay(new Date())} onDateSelect={handleDateSelection} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(StationSearch);