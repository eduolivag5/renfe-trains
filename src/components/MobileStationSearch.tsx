import { useState, useEffect, useCallback, memo } from 'react';
import { 
  MapPin, Navigation2, Loader2, Calendar as CalendarIcon, 
  ArrowRightLeft, Search, X 
} from 'lucide-react';
import { format, startOfDay } from 'date-fns'; // Importamos startOfDay
import { es } from 'date-fns/locale';
import { estacionesService } from '../api/estacionesService';
import CustomCalendar from '../ui/CustomCalendar';
import { AnimatePresence, motion } from 'framer-motion';

interface Estacion {
  codigo: string;
  nombre: string;
}

const StationItem = memo(({ est, onClick }: { est: Estacion, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 py-4 active:bg-slate-50 dark:active:bg-white/5 rounded-xl px-2 touch-manipulation"
  >
    <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
      <MapPin size={18} />
    </div>
    <div className="text-left flex-1 border-b border-slate-50 dark:border-white/5 pb-2">
      <p className="font-bold">{est.nombre}</p>
      <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{est.codigo}</p>
    </div>
  </button>
));

const MobileStationSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [origin, setOrigin] = useState<Estacion | null>(null);
  const [destination, setDestination] = useState<Estacion | null>(null);
  
  // Inicializamos siempre al principio del día de hoy
  const [departureDate, setDepartureDate] = useState<Date>(startOfDay(new Date()));
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round');
  const [activePicker, setActivePicker] = useState<'departure' | 'return' | null>(null);
  const [searchState, setSearchState] = useState<{ query: string; field: 'origin' | 'destination' | ''; }>({ query: '', field: '' });
  const [results, setResults] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDateSelection = useCallback((selectedDate: Date) => {
    // Normalizamos la fecha seleccionada a las 00:00 para comparar solo días
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
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'auto';
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchState.query.length < 3) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await estacionesService.search(searchState.query);
        setResults(data);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchState.query]);

  const handleSwap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const oldOrigin = origin;
    setOrigin(destination);
    setDestination(oldOrigin);
  }, [origin, destination]);

  return (
    <div className="w-full px-4 font-sans text-slate-900 dark:text-white">
      
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 h-16 rounded-2xl shadow-lg flex items-center px-6 gap-4"
        >
          <Search size={20} className="text-blue-600" />
          <span className="text-base font-bold text-slate-500">¿A dónde quieres ir?</span>
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
            style={{ translateZ: 0 }}
            className="fixed inset-0 bg-white dark:bg-slate-950 z-[40] flex flex-col will-change-transform" 
          >
            <div className="px-6 pt-6 pb-2 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-black tracking-tight">Tu viaje</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 space-y-6 py-4 pb-20 overscroll-contain">
              <div className="relative p-1 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center">
                <motion.div 
                  className="absolute top-1 bottom-1 left-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm z-0"
                  animate={{ x: tripType === 'round' ? '0%' : '100%' }}
                  style={{ width: 'calc(50% - 4px)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
                <button onClick={() => setTripType('round')} className={`relative z-10 flex-1 py-2 text-sm font-bold ${tripType === 'round' ? 'text-blue-600' : 'text-slate-500'}`}>
                  Ida y vuelta
                </button>
                <button onClick={() => { setTripType('one-way'); setReturnDate(null); }} className={`relative z-10 flex-1 py-2 text-sm font-bold ${tripType === 'one-way' ? 'text-blue-600' : 'text-slate-500'}`}>
                  Solo ida
                </button>
              </div>

              <section className="relative bg-slate-50 dark:bg-white/5 rounded-2xl overflow-hidden">
                <button onClick={() => setSearchState({ query: '', field: 'origin' })} className="w-full p-5 flex items-center gap-4 text-left border-b border-white dark:border-white/5">
                  <MapPin size={20} className="text-blue-500" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Origen</p>
                    <p className={`font-bold ${!origin ? 'text-slate-300' : ''}`}>{origin?.nombre || '¿Desde dónde sales?'}</p>
                  </div>
                </button>

                <button onClick={() => setSearchState({ query: '', field: 'destination' })} className="w-full p-5 flex items-center gap-4 text-left">
                  <Navigation2 size={20} className="text-blue-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Destino</p>
                    <p className={`font-bold ${!destination ? 'text-slate-300' : ''}`}>{destination?.nombre || '¿A dónde vas?'}</p>
                  </div>
                </button>

                <motion.button 
                  whileTap={{ scale: 0.8, rotate: 180 }}
                  onClick={handleSwap}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white dark:bg-slate-800 text-blue-600 shadow-md rounded-xl z-10"
                >
                  <ArrowRightLeft size={18} className="rotate-90" />
                </motion.button>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <button onClick={() => setActivePicker('departure')} className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl text-left">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Ida</p>
                  <div className="flex items-center gap-2 font-bold">
                    <CalendarIcon size={16} className="text-blue-500" />
                    <span>{format(departureDate, 'dd MMM', { locale: es })}</span>
                  </div>
                </button>

                <button 
                  disabled={tripType === 'one-way'}
                  onClick={() => setActivePicker('return')}
                  className={`bg-slate-50 dark:bg-white/5 p-5 rounded-2xl text-left transition-opacity ${tripType === 'one-way' ? 'opacity-40' : 'opacity-100'}`}
                >
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Vuelta</p>
                  <div className="flex items-center gap-2 font-bold">
                    <CalendarIcon size={16} className={returnDate ? "text-blue-500" : "text-slate-300"} />
                    <span className={!returnDate ? 'text-slate-300' : ''}>
                      {returnDate ? format(returnDate, 'dd MMM', { locale: es }) : 'Añadir'}
                    </span>
                  </div>
                </button>
              </section>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                className="w-full bg-blue-600 h-16 rounded-2xl text-white font-black text-lg shadow-xl shadow-blue-500/20"
              >
                Buscar viajes
              </motion.button>
            </div>

            <AnimatePresence>
              {searchState.field && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 20 }}
                  className="fixed inset-0 bg-white dark:bg-slate-950 z-[60] flex flex-col pt-4"
                >
                  <div className="px-6 flex items-center gap-4 mb-4">
                    <div className="flex-1 flex items-center bg-slate-100 dark:bg-white/5 rounded-2xl px-4 py-3">
                      <Search size={18} className="text-slate-400 mr-2" />
                      <input 
                        autoFocus
                        placeholder="Buscar estación..."
                        className="bg-transparent outline-none w-full font-bold"
                        value={searchState.query}
                        onChange={(e) => setSearchState(prev => ({...prev, query: e.target.value}))}
                      />
                    </div>
                    <button onClick={() => setSearchState({query: '', field: ''})} className="text-blue-600 font-bold">Cerrar</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6">
                    {loading ? (
                      <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
                    ) : (
                      results.map(est => (
                        <StationItem 
                          key={est.codigo} 
                          est={est} 
                          onClick={() => {
                            if (searchState.field === 'origin') setOrigin(est);
                            else setDestination(est);
                            setSearchState({ query: '', field: '' });
                          }} 
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePicker && (
          <div className="fixed inset-0 z-[120] flex items-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActivePicker(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            />
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => { if (info.offset.y > 80) setActivePicker(null); }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              style={{ translateZ: 0 }}
              className="relative w-full bg-white dark:bg-slate-900 rounded-t-[40px] pt-3 pb-8 px-6 shadow-2xl will-change-transform"
            >
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mb-6" />
              <div className="flex justify-center pb-2">
                <CustomCalendar 
                  selectedDate={activePicker === 'departure' ? departureDate : returnDate} 
                  // Usamos startOfDay(new Date()) para que "hoy" sea seleccionable sin importar la hora actual
                  minDate={activePicker === 'return' ? departureDate : startOfDay(new Date())}
                  onDateSelect={handleDateSelection} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(MobileStationSearch);