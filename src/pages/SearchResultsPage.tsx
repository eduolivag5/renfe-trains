import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { trainsService, type TrainSearchResult } from '../api/trainsService';
import { estacionesService } from '../api/estacionesService';
import StationSearch from '../components/station-search/StationSearch';
import { getTrainIdentity, processTrainData } from '../utils/trainUtils';
import { SearchHeader } from '../components/search-results/SearchHeader';
import { TrainCard } from '../components/search-results/TrainCard';
import TrainSkeleton from '../components/search-results/TrainSkeleton';

interface StationDetail {
  nombre: string;
  provincia: string;
}

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [trains, setTrains] = useState<TrainSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [stations, setStations] = useState<{ origin?: StationDetail; destination?: StationDetail }>({});

  // Parámetros de la URL
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const date = searchParams.get('date');
  const hasParams = !!(origin && destination && date);

  // 1. Efecto para buscar trenes (Carga persistente)
  useEffect(() => {
    if (!hasParams) return;
    
    setLoading(true);
    // No vaciamos 'trains' aquí para evitar que la página salte al top
    
    trainsService.searchTrains(origin, destination, date)
      .then((newTrains) => {
        setTrains(newTrains);
        setIsInitialLoading(false);
      })
      .catch(err => {
        console.error("Error buscando trenes:", err);
        setTrains([]); // En caso de error crítico, sí vaciamos
      })
      .finally(() => setLoading(false));
  }, [origin, destination, date, hasParams]);

  // 2. Efecto para detalles de estaciones
  useEffect(() => {
    if (!hasParams) return;

    const fetchStations = async () => {
      try {
        const [originData, destData] = await Promise.all([
          estacionesService.getById(origin!),
          estacionesService.getById(destination!)
        ]);
        setStations({ origin: originData, destination: destData });
      } catch (error) {
        console.error("Error cargando detalles de estaciones:", error);
      }
    };

    fetchStations();
  }, [origin, destination, hasParams]);

  // 3. Procesamiento de datos
  const processedTrains = useMemo(() => processTrainData(trains), [trains]);

  // Handler para cambio de fecha (Actualización de URL sin refresh)
  const handleDateChange = (newDate: string) => {
    if (newDate === date) return;
    
    setSearchParams(
      (prev) => {
        prev.set("date", newDate);
        return prev;
      },
      { replace: true }
    );
    // No hacemos scrollTo(0) para que la transición sea fluida
  };

  const handleEditSearch = () => {
    navigate('/');
  };

  // Vista cuando no hay búsqueda activa
  if (!hasParams) {
    return (
      <div className="pt-24 px-4">
        <div className="max-w-md mx-auto text-center mb-8">
          <h1 className="text-4xl font-black dark:text-white mb-4 tracking-tighter italic">
            BUSCA TU VIAJE
          </h1>
        </div>
        <div className="max-w-2xl mx-auto">
          <StationSearch />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] pb-32">
      {/* Header con el selector de fechas y stations */}
      <SearchHeader
        originDetail={stations.origin}
        destinationDetail={stations.destination}
        date={date!} 
        count={trains.length} 
        loading={loading}
        onDateChange={handleDateChange}
        onEditSearch={handleEditSearch}
      />

      <main className="max-w-4xl mx-auto mt-8 px-4">
        {/* Contenedor con transición de opacidad mientras carga */}
        <div 
          className={`grid gap-4 transition-all duration-500 ${
            loading ? 'opacity-50 pointer-events-none scale-[0.99]' : 'opacity-100 scale-100'
          }`}
        >
          {isInitialLoading ? (
            // Solo se muestra la primera vez que entramos
            Array.from({ length: 6 }).map((_, i) => <TrainSkeleton key={i} />)
          ) : processedTrains.length > 0 ? (
            // Muestra los trenes (los viejos se mantienen hasta que llegan los nuevos)
            processedTrains.map((train, idx) => (
              <TrainCard 
                key={train.tripId}
                train={train}
                index={idx}
                identity={getTrainIdentity(train.trainType)}
                onClick={() => navigate(`/train-detail/${train.tripId}`)}
              />
            ))
          ) : (
            // Estado vacío (Solo si no está cargando y no hay resultados)
            !loading && (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">😕</span>
                </div>
                <h3 className="text-lg font-black dark:text-white uppercase tracking-tight italic">
                  No hay trenes para este día
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest">
                  Prueba a seleccionar otra fecha en el calendario
                </p>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResultsPage;