import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Map, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation2, ChevronDown, ChevronUp, Loader2, AlertCircle, Radio } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { trainsService, type TrainMap, type TrainDetail } from '../api/trainsService';
import type { MapLayerMouseEvent } from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const INITIAL_VIEW = { latitude: 40.41, longitude: -3.70, zoom: 5.8 };
const POLL_INTERVAL = 30_000;

// ─── Paleta azul marino / morado ──────────────────────────────────────────────
const COLORS = {
  cercanias:  '#6d28d9',   // violeta   (Cercanías)
  other:      '#1e3a8a',   // azul marino (otros)
  clusterSm:  '#3b82f6',   // azul medio  (pocos)
  clusterMd:  '#6d28d9',   // violeta     (medio)
  clusterLg:  '#1e1b4b',   // índigo      (muchos)
} as const;

// ─── Estilos de capa ──────────────────────────────────────────────────────────
const clusterHaloStyle: any = {
  id: 'clusters-halo',
  type: 'circle',
  source: 'trains-data',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': 'transparent',
    'circle-radius': ['step', ['get', 'point_count'], 28, 15, 38, 60, 48],
    'circle-stroke-width': 1.5,
    'circle-stroke-color': [
      'step', ['get', 'point_count'],
      'rgba(59,130,246,0.3)', 15,
      'rgba(109,40,217,0.3)', 60,
      'rgba(30,27,75,0.4)',
    ],
  },
};

const clusterLayerStyle: any = {
  id: 'clusters',
  type: 'circle',
  source: 'trains-data',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step', ['get', 'point_count'],
      COLORS.clusterSm, 15,
      COLORS.clusterMd, 60,
      COLORS.clusterLg,
    ],
    'circle-radius': ['step', ['get', 'point_count'], 20, 15, 28, 60, 36],
    'circle-opacity': 0.93,
    'circle-stroke-width': 2,
    'circle-stroke-color': 'rgba(255,255,255,0.18)',
  },
};

const clusterCountStyle: any = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'trains-data',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
    'text-size': 13,
  },
  paint: { 'text-color': '#ffffff' },
};

const getPointStyle = (isDarkMode: boolean): any => ({
  id: 'unclustered-point',
  type: 'symbol',
  source: 'trains-data',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': ['match', ['get', 'tipo'], 'CERCANIAS', 'train-icon-cercanias', 'train-icon-other'],
    'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.55, 12, 0.8, 16, 1.1],
    'icon-allow-overlap': true,
    'icon-anchor': 'center',
    'text-field': ['get', 'label'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 11, 0, 13, 10, 16, 12],
    'text-offset': [0, 1.6],
    'text-anchor': 'top',
    'text-optional': true,
  },
  paint: {
    'text-color': isDarkMode ? '#c4b5fd' : '#1e1b4b',
    'text-halo-color': isDarkMode ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.92)',
    'text-halo-width': 1.5,
    'icon-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 1],
  },
});

