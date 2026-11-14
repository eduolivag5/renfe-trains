// pages/MapsPage.tsx
import { useState, useEffect, useRef } from 'react';
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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTrenes = () =>
      trainsService
        .getLiveMap()
        .then((data) => {
          if (cancelled) return;
          setTrenes(data);
          setLastUpdate(new Date());
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
      <div className="absolute right-4 top-4 z-40 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-xl backdrop-blur-md divide-y divide-slate-200 md:right-6 md:top-28 dark:border-white/10 dark:bg-slate-900/80 dark:divide-white/10">
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

      {trenes.length > 0 && <LiveCounter count={trenes.length} lastUpdate={lastUpdate} />}

      <AnimatePresence>
        {selectedTren && (
          <DetailPanel key={selectedTren.tripId} train={selectedTren} onClose={() => setSelectedTren(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapsPage;
