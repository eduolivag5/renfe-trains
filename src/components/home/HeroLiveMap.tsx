import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { geoConicConformal, geoPath, type GeoProjection } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { onIdle } from '../../hooks/useReveal';
import { trainsService, type TrainMap } from '../../api/trainsService';
import { COLORS, getTrainColor } from '../map/MapConstants';

type Topo = Topology<{ provinces: GeometryCollection<{ name: string }>; neighbors: GeometryCollection }>;

const W = 520;
const H = 420;
const POLL_MS = 30_000;

const LEGEND = [
  { label: 'Alta velocidad', color: COLORS.altaVelocidad },
  { label: 'Larga y media distancia', color: COLORS.mediaDistancia },
  { label: 'Cercanías', color: COLORS.cercanias },
  { label: 'Rodalies', color: COLORS.rodalies },
];

const DOT_R = 2.8;

interface Geo {
  projection: GeoProjection;
  neighbors: string;
  land: string;
  coast: string;
  provinces: string;
}

/**
 * Proyecta la geometría una vez. Sin `topojson.merge` (une polígonos y es lo más caro): la tierra
 * se rellena con las provincias tal cual y la costa sale de `mesh` (aristas sin vecina).
 */
function buildGeo(topo: Topo): Geo {
  const provinces = feature(topo, topo.objects.provinces);
  const projection = geoConicConformal().parallels([36, 43.5]).rotate([3.6, 0]).fitExtent([[18, 18], [W - 18, H - 18]], provinces);
  const path = geoPath(projection);
  return {
    projection,
    neighbors: path(feature(topo, topo.objects.neighbors)) ?? '',
    land: path(provinces) ?? '',
    coast: path(mesh(topo, topo.objects.provinces, (a, b) => a === b)) ?? '',
    provinces: path(mesh(topo, topo.objects.provinces, (a, b) => a !== b)) ?? '',
  };
}

/** Círculo como subtrazado SVG (dos arcos): se concatenan todos los de un color en un único <path> */
const circlePath = (x: number, y: number) =>
  `M${(x - DOT_R).toFixed(1)} ${y.toFixed(1)}a${DOT_R} ${DOT_R} 0 1 0 ${DOT_R * 2} 0a${DOT_R} ${DOT_R} 0 1 0 ${-DOT_R * 2} 0`;

/**
 * Mini mapa en directo para el Hero (solo escritorio): península con cada tren en circulación
 * como un punto de color según su tipo. Se redibuja solo al llegar datos nuevos (cada 30 s y solo
 * con la pestaña visible).
 *
 * Rendimiento:
 * - La geometría se calcula cuando el navegador está libre (requestIdleCallback), no en el render.
 * - Los ~400 trenes son 4 <path> (uno por color), no 400 <circle>: DOM mínimo y un repintado barato.
 * - Los puntos van en un <svg> propio superpuesto; su aparición es una animación CSS de opacidad
 *   sobre ese elemento, que la GPU compone sin repintar el mapa base.
 */
const HeroLiveMap = () => {
  const navigate = useNavigate();
  const [geo, setGeo] = useState<Geo | null>(null);
  const [trains, setTrains] = useState<TrainMap[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    let cancelIdle = () => {};
    fetch('/map/spain.json')
      .then((r) => r.json() as Promise<Topo>)
      .then((t) => {
        if (!alive) return;
        cancelIdle = onIdle(() => alive && setGeo(buildGeo(t)));
      })
      .catch(() => {});
    const load = () =>
      trainsService
        .getLiveMap()
        .then((d) => {
          if (!alive) return;
          setTrains(d);
          setUpdatedAt(new Date());
        })
        .catch(() => {});
    load();
    const id = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => {
      alive = false;
      cancelIdle();
      clearInterval(id);
    };
  }, []);

  // Un trazado por color con todos sus trenes
  const dotPaths = useMemo(() => {
    if (!geo || !trains) return [];
    const byColor = new Map<string, string[]>();
    for (const t of trains) {
      const p = geo.projection([t.lon, t.lat]);
      if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
      const color = getTrainColor(t.tipo);
      if (!byColor.has(color)) byColor.set(color, []);
      byColor.get(color)!.push(circlePath(p[0], p[1]));
    }
    return [...byColor].map(([color, parts]) => ({ color, d: parts.join('') }));
  }, [geo, trains]);

  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-28px_rgba(2,33,71,0.35)] dark:border-white/[0.07] dark:bg-slate-900/70 dark:shadow-none">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">En directo</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black tabular-nums text-slate-900 dark:text-white">
            {trains ? trains.length.toLocaleString('es-ES') : '—'}
          </span>
          <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">trenes circulando</span>
        </div>
      </div>

      {/* Mapa */}
      <div className="relative bg-slate-50/60 dark:bg-white/[0.02]">
        {/* Mapa base: estático, no se vuelve a pintar al llegar trenes nuevos */}
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[clamp(220px,44vh,420px)] w-full" role="img" aria-label="Mapa con la posición de los trenes en circulación">
          {geo && (
            <>
              <path d={geo.neighbors} className="fill-slate-100 dark:fill-white/[0.03]" />
              <path d={geo.land} className="fill-white dark:fill-slate-800/80" />
              <path d={geo.provinces} className="fill-none stroke-slate-100 dark:stroke-white/[0.06]" strokeWidth={0.75} />
              <path d={geo.coast} className="fill-none stroke-slate-200 dark:stroke-white/10" strokeWidth={1} />
            </>
          )}
        </svg>
        {/* Trenes: capa propia; `key` relanza el fundido CSS (opacidad en GPU) con cada actualización */}
        {dotPaths.length > 0 && (
          <svg key={updatedAt?.getTime() ?? 0} viewBox={`0 0 ${W} ${H}`} aria-hidden className="soft-fade pointer-events-none absolute inset-0 h-full w-full">
            {dotPaths.map(({ color, d }) => (
              <path key={color} d={d} fill={color} className="stroke-white dark:stroke-slate-900" strokeWidth={0.8} />
            ))}
          </svg>
        )}
      </div>

      {/* Pie: leyenda + abrir mapa */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 dark:border-white/5">
        <ul className="flex min-w-0 flex-wrap gap-x-4 gap-y-1.5">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex min-w-0 items-start gap-1.5 text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400">
              <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => navigate('/mapa')}
          className="group flex shrink-0 items-center gap-1.5 rounded-full bg-slate-900 py-2 pl-4 pr-2 text-[13px] font-bold text-white transition-transform active:scale-95 dark:bg-white dark:text-slate-900"
        >
          Abrir mapa
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:rotate-45 dark:bg-slate-900/10">
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default HeroLiveMap;
