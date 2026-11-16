import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { addDays, format, parseISO } from 'date-fns';
import { ArrowRight, CalendarX2, Search, Sparkles } from 'lucide-react';
import { trainsService, type TrainSearchResult } from '../api/trainsService';
import { estacionesService } from '../api/estacionesService';
import StationSearch from '../components/station-search/StationSearch';
import { processTrainData } from '../utils/trainUtils';
import { prettyName } from '../utils/stationUtils';
import PopularRoutes from '../components/search-results/PopularRoutes';
import { SearchHeader } from '../components/search-results/SearchHeader';
import { TrainResults } from '../components/search-results/TrainResults';
import type { ProcessedTrain } from '../components/search-results/TrainCard';
import TrainSkeleton from '../components/search-results/TrainSkeleton';

interface StationDetail {
  nombre: string;
  provincia: string;
}

const CARD =
  'rounded-[28px] border border-slate-200/80 bg-white p-1.5 shadow-[0_1px_2px_rgba(2,33,71,0.04),0_24px_48px_-24px_rgba(2,33,71,0.25)] dark:border-white/[0.07] dark:bg-slate-900/70 dark:shadow-none';

/* ------------------------------------------------------------------ */
/* Vista sin búsqueda: buscador + rutas populares                       */
/* ------------------------------------------------------------------ */

const SearchLanding = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-12">
      <header className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          <Search size={14} /> Buscar
        </div>
        <h1 className="text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-5xl dark:text-white">
          ¿A dónde quieres ir?
        </h1>
        <p className="text-base leading-relaxed text-slate-500 md:text-lg dark:text-slate-400">
          Elige origen, destino y fecha para ver todos los trenes del día.
        </p>
      </header>

      <div className={CARD}>
        <StationSearch variant="wide" />
      </div>

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

  const [trains, setTrains] = useState<TrainSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<{ origin?: StationDetail; destination?: StationDetail }>({});
  const [editing, setEditing] = useState(false);

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');
  const hasParams = !!(origin && destination && date);

  // Trenes del día (se mantiene la lista anterior mientras carga la nueva)
  useEffect(() => {
    if (!hasParams) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- indicador de carga al cambiar de búsqueda
    setLoading(true);
    trainsService
      .searchTrains(origin, destination, date)
      .then((newTrains) => {
        if (cancelled) return;
        setTrains(newTrains);
      })
      .catch((err) => {
        console.error('Error buscando trenes:', err);
        if (!cancelled) setTrains([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [origin, destination, date, hasParams]);

  // Nombre y provincia de las estaciones
  useEffect(() => {
    if (!hasParams) return;
    Promise.all([estacionesService.getById(origin!), estacionesService.getById(destination!)])
      .then(([o, d]) => setStations({ origin: o, destination: d }))
      .catch((error) => console.error('Error cargando detalles de estaciones:', error));
  }, [origin, destination, hasParams]);

  const processedTrains = useMemo(() => processTrainData(trains) as ProcessedTrain[], [trains]);

  const handleDateChange = (newDate: string) => {
    if (newDate === date) return;
    setSearchParams(
      (prev) => {
        prev.set('date', newDate);
        return prev;
      },
      { replace: true },
    );
  };

  if (!hasParams) return <SearchLanding />;

  const nextDay = format(addDays(parseISO(date!), 1), 'yyyy-MM-dd');
  const stationsReady = !!(stations.origin && stations.destination);

  return (
    <div className="space-y-5 pb-12">
      {/* Resumen del trayecto (fijo arriba en escritorio) */}
      <div>
        <SearchHeader
          originDetail={stations.origin}
          destinationDetail={stations.destination}
          date={date!}
          loading={loading}
          editing={editing}
          onDateChange={handleDateChange}
          onEditSearch={() => setEditing((v) => !v)}
        />
      </div>

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
      <div
        className="flex min-w-0 flex-col gap-3"
      >
        {loading ? (
          <div className="grid gap-2.5 2xl:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <TrainSkeleton key={i} />)}</div>
        ) : processedTrains.length > 0 ? (
          <TrainResults trains={processedTrains} date={date!} onNextDay={() => handleDateChange(nextDay)} />
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
