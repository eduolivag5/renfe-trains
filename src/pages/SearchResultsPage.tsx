import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { ArrowRight, CalendarX2, Search, Sparkles } from 'lucide-react';
import type { TrainSearchResult } from '../api/trainsService';
import { fetchSearch, getCachedSearch, prefetchSearch, searchKey } from '../api/searchCache';
import { estacionesService } from '../api/estacionesService';
import StationSearch from '../components/station-search/StationSearch';
import { dedupeTrains, processTrainData } from '../utils/trainUtils';
import { prettyName, stationCity, type StationPlace } from '../utils/stationUtils';
import PopularRoutes from '../components/search-results/PopularRoutes';
import { SearchHeader } from '../components/search-results/SearchHeader';
import { TrainResults } from '../components/search-results/TrainResults';
import type { ProcessedTrain } from '../components/search-results/TrainCard';
import TrainSkeleton from '../components/search-results/TrainSkeleton';
import SavedTrips from '../components/search-results/SavedTrips';
import { addRecentTrip, type SavedTrip } from '../utils/savedTrips';
import { Eyebrow } from '../ui/heading';
import { HEADING, LEAD } from '../ui/headingStyles';

type StationDetail = StationPlace;

/** Lista vacía estable (una nueva en cada render rehacería todos los cálculos de la lista) */
const NO_TRAINS: TrainSearchResult[] = [];

const CARD =
  'rounded-[28px] border border-slate-200/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(2,33,71,0.04),0_24px_48px_-24px_rgba(2,33,71,0.25)] dark:border-white/[0.07] dark:bg-slate-900/70 dark:shadow-none';

/* ------------------------------------------------------------------ */
/* Vista sin búsqueda: buscador + rutas populares                       */
/* ------------------------------------------------------------------ */

