import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { geoConicConformal, geoPath } from 'd3-geo';
import { feature, merge, mesh } from 'topojson-client';
import type { GeometryCollection, MultiPolygon, Polygon, Topology } from 'topojson-specification';
import { trainsService, type TrainMap } from '../../api/trainsService';
import { COLORS, getTrainColor } from '../map/MapConstants';

type Topo = Topology<{ provinces: GeometryCollection<{ name: string }>; neighbors: GeometryCollection }>;

const W = 520;
const H = 420;
const POLL_MS = 30_000;

const LEGEND = [
  { label: 'Alta vel.', color: COLORS.altaVelocidad },
  { label: 'Media dist.', color: COLORS.mediaDistancia },
  { label: 'Cercanías', color: COLORS.cercanias },
  { label: 'Rodalies', color: COLORS.rodalies },
];

/**
 * Mini mapa en directo para el Hero (solo escritorio): península con cada tren en circulación
 * como un punto de color según su tipo. SVG estático que se redibuja solo al llegar datos nuevos
 * (cada 30 s y solo con la pestaña visible): sin canvas ni animaciones por frame.
 */
const HeroLiveMap = () => {
  const navigate = useNavigate();
  const [topo, setTopo] = useState<Topo | null>(null);
  const [trains, setTrains] = useState<TrainMap[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/map/spain.json')
      .then((r) => r.json() as Promise<Topo>)
      .then((t) => alive && setTopo(t))
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
      clearInterval(id);
    };
  }, []);

  // Geometría proyectada una sola vez
  const geo = useMemo(() => {
    if (!topo) return null;
    const land = merge(topo, topo.objects.provinces.geometries as (Polygon | MultiPolygon)[]);
    const projection = geoConicConformal().parallels([36, 43.5]).rotate([3.6, 0]).fitExtent([[18, 18], [W - 18, H - 18]], land);
    const path = geoPath(projection);
    return {
      projection,
      neighbors: path(feature(topo, topo.objects.neighbors)) ?? '',
      land: path(land) ?? '',
      provinces: path(mesh(topo, topo.objects.provinces, (a, b) => a !== b)) ?? '',
    };
  }, [topo]);

  const dots = useMemo(() => {
    if (!geo || !trains) return [];
    return trains.flatMap((t) => {
      const p = geo.projection([t.lon, t.lat]);
      return p && p[0] >= 0 && p[0] <= W && p[1] >= 0 && p[1] <= H
        ? [{ id: t.tripId, x: p[0], y: p[1], color: getTrainColor(t.tipo) }]
        : [];
    });
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
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-[clamp(220px,44vh,420px)] w-full" role="img" aria-label="Mapa con la posición de los trenes en circulación">
          {geo ? (
            <>
              <path d={geo.neighbors} className="fill-slate-100 dark:fill-white/[0.03]" />
              <path d={geo.land} className="fill-white stroke-slate-200 dark:fill-slate-800/80 dark:stroke-white/10" strokeWidth={1} />
              <path d={geo.provinces} className="fill-none stroke-slate-100 dark:stroke-white/[0.06]" strokeWidth={0.75} />
              <motion.g key={updatedAt?.getTime() ?? 0} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                {dots.map((d) => (
                  <circle key={d.id} cx={d.x} cy={d.y} r={2.8} fill={d.color} className="stroke-white dark:stroke-slate-900" strokeWidth={0.8} />
                ))}
              </motion.g>
            </>
          ) : (
            <rect x={0} y={0} width={W} height={H} className="animate-pulse fill-slate-100 dark:fill-white/[0.04]" />
          )}
        </svg>
      </div>

      {/* Pie: leyenda + abrir mapa */}
      <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4 dark:border-white/5">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {LEGEND.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
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
