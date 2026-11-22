// components/map/SpainMap.tsx
/**
 * Mapa ligero de la península en un único <canvas>, sin teselas ni WebGL.
 *
 * - Geometría estática (public/map/spain.json, ~10 KB gzip):
 *   solo las provincias de la península y los países vecinos como fondo.
 * - La proyección se calcula una vez por tamaño; los trazados se convierten a Path2D
 *   y el zoom/pan solo aplica una transformación afín al contexto.
 * - Trenes con sprites pre-renderizados que se desplazan suavemente entre actualizaciones.
 * - Agrupación: los trenes cuyos iconos se solaparían se funden en un grupo con su recuento.
 *   Se calcula en coordenadas del mapa (no de pantalla), así los grupos no cambian al arrastrar,
 *   solo al hacer zoom. Pulsar un grupo acerca la vista hasta separarlo; si ni con el zoom
 *   máximo se separan (p. ej. trenes parados en la misma estación) se abren en abanico.
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
  /** Centra el mapa en un punto con zoom (p. ej. el tren abierto desde un horario). false si el mapa aún no está listo */
  focus: (lon: number, lat: number) => boolean;
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

/** Zoom máximo muy alto: a este nivel 10 m ≈ 25 px, suficiente para separar casi cualquier par */
const MAX_ZOOM = 2000;
const ANIM_MS = 900;
const MAX_DPR = 2;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
/** Tamaño del icono en pantalla: 28 px sin zoom, hasta 44 px */
const trainSize = (k: number) => Math.min(44, 28 + 4 * Math.log2(k));
/** Dos iconos se agrupan si sus centros están más cerca que esto (se solaparían) */
const clusterRadius = (k: number) => trainSize(k) * 1.15;
const clusterBubble = (n: number) => 17 + Math.min(13, Math.log2(n) * 3.5);
/** Despliegue de la plataforma de trenes coincidentes */
const SPIDER_MS = 420;
const easeOutBack = (x: number) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2;

/** Posición animada de cada tren (en lon/lat) */
interface TrainAnim {
  train: TrainMap;
  from: [number, number];
  to: [number, number];
}

/** Lo que se ha dibujado en el último frame, para la detección de clics */
type HitItem =
  | { kind: 'train'; x: number; y: number; r: number; train: TrainMap }
  | { kind: 'cluster'; x: number; y: number; r: number; members: { id: string; wx: number; wy: number }[] }
  | { kind: 'block'; x: number; y: number; r: number }; // disco de la plataforma: absorbe clics

interface Spider {
  ids: string[];
  center: [number, number]; // coordenadas del mapa (sin zoom)
  openedAt: number;
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
  const hitItemsRef = useRef<HitItem[]>([]);
  const spiderRef = useRef<Spider | null>(null);
  const hoverRef = useRef<string | null>(null);

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
    const lw = (px: number) => (px * Math.pow(Math.min(k, 60), 0.35)) / k;

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
    const toScreen = (wx: number, wy: number): [number, number] => [wx * k + x, wy * k + y];

    const t = Math.min(1, (now - animStartRef.current) / ANIM_MS);
    const e = easeInOut(t);
    const size = trainSize(k);
    const half = size / 2;
    const sel = propsRef.current.selectedId;
    const spider = spiderRef.current;
    const spiderIds = new Set(spider?.ids ?? []);
    const hits: HitItem[] = [];

    // Posición actual (mapa, sin zoom) de cada tren
    const points: { id: string; train: TrainMap; wx: number; wy: number }[] = [];
    let selected: { wx: number; wy: number; train: TrainMap } | null = null;
    const spiderTrains: TrainMap[] = [];
    for (const [id, a] of animsRef.current) {
      const p = projection([a.from[0] + (a.to[0] - a.from[0]) * e, a.from[1] + (a.to[1] - a.from[1]) * e]);
      if (!p) continue;
      if (id === sel) selected = { wx: p[0], wy: p[1], train: a.train };
      if (spiderIds.has(id)) {
        spiderTrains.push(a.train); // el seleccionado también se coloca en la plataforma
        continue;
      }
      if (id === sel) continue;
      points.push({ id, train: a.train, wx: p[0], wy: p[1] });
    }

