import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ArrowUpDown, Search, X } from 'lucide-react';
import { differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { estacionesService } from '../../api/estacionesService';
import CustomCalendar from '../../ui/CustomCalendar';
import { DateField, StationField } from './StationTriggers';
import { StationPanel } from './StationPanel';
import type { Estacion } from '../../utils/stationUtils';

type Field = 'origin' | 'destination';
type Open = Field | 'date' | null;

interface StationSearchProps {
  /** "wide": barra horizontal en pantallas grandes (página /buscar). Por defecto, apilado. */
  variant?: 'stacked' | 'wide';
  initialOrigin?: Estacion | null;
  initialDestination?: Estacion | null;
  initialDate?: Date;
  /** Se llama tras lanzar la búsqueda (p. ej. para plegar el formulario) */
  onSearch?: () => void;
}

const POPOVER =
  'absolute top-full z-50 mt-2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-20px_rgba(2,33,71,0.35)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]';

/** "Hoy", "Mañana" o el día de la semana */
const relativeDay = (d: Date) => {
  const diff = differenceInCalendarDays(d, startOfDay(new Date()));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return format(d, 'EEEE', { locale: es });
};

const StationSearch = ({ variant = 'stacked', initialOrigin = null, initialDestination = null, initialDate, onSearch }: StationSearchProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const wide = variant === 'wide';

  const [origin, setOrigin] = useState<Estacion | null>(initialOrigin);
  const [destination, setDestination] = useState<Estacion | null>(initialDestination);
  const [date, setDate] = useState<Date>(() => startOfDay(initialDate ?? new Date()));
  const [open, setOpen] = useState<Open>(null);
  const [rotation, setRotation] = useState(0);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Estacion[]>([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda de estaciones con debounce
  useEffect(() => {
    if (query.trim().length < 3) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      estacionesService
        .search(query.trim())
        .then((r: Estacion[]) => !cancelled && setResults(r))
        .catch(() => !cancelled && setResults([]))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Cerrar al pulsar fuera (escritorio) o con Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (window.innerWidth < 768) return; // en móvil los paneles son a pantalla completa
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (target: Open) => {
    setOpen((cur) => (cur === target ? null : target));
    setQuery('');
    setResults([]);
  };

  const selectStation = useCallback(
    (estacion: Estacion) => {
      if (open === 'origin') {
        setOrigin(estacion);
        // Flujo guiado: tras el origen, pedimos el destino si falta
        setOpen(destination ? null : 'destination');
      } else if (open === 'destination') {
        setDestination(estacion);
        setOpen(null);
      }
      setQuery('');
      setResults([]);
    },
    [open, destination],
  );

  const swap = () => {
    setRotation((r) => r + 180);
    setOrigin(destination);
    setDestination(origin);
  };

  const selectDate = useCallback((d: Date) => {
    setDate(startOfDay(d));
    setOpen(null);
  }, []);

  const canSearch = !!origin && !!destination && origin.codigo !== destination.codigo;

  const handleSearch = () => {
    if (!canSearch) return;
    const params = new URLSearchParams({
      origin: origin.codigo,
      destination: destination.codigo,
      date: format(date, 'yyyy-MM-dd'),
    });
    setOpen(null);
    navigate(`/buscar?${params.toString()}`);
    onSearch?.();
  };

  const panelFor = (field: Field, mobile = false) => (
    <StationPanel
      field={field}
      query={query}
      onQueryChange={(v) => {
        setQuery(v);
        if (v.trim().length < 3) setResults([]);
      }}
      results={results}
      loading={loading && query.trim().length >= 3}
      onSelect={selectStation}
      onClose={() => setOpen(null)}
      excludeCode={field === 'origin' ? destination?.codigo : origin?.codigo}
      mobile={mobile}
    />
  );

  /** Popover de escritorio anclado bajo el campo */
  const desktopStationPopover = (field: Field) => (
    <AnimatePresence>
      {open === field && (
        <motion.div
          key={field}
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className={`${POPOVER} left-0 hidden max-h-[440px] w-[min(26rem,calc(100vw-3rem))] origin-top-left md:flex md:flex-col`}
        >
          {panelFor(field)}
        </motion.div>
      )}
    </AnimatePresence>
  );

  const swapButton = (
    <motion.button
      type="button"
      onClick={swap}
      aria-label="Intercambiar origen y destino"
      animate={{ rotate: rotation }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 400, damping: 24 }}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      <ArrowUpDown size={14} strokeWidth={2.5} className={wide ? 'lg:rotate-90' : ''} />
    </motion.button>
  );

  /** Separador fino: horizontal en apilado, vertical en la barra ancha */
  const divider = (
    <span
      aria-hidden
      className={`mx-4 h-px shrink-0 bg-slate-100 dark:bg-white/[0.07] ${wide ? 'lg:mx-0 lg:h-8 lg:w-px' : ''}`}
    />
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`flex flex-col p-2 ${wide ? 'lg:flex-row lg:items-center' : ''}`}>
        {/* Origen + destino */}
        <div className={`relative flex flex-col ${wide ? 'lg:min-w-0 lg:flex-[2] lg:flex-row lg:items-center' : ''}`}>
          <div className={`relative ${wide ? 'lg:min-w-0 lg:flex-1' : ''}`}>
            <StationField kind="origin" station={origin} active={open === 'origin'} onClick={() => toggle('origin')} />
            {desktopStationPopover('origin')}
          </div>

          {/* Separador con el botón de intercambio encima */}
          <div className={`relative flex items-center ${wide ? 'lg:self-stretch' : ''}`}>
            <span
              aria-hidden
              className={`mx-4 h-px flex-1 bg-slate-100 dark:bg-white/[0.07] ${wide ? 'lg:mx-0 lg:h-auto lg:w-px lg:self-stretch lg:my-3' : ''}`}
            />
            <div
              className={`absolute right-4 top-1/2 z-20 -translate-y-1/2 ${
                wide ? 'lg:left-1/2 lg:right-auto lg:-translate-x-1/2' : ''
              }`}
            >
              {swapButton}
            </div>
          </div>

          <div className={`relative ${wide ? 'lg:min-w-0 lg:flex-1 lg:pl-3' : ''}`}>
            <StationField
              kind="destination"
              station={destination}
              active={open === 'destination'}
              onClick={() => toggle('destination')}
            />
            {desktopStationPopover('destination')}
          </div>
        </div>

        {divider}

        {/* Fecha */}
        <div className={`relative ${wide ? 'lg:min-w-0 lg:flex-1' : ''}`}>
          <DateField
            label={`${relativeDay(date)}, ${format(date, 'd MMM', { locale: es }).replace('.', '')}`}
            active={open === 'date'}
            onClick={() => toggle('date')}
          />
          <AnimatePresence>
            {open === 'date' && (
              <motion.div
                key="cal"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className={`${POPOVER} hidden w-[22rem] p-5 md:block ${wide ? 'left-0 origin-top-left lg:left-auto lg:right-0 lg:origin-top-right' : 'left-0 origin-top-left'}`}
              >
                <CustomCalendar selectedDate={date} minDate={startOfDay(new Date())} onDateSelect={selectDate} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buscar */}
        <div className={`px-1 pb-1 pt-3 ${wide ? 'lg:shrink-0 lg:p-0 lg:pl-2' : ''}`}>
          <motion.button
            type="button"
            whileTap={canSearch ? { scale: 0.97 } : undefined}
            onClick={handleSearch}
            disabled={!canSearch}
            className={`flex h-13 w-full items-center justify-center gap-2 rounded-2xl px-7 text-[15px] font-bold transition-colors duration-200 ${
              wide ? 'lg:h-14 lg:w-auto' : ''
            } ${
              canSearch
                ? 'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-600'
                : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-white/[0.05] dark:text-slate-500'
            }`}
          >
            <Search size={17} strokeWidth={2.5} />
            Buscar
          </motion.button>
        </div>
      </div>

      {/* Móvil: paneles en portal (un ancestro con transform convertiría "fixed" en relativo a él) */}
      {createPortal(
        <>
      {/* ---------- Móvil: selector de estación a pantalla completa ---------- */}
      <AnimatePresence>
        {(open === 'origin' || open === 'destination') && (
          <motion.div
            key="mobile-station"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed inset-0 z-[90] flex flex-col md:hidden"
          >
            {panelFor(open, true)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Móvil: calendario en hoja inferior ---------- */}
      <AnimatePresence>
        {open === 'date' && (
          <div key="mobile-cal" className="fixed inset-0 z-[90] flex items-end md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(null)}
              className="absolute inset-0 bg-slate-950/40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="relative w-full rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 shadow-2xl dark:bg-slate-900"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 dark:bg-white/10" />
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">¿Cuándo viajas?</p>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>
              <CustomCalendar selectedDate={date} minDate={startOfDay(new Date())} onDateSelect={selectDate} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>,
        document.body,
      )}
    </div>
  );
};

export default memo(StationSearch);