const SearchLanding = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-12">
      <header className="max-w-2xl space-y-4">
        <Eyebrow icon={Search}>Buscar</Eyebrow>
        <h1 className={HEADING.page}>¿A dónde quieres ir?</h1>
        <p className={LEAD}>
          Elige origen, destino y fecha para ver todos los trenes del día.
        </p>
      </header>

      <div className={CARD}>
        <StationSearch variant="wide" />
      </div>

      <SavedTrips />

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          <Sparkles size={13} /> Rutas populares
        </h2>
        <PopularRoutes />
      </section>
    </motion.div>
);

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // `key`: par de códigos al que pertenecen los nombres (al cambiar de búsqueda, los anteriores no valen)
  const [stations, setStations] = useState<{ key?: string; origin?: StationDetail; destination?: StationDetail }>({});
  const [editing, setEditing] = useState(false);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');
  const hasParams = !!(origin && destination && date);

  /* --- Trenes del día ---
     Un día ya consultado sale de la caché al instante (sin esqueleto). Si no, se pide y,
     mientras llega, se sigue mostrando la lista anterior. Con cada día cargado se precarga el
     siguiente en segundo plano: avanzar de día casi nunca espera a la red. */
  const key = hasParams ? searchKey(origin, destination, date) : '';
  const [result, setResult] = useState<{ key: string; trains: TrainSearchResult[] } | null>(null);
  const cached = key ? getCachedSearch(key) : undefined;
  const loading = hasParams && !cached && result?.key !== key;
  const trains = cached ?? result?.trains ?? NO_TRAINS;

  useEffect(() => {
    if (!hasParams) return;
    const prefetchNext = () => prefetchSearch(origin, destination, format(addDays(parseISO(date), 1), 'yyyy-MM-dd'));
    if (getCachedSearch(searchKey(origin, destination, date))) {
      prefetchNext();
      return;
    }
    let cancelled = false;
    fetchSearch(origin, destination, date)
      .then((t) => {
        if (cancelled) return;
        setResult({ key: searchKey(origin, destination, date), trains: t });
        prefetchNext();
      })
      .catch((err) => {
        console.error('Error buscando trenes:', err);
        if (!cancelled) setResult({ key: searchKey(origin, destination, date), trains: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [origin, destination, date, hasParams]);

  // Nombre y provincia de las estaciones
  useEffect(() => {
    if (!hasParams) return;
    Promise.all([estacionesService.getById(origin!), estacionesService.getById(destination!)])
      .then(([o, d]) => setStations({ key: `${origin}|${destination}`, origin: o, destination: d }))
      .catch((error) => console.error('Error cargando detalles de estaciones:', error));
  }, [origin, destination, hasParams]);

  // Trayecto actual con nombres (para favoritos, compartir y "recientes")
  const trip = useMemo<SavedTrip | undefined>(() => {
    if (!hasParams || stations.key !== `${origin}|${destination}` || !stations.origin || !stations.destination) return undefined;
    return { origin: origin!, destination: destination!, originName: stations.origin.nombre, destinationName: stations.destination.nombre };
  }, [hasParams, origin, destination, stations]);

  // Cada búsqueda queda en "Tus trayectos" como reciente
  useEffect(() => {
    if (trip) addRecentTrip(trip);
  }, [trip]);

  // Sin trenes repetidos (el GTFS trae a veces el mismo tren dos veces, ver dedupeTrains)
  const processedTrains = useMemo(() => processTrainData(dedupeTrains(trains)) as ProcessedTrain[], [trains]);

  const handleDateChange = (newDate: string) => {
    if (newDate === date) return;
    // Día nuevo, lista nueva: se vuelve arriba para ver los primeros trenes (el scroll vive en <main>)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchParams(
      (prev) => {
        prev.set('date', newDate);
        return prev;
      },
      { replace: true },
    );
  };

  /* --- Móvil: deslizar a izquierda/derecha sobre la lista cambia de día ---
     Solo gestos claramente horizontales (60 px y el doble que en vertical, para no confundirlos
     con el scroll) y nunca dentro de zonas que se desplazan en horizontal (data-no-swipe). */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touch.current = (e.target as Element).closest('[data-no-swipe]') || e.touches.length > 1 ? null : { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start || !date) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
    const current = parseISO(date);
    if (dx < 0) handleDateChange(format(addDays(current, 1), 'yyyy-MM-dd'));
    else if (format(current, 'yyyy-MM-dd') > format(new Date(), 'yyyy-MM-dd')) handleDateChange(format(subDays(current, 1), 'yyyy-MM-dd'));
  };

  if (!hasParams) return <SearchLanding />;

  const nextDay = format(addDays(parseISO(date!), 1), 'yyyy-MM-dd');
  const stationsReady = !!(stations.origin && stations.destination);

  return (
    <div className="pb-12 [&>*+*:not(header)]:mt-7 md:[&>*+*:not(header)]:mt-5">
      {/* Resumen del trayecto y tira de días: fijo arriba al hacer scroll. Sin envoltorio: el
          contenedor de un sticky tiene que ser la página entera para que acompañe todo el scroll */}
      <SearchHeader
        originDetail={stations.origin}
        destinationDetail={stations.destination}
        trip={trip}
        date={date!}
        loading={loading}
        editing={editing}
        onDateChange={handleDateChange}
        onEditSearch={() => setEditing((v) => !v)}
      />

      {/* Modificar búsqueda: el buscador, ya relleno, se despliega aquí mismo */}
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className={`relative z-20 ${CARD}`}
          >
            <StationSearch
              key={`${origin}-${destination}-${date}-${stationsReady}`}
              variant="wide"
              initialOrigin={stations.origin ? { codigo: origin!, ...stations.origin } : null}
              initialDestination={stations.destination ? { codigo: destination!, ...stations.destination } : null}
              initialDate={parseISO(date!)}
              onSearch={() => setEditing(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      {/* touch-pan-y: el navegador solo gestiona el scroll vertical; el gesto horizontal es nuestro
          (cambiar de día) y no dispara el "atrás" del navegador. La fila de filtros, que se desplaza
          en horizontal, sigue funcionando: es su propio contenedor de scroll */}
      <div className="flex min-w-0 touch-pan-y flex-col gap-3" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Al cambiar de día, TrainResults sigue montado con los trenes anteriores y solo la lista
            pasa a esqueleto: la barra de filtros no desaparece (la lista no sube) y los filtros
            elegidos se conservan. El esqueleto suelto es solo para la primera carga. */}
        {loading && processedTrains.length === 0 ? (
          <div className="grid gap-2.5 2xl:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <TrainSkeleton key={i} />)}</div>
        ) : processedTrains.length > 0 ? (
          <TrainResults
            // Cada trayecto, su propio estado: el orden y los filtros guardados de ese trayecto
            key={`${origin}|${destination}`}
            routeKey={`${origin}|${destination}`}
            loading={loading}
            trains={processedTrains}
            date={date!}
            route={
              stationsReady
                ? {
                    from: stationCity(stations.origin!),
                    to: stationCity(stations.destination!),
                    fromStation: prettyName(stations.origin!.nombre),
                    toStation: prettyName(stations.destination!.nombre),
                  }
                : undefined
            }
            onNextDay={() => handleDateChange(nextDay)}
          />
        ) : (
          !loading && (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 px-6 py-16 text-center dark:border-white/10">
              <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                <CalendarX2 size={28} />
              </span>
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">No hay trenes este día</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                No encontramos trenes directos
                {stationsReady && (
                  <>
                    {' '}entre <strong className="font-semibold text-slate-700 dark:text-slate-200">{prettyName(stations.origin!.nombre)}</strong> y{' '}
                    <strong className="font-semibold text-slate-700 dark:text-slate-200">{prettyName(stations.destination!.nombre)}</strong>
                  </>
                )}{' '}
                para la fecha elegida.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDateChange(nextDay)}
                  className="flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(124,58,237,0.9)] transition-transform active:scale-95"
                >
                  Ver día siguiente <ArrowRight size={15} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-white/[0.06] dark:text-slate-200"
                >
                  Cambiar estaciones
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
