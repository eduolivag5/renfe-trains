// pages/MapsPage.tsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { type TrainMap, trainsService } from '../api/trainsService';
import DetailPanel from '../components/map/DetailPanel';
import { LiveCounter } from '../components/map/LiveCounter';
import SpainMap, { type SpainMapHandle } from '../components/map/SpainMap';

const POLL_INTERVAL = 30_000;

const ZoomButton: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center text-slate-600 transition-colors hover:bg-slate-900/5 hover:text-slate-900 active:scale-95 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
  >
    {children}
  </button>
);

const MapsPage: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const mapRef = useRef<SpainMapHandle>(null);
  const [trenes, setTrenes] = useState<TrainMap[]>([]);
  const [selectedTren, setSelectedTren] = useState<TrainMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTrenes = () =>
      trainsService
        .getLiveMap()
        .then((data) => {
          if (cancelled) return;
          setTrenes(data);
        })
        .catch((e) => console.error('Error fetching trains:', e));

    fetchTrenes();
    // No consultamos la API con la pestaña en segundo plano
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchTrenes();
    }, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Llegada desde un horario ("Ver en el mapa", /mapa?tren=tripId): en cuanto llegan los trenes,
  // se abre su ficha y el mapa se centra en él. El parámetro se quita para no repetirlo
  const [searchParams, setSearchParams] = useSearchParams();
  const wanted = searchParams.get('tren');
  const handledRef = useRef<string | null>(null);
  const focusTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => clearInterval(focusTimer.current), []);
  useEffect(() => {
    if (!wanted || trenes.length === 0 || handledRef.current === wanted) return;
    handledRef.current = wanted;
    const train = trenes.find((t) => t.tripId === wanted);
    setSearchParams(
      (prev) => {
        prev.delete('tren');
        return prev;
      },
      { replace: true },
    );
    if (!train) return;
    setSelectedTren(train);
    // El mapa (topografía) puede tardar algo más que los trenes: se reintenta unos instantes.
    // El temporizador va en una ref: quitar ?tren= vuelve a ejecutar el efecto y no debe cortarlo
    let tries = 0;
    clearInterval(focusTimer.current);
    focusTimer.current = setInterval(() => {
      if (mapRef.current?.focus(train.lon, train.lat) || ++tries > 25) clearInterval(focusTimer.current);
    }, 120);
  }, [wanted, trenes, setSearchParams]);

  return (
    <div className="relative m-0 h-full w-full border-none p-0">
      <SpainMap
        ref={mapRef}
        trains={trenes}
        selectedId={selectedTren?.tripId ?? null}
        isDarkMode={isDarkMode}
        onSelect={setSelectedTren}
      />

      {/* Controles de zoom */}
      <div className="absolute right-4 top-4 z-40 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl divide-y divide-slate-200 md:right-6 md:top-6 dark:border-white/10 dark:bg-slate-900/95 dark:divide-white/10">
        <ZoomButton label="Acercar" onClick={() => mapRef.current?.zoomIn()}>
          <Plus size={18} strokeWidth={2.5} />
        </ZoomButton>
        <ZoomButton label="Alejar" onClick={() => mapRef.current?.zoomOut()}>
          <Minus size={18} strokeWidth={2.5} />
        </ZoomButton>
        <ZoomButton label="Ver toda la península" onClick={() => mapRef.current?.reset()}>
          <Maximize2 size={16} strokeWidth={2.5} />
        </ZoomButton>
      </div>

      {trenes.length > 0 && <LiveCounter trains={trenes} />}

      <AnimatePresence>
        {selectedTren && (
          <DetailPanel key={selectedTren.tripId} train={selectedTren} onClose={() => setSelectedTren(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapsPage;
