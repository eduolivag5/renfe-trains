// components/map/SpainMap.tsx
/**
 * Mapa ligero de la península en un único <canvas>, sin teselas ni WebGL.
 *
 * - Geometría estática (public/map/spain.json, ~10 KB gzip):
 *   solo las provincias de la península y los países vecinos como fondo.
 * - La proyección se calcula una vez por tamaño; los trazados se convierten a Path2D
 *   y el zoom/pan solo aplica una transformación afín al contexto.
 * - Los trenes se dibujan en coordenadas de pantalla con sprites pre-renderizados
 *   y se desplazan suavemente entre actualizaciones.
 * - Solo se redibuja cuando algo cambia (interacción, datos, tema o animación).
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { geoConicConformal, geoPath, type GeoProjection } from 'd3-geo';
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';
import { feature, merge, mesh } from 'topojson-client';
import type { Topology, GeometryCollection, Polygon, MultiPolygon } from 'topojson-specification';
import type { TrainMap } from '../../api/trainsService';
import { CITIES, MAP_THEME, getTrainColor } from './MapConstants';
import { getTrainSprite } from './MapIcons';

export interface SpainMapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
}

interface SpainMapProps {
  trains: TrainMap[];
  selectedId: string | null;
  isDarkMode: boolean;
  onSelect: (train: TrainMap | null) => void;
}

type Topo = Topology<{
  provinces: GeometryCollection<{ name: string }>;
  neighbors: GeometryCollection;
}>;

interface BasePaths {
  neighbors: Path2D;
  land: Path2D;
  provinces: Path2D;
  coast: Path2D;
}

/* ------------------------------------------------------------------ */
/* Carga de la geometría (una sola vez por sesión)                      */
/* ------------------------------------------------------------------ */

let topoPromise: Promise<Topo> | null = null;
const loadTopology = () =>
  (topoPromise ??= fetch('/map/spain.json').then((r) => {
    if (!r.ok) throw new Error('No se pudo cargar el mapa');
    return r.json() as Promise<Topo>;
  }));

const MAX_ZOOM = 60;
const ANIM_MS = 900;
const MAX_DPR = 2;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const trainSize = (k: number) => Math.min(30, 15 + 4 * Math.log2(k));

/** Posición animada de cada tren (en lon/lat) */
interface TrainAnim {
  train: TrainMap;
  from: [number, number];
  to: [number, number];
}