// ─── Icono de tren dibujado en canvas ─────────────────────────────────────────
// Diseño: vehículo de metro/tren visto de frente, estilo flat moderno.
// Devuelve ImageData para que Mapbox lo acepte sin pixelRatio mismatch.
function createTrainIcon(fillColor: string, logicalSize = 40): ImageData {
  const ratio  = 2;
  const size   = logicalSize * ratio;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);

  const s  = logicalSize;          // alias
  const cx = s / 2;

  // — Sombra global —
  ctx.shadowColor   = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur    = 5;
  ctx.shadowOffsetY = 2;

  // — Cuerpo principal del tren (rectángulo redondeado) —
  const bodyX = s * 0.12;
  const bodyY = s * 0.10;
  const bodyW = s * 0.76;
  const bodyH = s * 0.65;
  const bR    = s * 0.14;          // radio de esquinas

  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH, bR);
  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.shadowColor = 'transparent';  // apagar sombra para detalles

  // — Reflejo superior (highlight) —
  const hlGrad = ctx.createLinearGradient(cx, bodyY, cx, bodyY + bodyH * 0.4);
  hlGrad.addColorStop(0, 'rgba(255,255,255,0.22)');
  hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, bodyH * 0.45, [bR, bR, 0, 0]);
  ctx.fillStyle = hlGrad;
  ctx.fill();

  // — Franja delantera (techo) —
  ctx.beginPath();
  ctx.roundRect(bodyX, bodyY, bodyW, s * 0.13, [bR, bR, 0, 0]);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();

  // — Ventana principal (parabrisas) —
  const winX = bodyX + s * 0.10;
  const winY = bodyY + s * 0.14;
  const winW = bodyW - s * 0.20;
  const winH = bodyH * 0.35;
  ctx.beginPath();
  ctx.roundRect(winX, winY, winW, winH, s * 0.06);
  ctx.fillStyle = 'rgba(200,220,255,0.88)';
  ctx.fill();
  // Reflejo en ventana
  ctx.beginPath();
  ctx.roundRect(winX + 2, winY + 2, winW * 0.3, winH * 0.4, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  // — Puerta central —
  const doorW = s * 0.18;
  const doorH = bodyH * 0.32;
  const doorX = cx - doorW / 2;
  const doorY = bodyY + bodyH * 0.52;
  ctx.beginPath();
  ctx.roundRect(doorX, doorY, doorW, doorH, s * 0.04);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fill();
  // Línea divisoria de puerta
  ctx.beginPath();
  ctx.moveTo(cx, doorY + 2);
  ctx.lineTo(cx, doorY + doorH - 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // — Franja inferior decorativa —
  const stripeY = bodyY + bodyH - s * 0.10;
  ctx.beginPath();
  ctx.roundRect(bodyX, stripeY, bodyW, s * 0.10, [0, 0, bR, bR]);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fill();

  // — Faros (izquierda y derecha) —
  const fY      = bodyY + bodyH - s * 0.09;
  const fRadius = s * 0.055;
  [[bodyX + s * 0.14, fY], [bodyX + bodyW - s * 0.14, fY]].forEach(([fx, fy]) => {
    // Halo amarillo-ámbar
    const fGlow = ctx.createRadialGradient(fx, fy, 0, fx, fy, fRadius * 2.2);
    fGlow.addColorStop(0, 'rgba(253,224,71,0.7)');
    fGlow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(fx, fy, fRadius * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = fGlow;
    ctx.fill();
    // Faro
    ctx.beginPath();
    ctx.arc(fx, fy, fRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#fde047';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(fx, fy, fRadius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#fffbeb';
    ctx.fill();
  });

  // — Ruedas (dos bogies) —
  const wheelY = bodyY + bodyH + s * 0.03;
  const wheelR = s * 0.09;
  [bodyX + s * 0.18, bodyX + bodyW - s * 0.18].forEach(wx => {
    // Carril (línea fina)
    ctx.beginPath();
    ctx.moveTo(wx - wheelR * 1.6, wheelY + wheelR);
    ctx.lineTo(wx + wheelR * 1.6, wheelY + wheelR);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Rueda
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fillStyle = '#1e1b4b';
    ctx.fill();
    // Llanta
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = '#e0e7ff';
    ctx.fill();
    // Centro
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelR * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
  });

  // — Pantógrafo (antena superior) —
  const panX1 = cx - s * 0.04;
  const panX2 = cx + s * 0.04;
  const panY1 = bodyY - s * 0.01;
  const panY2 = bodyY - s * 0.08;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.08, panY1);
  ctx.lineTo(panX1, panY2);
  ctx.lineTo(panX2, panY2);
  ctx.lineTo(cx + s * 0.08, panY1);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.stroke();
  // Barra horizontal del pantógrafo
  ctx.beginPath();
  ctx.moveTo(panX1 - s * 0.06, panY2);
  ctx.lineTo(panX2 + s * 0.06, panY2);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  return ctx.getImageData(0, 0, size, size);
}

// ─── Registro de iconos (extraído para reutilizar en styledata) ───────────────
// FIX dark mode: cuando Mapbox recarga el estilo (dark↔light), los sprites
// se borran. Escuchamos 'styledata' para volver a registrar los iconos.
function registerIcons(map: mapboxgl.Map) {
  const add = (name: string, color: string) => {
    if (!map.hasImage(name)) {
      const imageData = createTrainIcon(color, 40);
      // Añadimos el parámetro pixelRatio (2) para que Mapbox sepa 
      // que la imagen de 80px debe ocupar 40px lógicos.
      map.addImage(name, imageData, { pixelRatio: 2 });
    }
  };
  add('train-icon-cercanias', COLORS.cercanias);
  add('train-icon-other', COLORS.other);
}

// ─── Estilos de mapa personalizados ──────────────────────────────────────────
const MAP_STYLE = {
  dark:  'mapbox://styles/mapbox/navigation-night-v1',  // más contrastado en noche
  light: 'mapbox://styles/mapbox/light-v11',
};

// ─── Contador live ────────────────────────────────────────────────────────────
const LiveCounter: React.FC<{ count: number; isDarkMode: boolean }> = ({ count, isDarkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
    className={`
      absolute top-4 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl
      backdrop-blur-xl pointer-events-none select-none
      ${isDarkMode
        ? 'bg-[#0d0d1f]/85 border border-violet-500/20 text-violet-300'
        : 'bg-white/88 border border-indigo-100 text-indigo-400'}
    `}
  >
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
    </span>
    <span className="text-[12px] font-medium">
      <span className={`font-black text-[14px] tabular-nums mr-1
        ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
        {count.toLocaleString('es-ES')}
      </span>
      trenes activos
    </span>
  </motion.div>
);

// ─── Panel de detalle ─────────────────────────────────────────────────────────
interface DetailPanelProps {
  train: TrainMap;
  onClose: () => void;
  isDarkMode: boolean;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ train, onClose, isDarkMode }) => {
  const [detail, setDetail]               = useState<TrainDetail | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [showItinerary, setShowItinerary] = useState(false);

  const isCercanias = train.tipo === 'CERCANIAS';
  const accent      = isCercanias ? COLORS.cercanias : COLORS.other;
  const accentLight = isCercanias ? '#ede9fe' : '#dbeafe';

  const handleItinerary = useCallback(async () => {
    if (showItinerary) { setShowItinerary(false); return; }
    if (detail)        { setShowItinerary(true);  return; }
    setLoading(true);
    setError(null);
    try {
      const data = await trainsService.getDetail(train.tripId);
      setDetail(data);
      setShowItinerary(true);
    } catch {
      setError('No se pudo cargar el itinerario.');
    } finally {
      setLoading(false);
    }
  }, [detail, showItinerary, train.tripId]);

  return (
    <motion.div
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.85 }}
      className="absolute bottom-0 left-0 right-0 z-50 px-3 pointer-events-none"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className={`
        mx-auto max-w-lg rounded-[26px] pointer-events-auto overflow-hidden
        shadow-[0_-8px_48px_rgba(0,0,0,0.28)] backdrop-blur-2xl
        ${isDarkMode
          ? 'bg-[#0d0d1f]/96 border border-violet-500/15'
          : 'bg-white/97 border border-indigo-50'}
      `}>
        {/* Franja de color */}
        <div className="h-[3px]" style={{
          background: `linear-gradient(90deg, ${accent}, ${accent}88, transparent)`
        }} />

        {/* Handle */}
        <div className="flex justify-center pt-2.5">
          <div className={`w-9 h-[3px] rounded-full
            ${isDarkMode ? 'bg-violet-500/25' : 'bg-indigo-200/70'}`} />
        </div>

        <div className="px-5 pt-3 pb-5 space-y-3">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase px-2.5 py-[3px] rounded-full"
                  style={{
                    background: isDarkMode ? accent + '22' : accentLight,
                    color: accent,
                    border: `1px solid ${accent}30`,
                  }}
                >
                  <Radio size={8} />
                  {train.tipo}
                </span>
                <span className={`text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {train.status}
                </span>
              </div>
              <h2 className={`text-[22px] font-black tracking-tight leading-none truncate
                ${isDarkMode ? 'text-white' : 'text-indigo-950'}`}>
                {train.label}
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`ml-3 p-2 rounded-full transition-all
                ${isDarkMode
                  ? 'text-slate-500 hover:text-white hover:bg-white/10'
                  : 'text-slate-400 hover:text-indigo-900 hover:bg-indigo-50'}`}
            >
              <X size={16} />
            </button>
          </div>

          {/* Coordenadas */}
          <div className={`
            flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-mono text-[12px] tracking-wider
            ${isDarkMode
              ? 'bg-violet-500/[0.07] border border-violet-500/[0.12] text-violet-300'
              : 'bg-indigo-50 border border-indigo-100 text-indigo-400'}
          `}>
            <Navigation2 size={12} style={{ color: accent }} className="shrink-0" />
            {train.lat.toFixed(5)}°N &nbsp; {Math.abs(train.lon).toFixed(5)}°W
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px]
                ${isDarkMode
                  ? 'bg-red-500/10 text-red-400 border border-red-500/15'
                  : 'bg-red-50 text-red-500 border border-red-100'}`}
            >
              <AlertCircle size={12} className="shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Itinerario */}
          <AnimatePresence>
            {showItinerary && detail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className={`rounded-xl overflow-hidden border
                  ${isDarkMode ? 'border-violet-500/10' : 'border-indigo-50'}`}>
                  {detail.itinerary.slice(0, 9).map((stop, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3.5 py-[9px] text-[12px]
                        ${stop.isPassed ? 'opacity-35' : ''}
                        ${isDarkMode
                          ? i % 2 === 0 ? 'bg-white/[0.03]' : ''
                          : i % 2 === 0 ? 'bg-indigo-50/60' : 'bg-white'}`}
                    >
                      <div className="flex flex-col items-center self-stretch py-px gap-[2px] shrink-0">
                        <div className="w-px flex-1" style={{ background: stop.isPassed ? '#94a3b830' : accent + '35' }} />
                        <div className="w-[5px] h-[5px] rounded-full shrink-0"
                          style={{ background: stop.isPassed ? '#94a3b8' : accent }} />
                        <div className="w-px flex-1" style={{ background: stop.isPassed ? '#94a3b830' : accent + '35' }} />
                      </div>
                      <span className={`flex-1 font-medium truncate
                        ${isDarkMode ? 'text-violet-100' : 'text-indigo-900'}`}>
                        {stop.stopName}
                      </span>
                      <span className={`font-mono tabular-nums shrink-0 text-[11px]
                        ${isDarkMode ? 'text-violet-400' : 'text-indigo-300'}`}>
                        {stop.actualArrival || stop.scheduledArrival}
                      </span>
                    </div>
                  ))}
                  {detail.itinerary.length > 9 && (
                    <div className={`text-center py-2 text-[11px] font-medium
                      ${isDarkMode ? 'text-violet-600' : 'text-indigo-300'}`}>
                      +{detail.itinerary.length - 9} paradas más
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <button
            onClick={handleItinerary}
            disabled={loading}
            style={!loading && !showItinerary ? {
              background: `linear-gradient(135deg, ${accent}dd, ${accent})`,
              boxShadow: `0 4px 20px ${accent}45`,
            } : undefined}
            className={`
              w-full py-3.5 rounded-[13px] font-bold text-[13px] tracking-wide
              flex items-center justify-center gap-2
              transition-all duration-150 active:scale-[0.98] disabled:opacity-50
              ${loading || showItinerary
                ? isDarkMode
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/15'
                  : 'bg-indigo-50 text-indigo-400 border border-indigo-100'
                : 'text-white'}
            `}
          >
            {loading
              ? <><Loader2 size={13} className="animate-spin" /> Cargando…</>
              : showItinerary
                ? <><ChevronUp size={13} /> Ocultar itinerario</>
                : <><ChevronDown size={13} /> Ver itinerario</>}
          </button>

        </div>
      </div>
    </motion.div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const MapsPage: React.FC<{ isDarkMode: boolean }> = ({ isDarkMode }) => {
  const mapRef   = useRef<MapRef>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [trenes, setTrenes]             = useState<TrainMap[]>([]);
  const [selectedTren, setSelectedTren] = useState<TrainMap | null>(null);
  const [mapLoaded, setMapLoaded]       = useState(false);

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
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Error fetching trains:', e);
    }
  }, []);

  useEffect(() => {
    fetchTrenes();
    const id = setInterval(fetchTrenes, POLL_INTERVAL);
    return () => { clearInterval(id); abortRef.current?.abort(); };
  }, [fetchTrenes]);

  const onMapClick = useCallback((event: MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const features = map.queryRenderedFeatures(event.point, {
      layers: ['clusters', 'unclustered-point'],
    });
    const feature = features?.[0];
    if (!feature) { setSelectedTren(null); return; }
    const layerId = feature.layer?.id;
    if (layerId === 'clusters') {
      const clusterId = feature.properties?.cluster_id;
      const source = map.getSource('trains-data') as mapboxgl.GeoJSONSource;
      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number | null | undefined) => {
        if (err || zoom == null) return;
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
        map.easeTo({ center: coords, zoom: Math.min(zoom, 14), duration: 350 });
      });
      setSelectedTren(null);
    } else {
      setSelectedTren(feature.properties as TrainMap);
    }
  }, []);

  const onMouseEnter = useCallback(() => {
    mapRef.current?.getMap()?.getCanvas().style.setProperty('cursor', 'pointer');
  }, []);
  const onMouseLeave = useCallback(() => {
    mapRef.current?.getMap()?.getCanvas().style.setProperty('cursor', '');
  }, []);

  const [iconsReady, setIconsReady] = useState(false);

  const onMapLoad = useCallback((e: any) => {
    const map = e.target;
    registerIcons(map);
    
    // Escuchar cuando el estilo esté cargado del todo
    if (map.isStyleLoaded()) {
      setIconsReady(true);
    } else {
      map.once('idle', () => setIconsReady(true));
    }

    map.on('styledata', () => registerIcons(map));
    setMapLoaded(true);
  }, []);

  const pointStyle = useMemo(() => getPointStyle(isDarkMode), [isDarkMode]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <Map
        ref={mapRef}
        reuseMaps
        onLoad={onMapLoad}
        onClick={onMapClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={['clusters', 'unclustered-point']}
        initialViewState={INITIAL_VIEW}
        mapStyle={isDarkMode ? MAP_STYLE.dark : MAP_STYLE.light}
        mapboxAccessToken={MAPBOX_TOKEN}
        maxPitch={0}
        antialias={false}
        attributionControl={false}
        logoPosition="bottom-right"
      >
        {mapLoaded && iconsReady && (
          <Source
            id="trains-data"
            type="geojson"
            data={geojsonData}
            cluster={true}
            clusterMaxZoom={11}
            clusterRadius={52}
            clusterMinPoints={3}
          >
            <Layer {...clusterHaloStyle} />
            <Layer {...clusterLayerStyle} />
            <Layer {...clusterCountStyle} />
            <Layer {...pointStyle} />
          </Source>
        )}
      </Map>

      {trenes.length > 0 && (
        <LiveCounter count={trenes.length} isDarkMode={isDarkMode} />
      )}

      <AnimatePresence>
        {selectedTren && (
          <DetailPanel
            key={selectedTren.tripId}
            train={selectedTren}
            onClose={() => setSelectedTren(null)}
            isDarkMode={isDarkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MapsPage;