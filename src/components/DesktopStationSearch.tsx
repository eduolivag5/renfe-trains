import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation2, Loader2, Calendar as CalendarIcon, ArrowRightLeft, Search } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { estacionesService } from '../api/estacionesService';
import CustomCalendar from '../ui/CustomCalendar';

interface Estacion {
  codigo: string;
  nombre: string;
}

const DesktopStationSearch = () => {
  const [origin, setOrigin] = useState<Estacion | null>(null);
  const [destination, setDestination] = useState<Estacion | null>(null);
  const [departureDate, setDepartureDate] = useState<Date>(startOfDay(new Date()));
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round');
  const [activePicker, setActivePicker] = useState<'departure' | 'return' | null>(null);
  const [query, setQuery] = useState({ text: '', field: '' as 'origin' | 'destination' | '' });
  const [results, setResults] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  const handleDateSelection = useCallback((selectedDate: Date) => {
    const normalizedSelected = startOfDay(selectedDate);
    if (activePicker === 'departure') {
      setDepartureDate(normalizedSelected);
      if (returnDate && normalizedSelected > returnDate) {
        setReturnDate(normalizedSelected);
      }
    } else if (activePicker === 'return') {
      if (normalizedSelected >= departureDate) {
        setReturnDate(normalizedSelected);
      }
    }
    setActivePicker(null);
  }, [activePicker, departureDate, returnDate]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.text.length >= 3) {
        setLoading(true);
        try {
          const data = await estacionesService.search(query.text);
          setResults(data);
        } catch { setResults([]); }
        finally { setLoading(false); }
      } else { setResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query.text]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setQuery({ text: '', field: '' });
        setActivePicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectStation = (estacion: Estacion) => {
    if (query.field === 'origin') setOrigin(estacion);
    if (query.field === 'destination') setDestination(estacion);
    setQuery({ text: '', field: '' });
  };

  const swapStations = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
  };

  return (
    <div className="relative max-w-6xl mx-auto z-30 px-4 font-sans hidden lg:block" ref={searchRef}>
      
      {/* 1. SELECTOR TIPO VIAJE */}
      <div className="flex mb-3 ml-2">
        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl flex border border-slate-200/50 dark:border-white/5 relative">
          {(['round', 'one-way'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setTripType(type);
                if (type === 'one-way') setReturnDate(null);
              }}
              className={`relative z-10 px-5 py-1.5 rounded-lg text-[11px] font-bold transition-colors duration-300 ${
                tripType === type ? 'text-blue-600 dark:text-white' : 'text-slate-500'
              }`}
            >
              <span className="relative z-20">{type === 'round' ? 'Ida y vuelta' : 'Solo ida'}</span>
              {tripType === type && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white dark:bg-slate-600 shadow-sm rounded-lg z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. BOX DE BÚSQUEDA */}
      <motion.div layout className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex items-stretch overflow-visible">
        
        {/* CONTENEDOR DE SWAP (Origen y Destino) */}
        <div className="flex-[2.4] flex relative divide-x divide-slate-100 dark:divide-white/5">
          
          {/* ORIGEN */}
          <motion.div 
            layout
            key={origin?.codigo || 'origin-empty'}
            className="flex-1 relative p-4 transition-colors"
          >
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">Origen</label>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-500 shrink-0" />
              <input 
                type="text"
                className="bg-transparent border-none outline-none w-full text-base font-bold dark:text-white placeholder:text-slate-300"
                placeholder="¿De dónde sales?"
                value={query.field === 'origin' ? query.text : (origin?.nombre || '')}
                onFocus={() => { setQuery({ text: '', field: 'origin' }); setActivePicker(null); }}
                onChange={(e) => setQuery({ ...query, text: e.target.value })}
              />
            </div>
          </motion.div>

          {/* BOTÓN DE INTERCAMBIO */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={swapStations}
              className="pointer-events-auto p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-full shadow-lg text-slate-400 transition-all flex items-center justify-center"
            >
              <ArrowRightLeft size={16} />
            </motion.button>
          </div>

          {/* DESTINO */}
          <motion.div 
            layout
            key={destination?.codigo || 'dest-empty'}
            className="flex-1 relative p-4 transition-colors"
          >
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider ml-4">Destino</label>
            <div className="flex items-center gap-2 ml-4">
              <Navigation2 size={18} className="text-blue-500 shrink-0" />
              <input 
                type="text"
                className="bg-transparent border-none outline-none w-full text-base font-bold dark:text-white placeholder:text-slate-300"
                placeholder="¿A dónde vas?"
                value={query.field === 'destination' ? query.text : (destination?.nombre || '')}
                onFocus={() => { setQuery({ text: '', field: 'destination' }); setActivePicker(null); }}
                onChange={(e) => setQuery({ ...query, text: e.target.value })}
              />
            </div>
          </motion.div>
        </div>

        {/* SECCIÓN FECHAS */}
        <div className="flex-[1.5] flex divide-x divide-slate-100 dark:divide-white/5 border-l border-slate-100 dark:border-white/5">
          <motion.div 
            className="flex-1 p-4 cursor-pointer transition-colors" 
            onClick={() => {setActivePicker('departure'); setQuery({text:'', field:''})}}
          >
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">Salida</label>
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-500" />
              <span className="text-sm font-bold dark:text-white">{format(departureDate, 'eee, dd MMM', { locale: es })}</span>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ 
              opacity: tripType === 'one-way' ? 0.3 : 1,
              filter: tripType === 'one-way' ? 'grayscale(1)' : 'grayscale(0)',
              pointerEvents: tripType === 'one-way' ? 'none' : 'auto'
            }}
            className="flex-1 p-4 cursor-pointer transition-all"
            onClick={() => tripType === 'round' && setActivePicker('return')}
          >
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1 tracking-wider">Regreso</label>
            <div className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-500" />
              <span className="text-sm font-bold dark:text-white">
                {returnDate ? format(returnDate, 'eee, dd MMM', { locale: es }) : 'Añadir vuelta'}
              </span>
            </div>
          </motion.div>
        </div>

        {/* BOTÓN BUSCAR (LUPA) */}
        <div className="p-3 flex items-center justify-center bg-slate-50 dark:bg-white/5">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="h-full w-16 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center"
          >
            <Search size={22} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>

      {/* DROPWDOWN DE RESULTADOS */}
      <AnimatePresence>
        {query.field && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className={`absolute ${query.field === 'origin' ? 'left-4' : 'left-1/4'} w-[400px] top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-[60] overflow-hidden`}
          >
            <ResultsList loading={loading} results={results} onSelect={selectStation} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CALENDARIO */}
      <AnimatePresence>
        {activePicker && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute top-full right-0 mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] p-5 w-[400px] origin-top-right"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">
              Seleccionar fecha de {activePicker === 'departure' ? 'ida' : 'vuelta'}
            </p>
            <CustomCalendar 
              selectedDate={activePicker === 'departure' ? departureDate : returnDate} 
              minDate={activePicker === 'return' ? departureDate : startOfDay(new Date())}
              onDateSelect={handleDateSelection} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResultsList = ({ loading, results, onSelect }: any) => (
  <div className="max-h-[350px] overflow-y-auto py-2 overscroll-contain">
    {loading ? (
      <div className="flex items-center justify-center py-10 text-slate-400 gap-3">
        <Loader2 size={20} className="animate-spin text-blue-500" />
        <span className="text-sm font-medium">Buscando estaciones...</span>
      </div>
    ) : results.length > 0 ? (
      results.map((estacion: Estacion) => (
        <button
          key={estacion.codigo}
          onMouseDown={() => onSelect(estacion)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors border-b border-slate-50 dark:border-white/5 last:border-none"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400">
              <MapPin size={16} />
            </div>
            <div>
              <div className="text-sm font-bold dark:text-slate-100">{estacion.nombre}</div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">España · Renfe</div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20 px-2 py-1 rounded-md font-bold">{estacion.codigo}</span>
        </button>
      ))
    ) : (
      <div className="px-5 py-10 text-center">
        <Search size={32} className="mx-auto text-slate-200 mb-3" />
        <p className="text-sm text-slate-400">Escribe al menos 3 letras para buscar</p>
      </div>
    )}
  </div>
);

export default memo(DesktopStationSearch);