const SpainMap = forwardRef<SpainMapHandle, SpainMapProps>(({ trains, selectedId, isDarkMode, onSelect }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [topoData, setTopoData] = useState<Topo | null>(null);
  const [error, setError] = useState(false);

  // Estado mutable de render (fuera de React para no re-renderizar en cada frame)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const projectionRef = useRef<GeoProjection | null>(null);
  const pathsRef = useRef<BasePaths | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const animsRef = useRef<Map<string, TrainAnim>>(new Map());
  const animStartRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const drawRef = useRef<(now: number) => void>(() => {});
  const propsRef = useRef({ selectedId, isDarkMode, onSelect });

  useEffect(() => {
    loadTopology().then(setTopoData).catch(() => setError(true));
  }, []);

  /* ---------------------------- Dibujo ---------------------------- */

  const draw = useCallback((now: number) => {
    frameRef.current = null;
    const canvas = canvasRef.current;
    const paths = pathsRef.current;
    const projection = projectionRef.current;
    if (!canvas || !paths || !projection) return;

    const ctx = canvas.getContext('2d')!;
    const { w, h, dpr } = sizeRef.current;
    const { k, x, y } = transformRef.current;
    const theme = propsRef.current.isDarkMode ? MAP_THEME.dark : MAP_THEME.light;

    // --- Capa base (coordenadas proyectadas + transformación de zoom) ---
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = theme.sea;
    ctx.fillRect(0, 0, w, h);

    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * x, dpr * y);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Grosor casi constante en pantalla, creciendo un poco al acercarse
    const lw = (px: number) => (px * Math.pow(k, 0.35)) / k;

    ctx.fillStyle = theme.neighbor;
    ctx.fill(paths.neighbors);
    ctx.fillStyle = theme.land;
    ctx.fill(paths.land);

    ctx.strokeStyle = theme.provinceBorder;
    ctx.lineWidth = lw(0.8);
    ctx.stroke(paths.provinces);
    ctx.strokeStyle = theme.coast;
    ctx.lineWidth = lw(1);
    ctx.stroke(paths.coast);

    // --- Capas en pantalla ---
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const toScreen = (lon: number, lat: number): [number, number] | null => {
      const p = projection([lon, lat]);
      return p ? [p[0] * k + x, p[1] * k + y] : null;
    };

    // Ciudades (se dibujan encima de los trenes para no perder la referencia)
    const drawCities = () => {
      ctx.textAlign = 'start';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.halo;
      for (const [name, lon, lat, tier] of CITIES) {
        if (tier === 2 && k < 2.2) continue;
        const p = toScreen(lon, lat);
        if (!p || p[0] < -80 || p[0] > w + 80 || p[1] < -20 || p[1] > h + 20) continue;
        ctx.fillStyle = theme.cityDot;
        ctx.beginPath();
        ctx.arc(p[0], p[1], tier === 1 ? 2.6 : 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${tier === 1 ? 700 : 600} ${tier === 1 ? 12 : 11}px Montserrat, system-ui, sans-serif`;
        ctx.strokeText(name, p[0] + 6, p[1]);
        ctx.fillStyle = theme.cityText;
        ctx.fillText(name, p[0] + 6, p[1]);
      }
    };

    // Trenes (interpolados entre la posición anterior y la nueva)
    const t = Math.min(1, (now - animStartRef.current) / ANIM_MS);
    const e = easeInOut(t);
    const size = trainSize(k);
    const showLabels = k >= 6;
    const sel = propsRef.current.selectedId;
    let selected: { p: [number, number]; train: TrainMap } | null = null;

    ctx.font = '700 11px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.halo;

    for (const a of animsRef.current.values()) {
      const lon = a.from[0] + (a.to[0] - a.from[0]) * e;
      const lat = a.from[1] + (a.to[1] - a.from[1]) * e;
      const p = toScreen(lon, lat);
      if (!p || p[0] < -size || p[0] > w + size || p[1] < -size || p[1] > h + size) continue;
      if (a.train.tripId === sel) { selected = { p, train: a.train }; continue; }
      ctx.drawImage(getTrainSprite(getTrainColor(a.train.tipo)), p[0] - size / 2, p[1] - size / 2, size, size);
      if (showLabels) {
        ctx.strokeText(a.train.label, p[0], p[1] + size / 2 + 2);
        ctx.fillStyle = theme.trainText;
        ctx.fillText(a.train.label, p[0], p[1] + size / 2 + 2);
      }
    }

    drawCities();

    // El seleccionado, encima de todo y con halo
    ctx.font = '700 11px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    if (selected) {
      const { p, train } = selected;
      const color = getTrainColor(train.tipo);
      const s = size * 1.35;
      ctx.beginPath();
      ctx.arc(p[0], p[1], s * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = `${color}33`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.drawImage(getTrainSprite(color), p[0] - s / 2, p[1] - s / 2, s, s);
      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.halo;
      ctx.strokeText(train.label, p[0], p[1] + s * 0.95 + 3);
      ctx.fillStyle = theme.trainText;
      ctx.fillText(train.label, p[0], p[1] + s * 0.95 + 3);
    }
    ctx.textAlign = 'start';

    // Sigue animando mientras los trenes se desplazan hacia su nueva posición
    if (t < 1) frameRef.current = requestAnimationFrame((n) => drawRef.current(n));
  }, []);

  useEffect(() => { drawRef.current = draw; }, [draw]);

  const scheduleDraw = useCallback(() => {
    if (frameRef.current == null) frameRef.current = requestAnimationFrame((n) => drawRef.current(n));
  }, []);

  /* ----------------------- Tamaño y proyección ----------------------- */

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !topoData) return;

    const objs = topoData.objects;
    const land = merge(topoData, objs.provinces.geometries as (Polygon | MultiPolygon)[]);
    const provincesMesh = mesh(topoData, objs.provinces, (a, b) => a !== b);
    const coastMesh = mesh(topoData, objs.provinces, (a, b) => a === b);
    const neighbors = feature(topoData, objs.neighbors);

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Margen para que no quede pegado a los paneles flotantes
      const padX = Math.min(48, w * 0.06);
      const padTop = w >= 768 ? 96 : 24;
      const padBottom = w >= 768 ? 32 : 110;
      const projection = geoConicConformal()
        .parallels([36, 43.5])
        .rotate([3.6, 0])
        .fitExtent([[padX, padTop], [w - padX, h - padBottom]], land);
      projectionRef.current = projection;

      const path = geoPath(projection);
      const toPath = (g: Parameters<typeof path>[0] | undefined) => new Path2D((g && path(g)) || '');
      pathsRef.current = {
        neighbors: toPath(neighbors),
        land: toPath(land),
        provinces: toPath(provincesMesh),
        coast: toPath(coastMesh),
      };

      zoomRef.current
        ?.extent([[0, 0], [w, h]])
        .translateExtent([[-w * 0.15, -h * 0.15], [w * 1.15, h * 1.15]]);

      // Cambiar canvas.width borra el lienzo: redibujamos ya (antes del pintado) para evitar un frame en blanco
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      drawRef.current(performance.now());
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, [topoData, scheduleDraw]);

  /* ------------------------- Zoom e interacción ------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !topoData) return;

    const zoomBehavior = d3zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .on('zoom', (ev) => {
        transformRef.current = ev.transform;
        scheduleDraw();
      });
    zoomRef.current = zoomBehavior;
    const { w, h } = sizeRef.current;
    if (w && h) {
      zoomBehavior.extent([[0, 0], [w, h]]).translateExtent([[-w * 0.15, -h * 0.15], [w * 1.15, h * 1.15]]);
    }
    const sel = select(canvas).call(zoomBehavior);

    /** Tren bajo el puntero (búsqueda lineal: unos pocos cientos de puntos) */
    const hitTest = (mx: number, my: number): TrainMap | null => {
      const projection = projectionRef.current;
      if (!projection) return null;
      const { k, x, y } = transformRef.current;
      const r = trainSize(k) / 2 + 4;
      let best: TrainMap | null = null;
      let bestD = r * r;
      for (const a of animsRef.current.values()) {
        const p = projection(a.to);
        if (!p) continue;
        const dx = p[0] * k + x - mx;
        const dy = p[1] * k + y - my;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = a.train; }
      }
      return best;
    };

    const local = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return [ev.clientX - rect.left, ev.clientY - rect.top] as const;
    };
    const onClick = (ev: MouseEvent) => propsRef.current.onSelect(hitTest(...local(ev)));
    const onMove = (ev: MouseEvent) => {
      if (ev.buttons) return;
      canvas.style.cursor = hitTest(...local(ev)) ? 'pointer' : 'grab';
    };
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMove);

    return () => {
      sel.on('.zoom', null);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, [topoData, scheduleDraw]);

  useImperativeHandle(ref, () => {
    const run = (fn: (z: ZoomBehavior<HTMLCanvasElement, unknown>, s: ReturnType<typeof select<HTMLCanvasElement, unknown>>) => void) => {
      const canvas = canvasRef.current;
      const z = zoomRef.current;
      if (canvas && z) fn(z, select(canvas));
    };
    return {
      zoomIn: () => run((z, s) => s.transition().duration(350).call(z.scaleBy, 1.8)),
      zoomOut: () => run((z, s) => s.transition().duration(350).call(z.scaleBy, 1 / 1.8)),
      reset: () => run((z, s) => s.transition().duration(500).call(z.transform, zoomIdentity)),
    };
  }, []);

  /* --------------------------- Datos y tema --------------------------- */

  // Nuevos datos: cada tren parte de donde se está dibujando ahora y va a su nueva posición
  useEffect(() => {
    const now = performance.now();
    const e = easeInOut(Math.min(1, (now - animStartRef.current) / ANIM_MS));
    const prev = animsRef.current;
    const next = new Map<string, TrainAnim>();
    for (const train of trains) {
      const to: [number, number] = [train.lon, train.lat];
      const old = prev.get(train.tripId);
      const from: [number, number] = old
        ? [old.from[0] + (old.to[0] - old.from[0]) * e, old.from[1] + (old.to[1] - old.from[1]) * e]
        : to;
      next.set(train.tripId, { train, from, to });
    }
    animsRef.current = next;
    animStartRef.current = now;
    scheduleDraw();
  }, [trains, scheduleDraw]);

  // Props que lee el bucle de dibujo y los manejadores de eventos
  useEffect(() => {
    propsRef.current = { selectedId, isDarkMode, onSelect };
    scheduleDraw();
  }, [selectedId, isDarkMode, onSelect, scheduleDraw]);

  // Las fuentes web pueden llegar después del primer dibujo
  useEffect(() => {
    document.fonts?.ready.then(() => scheduleDraw());
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [scheduleDraw]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#e8eef6] dark:bg-[#020617]">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none cursor-grab active:cursor-grabbing"
        aria-label="Mapa de trenes en tiempo real de la península"
        role="img"
      />
      {!topoData && (
        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-400">
          {error ? 'No se pudo cargar el mapa.' : 'Cargando mapa…'}
        </div>
      )}
    </div>
  );
});

SpainMap.displayName = 'SpainMap';
export default SpainMap;