    // --- Agrupación en coordenadas del mapa (rejilla de celdas de tamaño R) ---
    const R = clusterRadius(k) / k;
    type Cluster = { sx: number; sy: number; cx: number; cy: number; items: typeof points };
    const clusters: Cluster[] = [];
    const grid = new Map<string, Cluster[]>();
    for (const pt of points) {
      const gx = Math.floor(pt.wx / R);
      const gy = Math.floor(pt.wy / R);
      let best: Cluster | null = null;
      let bestD = R * R;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          for (const c of grid.get(`${gx + dx},${gy + dy}`) ?? []) {
            const d = (c.cx - pt.wx) ** 2 + (c.cy - pt.wy) ** 2;
            if (d < bestD) { bestD = d; best = c; }
          }
        }
      }
      if (best) {
        best.items.push(pt);
        best.sx += pt.wx;
        best.sy += pt.wy;
        best.cx = best.sx / best.items.length;
        best.cy = best.sy / best.items.length;
      } else {
        const c: Cluster = { sx: pt.wx, sy: pt.wy, cx: pt.wx, cy: pt.wy, items: [pt] };
        clusters.push(c);
        const key = `${gx},${gy}`;
        const cell = grid.get(key);
        if (cell) cell.push(c);
        else grid.set(key, [c]);
      }
    }

    // Segunda pasada: los grupos son burbujas más grandes que un icono; si dos se tocarían,
    // se funden. Así ningún elemento dibujado se solapa con otro a ningún nivel de zoom.
    const drawnRadius = (c: Cluster) => (c.items.length === 1 ? half + 2 : clusterBubble(c.items.length) + 3) / k;
    for (let pass = 0, merged = true; merged && pass < 6; pass++) {
      merged = false;
      for (let i = 0; i < clusters.length; i++) {
        const a = clusters[i];
        if (!a.items.length) continue;
        for (let j = i + 1; j < clusters.length; j++) {
          const b = clusters[j];
          if (!b.items.length) continue;
          const minD = drawnRadius(a) + drawnRadius(b);
          if ((a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2 < minD * minD) {
            a.items.push(...b.items);
            a.sx += b.sx;
            a.sy += b.sy;
            a.cx = a.sx / a.items.length;
            a.cy = a.sy / a.items.length;
            b.items = [];
            merged = true;
          }
        }
      }
    }
    for (let i = clusters.length - 1; i >= 0; i--) if (!clusters[i].items.length) clusters.splice(i, 1);

    const offscreen = (sx: number, sy: number, m: number) => sx < -m || sx > w + m || sy < -m || sy > h + m;

    // --- Ciudades (debajo de trenes y grupos, para no tapar los recuentos) ---
    ctx.textAlign = 'start';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.halo;
    for (const [name, lon, lat, tier] of CITIES) {
      if (tier === 2 && k < 2.2) continue;
      const pp = projection([lon, lat]);
      if (!pp) continue;
      const [sx, sy] = toScreen(pp[0], pp[1]);
      if (sx < -80 || sx > w + 80 || sy < -20 || sy > h + 20) continue;
      ctx.fillStyle = theme.cityDot;
      ctx.beginPath();
      ctx.arc(sx, sy, tier === 1 ? 2.6 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${tier === 1 ? 700 : 600} ${tier === 1 ? 12 : 11}px Montserrat, system-ui, sans-serif`;
      ctx.strokeText(name, sx + 6, sy);
      ctx.fillStyle = theme.cityText;
      ctx.fillText(name, sx + 6, sy);
    }

    // --- Trenes sueltos ---
    ctx.font = '700 11px Montserrat, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.halo;
    const showLabels = k >= 6;
    for (const c of clusters) {
      if (c.items.length !== 1) continue;
      const { train, wx, wy } = c.items[0];
      const [sx, sy] = toScreen(wx, wy);
      if (offscreen(sx, sy, size)) continue;
      ctx.drawImage(getTrainSprite(getTrainColor(train.tipo)), sx - half, sy - half, size, size);
      if (showLabels) {
        ctx.strokeText(train.label, sx, sy + half + 1);
        ctx.fillStyle = theme.trainText;
        ctx.fillText(train.label, sx, sy + half + 1);
      }
      hits.push({ kind: 'train', x: sx, y: sy, r: half + 3, train });
    }

    // --- Grupos: burbuja con recuento y anillo con la proporción de cada tipo ---
    ctx.textBaseline = 'middle';
    for (const c of clusters) {
      const n = c.items.length;
      if (n === 1) continue;
      const [sx, sy] = toScreen(c.cx, c.cy);
      const r = clusterBubble(n);
      if (offscreen(sx, sy, r)) continue;

      const counts = new Map<string, number>();
      for (const it of c.items) {
        const col = getTrainColor(it.train.tipo);
        counts.set(col, (counts.get(col) ?? 0) + 1);
      }

      // Halo suave
      ctx.beginPath();
      ctx.arc(sx, sy, r + 5, 0, Math.PI * 2);
      ctx.fillStyle = theme.clusterHalo;
      ctx.fill();

      // Anillo segmentado por tipo
      let start = -Math.PI / 2;
      ctx.lineWidth = 5;
      ctx.lineCap = 'butt';
      for (const [col, cnt] of counts) {
        const end = start + (cnt / n) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r - 2.5, start, end);
        ctx.strokeStyle = col;
        ctx.stroke();
        start = end;
      }

      // Centro
      ctx.beginPath();
      ctx.arc(sx, sy, r - 5, 0, Math.PI * 2);
      ctx.fillStyle = theme.clusterFill;
      ctx.fill();
      ctx.fillStyle = theme.clusterText;
      ctx.font = `800 ${n >= 100 ? 11 : 13}px Montserrat, system-ui, sans-serif`;
      ctx.fillText(String(n), sx, sy + 0.5);

      hits.push({ kind: 'cluster', x: sx, y: sy, r: r + 3, members: c.items.map(({ id, wx, wy }) => ({ id, wx, wy })) });
    }
    ctx.lineCap = 'round';

    // --- Plataforma: trenes en exactamente el mismo punto ---
    // Disco de cristal centrado en la ubicación compartida, con los iconos en anillos concéntricos
    // (estilo panal) que se despliegan desde el centro con un ligero rebote.
    let spiderAnimating = false;
    const selectedInSpider = !!sel && spiderIds.has(sel);
    if (spider && spiderTrains.length > 0) {
      const [cx, cy] = toScreen(spider.center[0], spider.center[1]);
      const n = spiderTrains.length;
      const at = Math.min(1, (now - spider.openedAt) / SPIDER_MS);
      spiderAnimating = at < 1;
      const pop = easeOutBack(at);
      const fade = Math.min(1, at * 2.5);

      // Huecos por anillos: 6, 12, 18… alternando el desfase para que encajen como un panal
      const step = size * 1.22;
      const slots: [number, number][] = [];
      for (let ring = 1, left = n; left > 0; ring++) {
        const cnt = Math.min(6 * ring, left);
        const radius = ring === 1 ? Math.max(size * 0.9, (size * 1.12) / (2 * Math.sin(Math.PI / Math.max(cnt, 2)))) : ring * step;
        const offset = -Math.PI / 2 + (ring % 2 === 0 ? Math.PI / cnt : 0);
        for (let i = 0; i < cnt; i++) {
          const ang = offset + (i / cnt) * Math.PI * 2;
          slots.push([Math.cos(ang) * radius, Math.sin(ang) * radius]);
        }
        left -= cnt;
      }
      const outer = (Math.max(...slots.map(([ox, oy]) => Math.hypot(ox, oy))) + half + 14) * Math.max(pop, 0.001);

      ctx.save();
      ctx.globalAlpha = fade;

      // Sombra + disco + borde
      ctx.beginPath();
      ctx.arc(cx, cy + 5, outer + 3, 0, Math.PI * 2);
      ctx.fillStyle = theme.spiderShadow;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, outer, 0, Math.PI * 2);
      ctx.fillStyle = theme.spiderBackdrop;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = theme.spiderRing;
      ctx.stroke();

      hits.push({ kind: 'block', x: cx, y: cy, r: outer });

      // Marcador de la ubicación compartida
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124,58,237,0.18)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7c3aed';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Etiqueta superior
      const text = `${n} trenes en el mismo punto`;
      ctx.font = '700 12px Montserrat, system-ui, sans-serif';
      const tw = ctx.measureText(text).width;
      const pillW = tw + 24;
      const pillY = cy - outer - 32;
      ctx.beginPath();
      ctx.roundRect(cx - pillW / 2, pillY, pillW, 26, 13);
      ctx.fillStyle = theme.clusterFill;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme.spiderRing;
      ctx.stroke();
      ctx.fillStyle = theme.clusterText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cx, pillY + 13.5);

      // Iconos
      spiderTrains.forEach((train, i) => {
        const px = cx + slots[i][0] * pop;
        const py = cy + slots[i][1] * pop;
        const color = getTrainColor(train.tipo);
        if (train.tripId === sel) {
          ctx.beginPath();
          ctx.arc(px, py, half + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${color}33`;
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = color;
          ctx.stroke();
        }
        ctx.drawImage(getTrainSprite(color), px - half, py - half, size, size);
        hits.push({ kind: 'train', x: px, y: py, r: half + 3, train });
      });
      ctx.restore();
    }

    // --- El seleccionado (si no está en la plataforma), encima de todo y con halo ---
    if (selected && !selectedInSpider) {
      const { train } = selected;
      const [sx, sy] = toScreen(selected.wx, selected.wy);
      const color = getTrainColor(train.tipo);
      const s = size * 1.3;
      ctx.beginPath();
      ctx.arc(sx, sy, s * 0.95, 0, Math.PI * 2);
      ctx.fillStyle = `${color}33`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.drawImage(getTrainSprite(color), sx - s / 2, sy - s / 2, s, s);
      ctx.font = '700 11px Montserrat, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.halo;
      ctx.strokeText(train.label, sx, sy + s * 0.95 + 3);
      ctx.fillStyle = theme.trainText;
      ctx.fillText(train.label, sx, sy + s * 0.95 + 3);
      hits.push({ kind: 'train', x: sx, y: sy, r: s / 2 + 3, train });
    }
    // --- Tooltip del tren bajo el cursor (código y tipo) ---
    const hovered = hoverRef.current;
    const hoverHit = hovered ? hits.find((hh) => hh.kind === 'train' && hh.train.tripId === hovered) : undefined;
    if (hoverHit && hoverHit.kind === 'train') {
      const label = hoverHit.train.label;
      const sub = hoverHit.train.tipo;
      ctx.font = '700 12px Montserrat, system-ui, sans-serif';
      const w1 = ctx.measureText(label).width;
      ctx.font = '600 11px Montserrat, system-ui, sans-serif';
      const w2 = ctx.measureText(sub).width;
      const tw = Math.max(w1, w2) + 20;
      const tx = Math.min(Math.max(hoverHit.x - tw / 2, 6), w - tw - 6);
      const ty = hoverHit.y - hoverHit.r - 46;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, 38, 10);
      ctx.fillStyle = theme.tooltipBg;
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.tooltipText;
      ctx.font = '700 12px Montserrat, system-ui, sans-serif';
      ctx.fillText(label, tx + tw / 2, ty + 13);
      ctx.globalAlpha = 0.65;
      ctx.font = '600 11px Montserrat, system-ui, sans-serif';
      ctx.fillText(sub, tx + tw / 2, ty + 27);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'start';

    hitItemsRef.current = hits;

    // Sigue animando mientras los trenes se desplazan o la plataforma se despliega
    if (t < 1 || spiderAnimating) frameRef.current = requestAnimationFrame((n) => drawRef.current(n));
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
      // En móvil reservamos la zona del panel "en directo" para que no tape el norte peninsular
      const padTop = w >= 768 ? 24 : 200;
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
      // La rueda la gestionamos nosotros (zoom animado); d3 se queda con arrastre, doble clic y gestos táctiles
      .filter((ev: MouseEvent) => ev.type !== 'wheel' && !ev.ctrlKey && !ev.button)
      // Por defecto d3 anula el clic si el ratón se mueve 1 px entre pulsar y soltar (lo trata como arrastre).
      // Con un ratón real eso pasa casi siempre: toleramos unos píxeles para que el clic llegue.
      .clickDistance(6)
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

    /** Elemento dibujado bajo el puntero (el último dibujado está encima) */
    const hitTest = (mx: number, my: number): HitItem | null => {
      const items = hitItemsRef.current;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        if ((it.x - mx) ** 2 + (it.y - my) ** 2 <= it.r * it.r) return it;
      }
      return null;
    };

    /** Acerca la vista a un grupo; si ni con el zoom máximo se separaría, lo abre en abanico */
    const openCluster = (members: { id: string; wx: number; wy: number }[]) => {
      const { w: W, h: H } = sizeRef.current;
      const k = transformRef.current.k;
      const xs = members.map((m) => m.wx);
      const ys = members.map((m) => m.wy);
      const minX = Math.min(...xs), maxX = Math.max(...xs);
      const minY = Math.min(...ys), maxY = Math.max(...ys);
      const span = Math.max(maxX - minX, maxY - minY);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;

      // ¿Se separarían al zoom máximo? (el par más cercano debe superar el radio de agrupación)
      let minPair = Infinity;
      for (let i = 0; i < members.length && minPair > 0; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const d = Math.hypot(members[i].wx - members[j].wx, members[i].wy - members[j].wy);
          if (d < minPair) minPair = d;
        }
      }
      const separable = minPair * MAX_ZOOM > clusterRadius(MAX_ZOOM);

      if (!separable && (k > MAX_ZOOM / 4 || span * MAX_ZOOM < clusterRadius(MAX_ZOOM) * 2)) {
        spiderRef.current = { ids: members.map((m) => m.id), center: [cx, cy], openedAt: performance.now() };
        // Centramos el abanico sin cambiar el zoom
        select(canvas)
          .transition()
          .duration(350)
          .call(zoomBehavior.transform, zoomIdentity.translate(W / 2 - cx * k, H / 2 - cy * k).scale(k));
        scheduleDraw();
        return;
      }

      // Zoom que encaja el grupo en ~la mitad de la vista (al menos ×2.5, como mucho ×12 por clic)
      const fit = span > 0 ? Math.min((W * 0.5) / (maxX - minX || 1e-9), (H * 0.5) / (maxY - minY || 1e-9)) : k * 6;
      let target = Math.max(k * 2.5, Math.min(fit, k * 12));
      // Grupos pequeños: zoom exacto para separar su par más cercano en un solo clic.
      // Dos iconos sueltos no se funden si su distancia en pantalla supera ~1,2 × icono + margen.
      if (members.length <= 4 && minPair > 0) {
        target = Math.max(target, (1.2 * trainSize(MAX_ZOOM) + 6) / minPair);
      }
      target = Math.min(MAX_ZOOM, target);
      select(canvas)
        .transition()
        .duration(550)
        .call(zoomBehavior.transform, zoomIdentity.translate(W / 2 - cx * target, H / 2 - cy * target).scale(target));
    };

    const local = (ev: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return [ev.clientX - rect.left, ev.clientY - rect.top] as const;
    };
    const onClick = (ev: MouseEvent) => {
      const hit = hitTest(...local(ev));
      if (!hit) {
        spiderRef.current = null;
        propsRef.current.onSelect(null);
        scheduleDraw();
        return;
      }
      if (hit.kind === 'block') return; // clic en hueco de la plataforma: no hace nada
      if (hit.kind === 'cluster') openCluster(hit.members);
      else propsRef.current.onSelect(hit.train);
    };
    const setHover = (id: string | null) => {
      if (hoverRef.current === id) return;
      hoverRef.current = id;
      scheduleDraw();
    };
    const onMove = (ev: MouseEvent) => {
      if (ev.buttons) return setHover(null);
      const hit = hitTest(...local(ev));
      canvas.style.cursor = hit && hit.kind !== 'block' ? 'pointer' : hit ? 'default' : 'grab';
      setHover(hit?.kind === 'train' ? hit.train.tripId : null);
    };
    const onLeave = () => setHover(null);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMove);

    /* --- Zoom con rueda animado (misma suavidad que el botón "+") ---
       Cada paso de rueda fija un zoom objetivo; un bucle rAF interpola hasta él manteniendo
       fijo el punto bajo el cursor. Los pasos que llegan durante la animación se acumulan
       sobre el objetivo, así girar la rueda rápido da un único movimiento continuo. */
    const WHEEL_MS = 320;
    let wheelAnim: { k0: number; k1: number; wx: number; wy: number; px: number; py: number; t0: number } | null = null;
    let wheelRaf = 0;

    const wheelStep = (now: number) => {
      const a = wheelAnim;
      if (!a) return;
      const t = Math.min(1, (now - a.t0) / WHEEL_MS);
      const eased = 1 - (1 - t) ** 3; // easeOutCubic
      const k = a.k0 * Math.pow(a.k1 / a.k0, eased); // interpolación geométrica: velocidad uniforme percibida
      zoomBehavior.transform(sel, zoomIdentity.translate(a.px - a.wx * k, a.py - a.wy * k).scale(k));
      if (t < 1) wheelRaf = requestAnimationFrame(wheelStep);
      else {
        wheelAnim = null;
        wheelRaf = 0;
      }
    };

    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      sel.interrupt(); // corta otras transiciones (p. ej. el zoom al pulsar un grupo)
      const unit = ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 100 : 1; // líneas/páginas → px
      const factor = ev.ctrlKey ? 0.01 : 0.0035; // ≈ ×1.27 por paso de rueda; ctrl+rueda = pellizco del trackpad
      const cur = transformRef.current;
      const base = wheelAnim ? wheelAnim.k1 : cur.k;
      const k1 = Math.min(MAX_ZOOM, Math.max(1, base * Math.pow(2, -ev.deltaY * unit * factor)));
      if (Math.abs(k1 - cur.k) < 1e-6 && !wheelAnim) return;
      const [px, py] = local(ev);
      wheelAnim = { k0: cur.k, k1, wx: (px - cur.x) / cur.k, wy: (py - cur.y) / cur.k, px, py, t0: performance.now() };
      if (!wheelRaf) wheelRaf = requestAnimationFrame(wheelStep);
    };

    // Si el usuario empieza a arrastrar, el arrastre manda
    const stopWheel = () => {
      wheelAnim = null;
      if (wheelRaf) cancelAnimationFrame(wheelRaf);
      wheelRaf = 0;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', stopWheel);

    return () => {
      stopWheel();
      sel.on('.zoom', null);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', stopWheel);
    };
  }, [topoData, scheduleDraw]);

  useImperativeHandle(ref, () => {
    const run = (fn: (z: ZoomBehavior<HTMLCanvasElement, unknown>, s: ReturnType<typeof select<HTMLCanvasElement, unknown>>) => void) => {
      const canvas = canvasRef.current;
      const z = zoomRef.current;
      if (canvas && z) fn(z, select(canvas));
    };
    return {
      zoomIn: () => run((z, s) => s.transition().duration(350).call(z.scaleBy, 2)),
      zoomOut: () => run((z, s) => s.transition().duration(350).call(z.scaleBy, 0.5)),
      reset: () => {
        spiderRef.current = null;
        run((z, s) => s.transition().duration(500).call(z.transform, zoomIdentity));
      },
      focus: (lon, lat) => {
        const projection = projectionRef.current;
        const { w, h } = sizeRef.current;
        const p = projection?.([lon, lat]);
        if (!p || !w || !h || !zoomRef.current || !canvasRef.current) return false;
        const k = Math.min(4, MAX_ZOOM);
        // En móvil la ficha del tren tapa la mitad de abajo: el tren queda algo más arriba del centro
        const cy = w >= 768 ? h / 2 : h * 0.38;
        const t = zoomIdentity.translate(w / 2 - p[0] * k, cy - p[1] * k).scale(k);
        run((z, s) => s.transition().duration(700).call(z.transform, t));
        return true;
      },
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
