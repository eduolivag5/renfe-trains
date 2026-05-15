// components/map/MapsPage.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Map, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox';
import { AnimatePresence } from 'framer-motion';
import 'mapbox-gl/dist/mapbox-gl.css';
import { type TrainMap, trainsService } from '../api/trainsService';
import DetailPanel from '../components/map/DetailPanel';
import { LiveCounter } from '../components/map/LiveCounter';
import { getPointStyle } from '../components/map/MapConstants'; // Solo importamos lo necesario
import { registerIcons } from '../components/map/MapIcons';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const INITIAL_VIEW = { latitude: 40.41, longitude: -3.70, zoom: 5.8 };
const POLL_INTERVAL = 30_000;

const MAP_STYLE = {
  dark: 'mapbox://styles/mapbox/navigation-night-v1',
  light: 'mapbox://styles/mapbox/light-v11',
};

const MapsPage: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const mapRef = useRef<MapRef>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [trenes, setTrenes] = useState<TrainMap[]>([]);
  const [selectedTren, setSelectedTren] = useState<TrainMap | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const geojsonData = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: trenes.map(t => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [t.lon, t.lat] },
      properties: { ...t },
    })),
  }), [trenes]);

  const fetchTrenes = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const data = await trainsService.getLiveMap();
      setTrenes(data);
      setLastUpdate(new Date());
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Error fetching trains:', e);
    }
  }, []);

  useEffect(() => {
    fetchTrenes();
    const id = setInterval(fetchTrenes, POLL_INTERVAL);
    return () => { clearInterval(id); abortRef.current?.abort(); };
  }, [fetchTrenes]);

  const onMapClick = useCallback((event: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Solo buscamos en la capa de puntos ya que no hay clústers
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['unclustered-point'],
    });

    const feature = features?.[0];
    if (!feature) { 
      setSelectedTren(null); 
      return; 
    }

    // Al desactivar clústeres, todas las features son trenes individuales
    setSelectedTren(feature.properties as TrainMap);
  }, []);

  const onMapLoad = useCallback((e: any) => {
    const map = e.target;
    registerIcons(map);
    if (map.isStyleLoaded()) setIconsReady(true);
    else map.once('idle', () => setIconsReady(true));
    map.on('styledata', () => registerIcons(map));
    setMapLoaded(true);
  }, []);

  return (
    <div className="w-full h-full relative border-none p-0 m-0">
      <Map
        ref={mapRef}
        reuseMaps
        onLoad={onMapLoad}
        onClick={onMapClick}
        interactiveLayerIds={['unclustered-point']} // Solo la capa de puntos
        initialViewState={INITIAL_VIEW}
        mapStyle={isDarkMode ? MAP_STYLE.dark : MAP_STYLE.light}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        {mapLoaded && iconsReady && (
          <Source 
            id="trains-data" 
            type="geojson" 
            data={geojsonData} 
            cluster={false}
          >
            {/* Solo renderizamos la capa de puntos individuales */}
            <Layer {...getPointStyle(isDarkMode)} />
          </Source>
        )}
      </Map>

      {trenes.length > 0 && (
        <LiveCounter 
          count={trenes.length} 
          lastUpdate={lastUpdate}
        />
      )}

      <AnimatePresence>
        {selectedTren && (
          <DetailPanel 
            key={selectedTren.tripId} 
            train={selectedTren} 
            onClose={() => setSelectedTren(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapsPage;