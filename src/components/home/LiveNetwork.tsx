import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, MapPin, Radio, RefreshCw } from 'lucide-react';
import { trainsService, type TrainMap } from '../../api/trainsService';
import { CITIES, COLORS, getTrainColor } from '../map/MapConstants';

const POLL_MS = 30_000;
/** Radio para asignar un tren a una ciudad (km) */
const CITY_RADIUS_KM = 30;

const CATEGORIES = [
  { label: 'Alta velocidad', color: COLORS.altaVelocidad },
  { label: 'Larga y media distancia', color: COLORS.mediaDistancia },
  { label: 'Cercanías', color: COLORS.cercanias },
  { label: 'Rodalies', color: COLORS.rodalies },
  { label: 'Otros', color: COLORS.otros },
];

/** Distancia aproximada en km (equirectangular: sobra precisión para radios de decenas de km) */
const distanceKm = (lon1: number, lat1: number, lon2: number, lat2: number) => {
  const dx = (lon2 - lon1) * Math.cos(((lat1 + lat2) / 2) * (Math.PI / 180)) * 111.32;
  const dy = (lat2 - lat1) * 110.57;
  return Math.hypot(dx, dy);
};

/**
 * "La red, ahora mismo": trenes circulando, reparto por tipo y ciudades con más trenes.
 * Solo consulta la API cuando la sección entra en pantalla y se refresca cada 30 s
 * mientras la pestaña está visible.
 */
const LiveNetwork = () => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [trains, setTrains] = useState<TrainMap[] | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    const load = () =>
      trainsService
        .getLiveMap()
        .then((data) => {
          if (cancelled) return;
          setTrains(data);
          setUpdatedAt(new Date());
          setError(false);
        })
        .catch(() => !cancelled && setError(true));

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || interval) return;
        load();
        interval = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
        io.disconnect();
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      if (interval) clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    if (!trains) return null;
    const byColor = new Map<string, number>();
    const byCity = new Map<string, number>();
    for (const t of trains) {
      const c = getTrainColor(t.tipo);
      byColor.set(c, (byColor.get(c) ?? 0) + 1);
      // Ciudad más cercana dentro del radio
      let best: string | null = null;
      let bestD = CITY_RADIUS_KM;
      for (const [name, lon, lat] of CITIES) {
        const d = distanceKm(t.lon, t.lat, lon, lat);
        if (d < bestD) {
          bestD = d;
          best = name;
        }
      }
      if (best) byCity.set(best, (byCity.get(best) ?? 0) + 1);
    }
    const categories = CATEGORIES.map((c) => ({ ...c, count: byColor.get(c.color) ?? 0 })).filter((c) => c.count > 0);
    const cities = [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { total: trains.length, categories, cities };
  }, [trains]);

  const loading = !stats && !error;

  return (
    // En escritorio la cabecera va en la columna izquierda, junto al total: la sección ocupa
    // a lo ancho en lugar de apilarse y cabe en la pantalla de un portátil
    <section ref={sectionRef} className="relative grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
      <div className="min-w-0 space-y-8 compact:space-y-6">
        {/* Cabecera */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            <Radio size={14} /> En directo
          </div>
          <h2 className="text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-4xl lg:leading-[1.1] dark:text-white">
            La red, ahora mismo
          </h2>
          <p className="text-base leading-relaxed text-slate-500 md:text-lg dark:text-slate-400">
            Trenes circulando en este momento según su posición en tiempo real.
          </p>
        </div>

        {/* ---------- Total y reparto (sin tarjeta, tipografía grande) ---------- */}
        <div className="relative">
          {/* Trazado de vías decorativo detrás del número */}
          <svg
            aria-hidden
            viewBox="0 0 600 300"
            preserveAspectRatio="xMidYMid slice"
            className="pointer-events-none absolute -inset-x-6 -top-10 h-60 w-[calc(100%+3rem)] text-slate-200 dark:text-white/[0.06]"
          >
            <g fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M -10 230 L 260 230 L 340 150 L 610 150" />
              <path d="M -10 260 L 300 260 L 380 180 L 610 180" />
            </g>
            <circle cx={260} cy={230} r={5} className="fill-white dark:fill-[#020617]" stroke="currentColor" strokeWidth={1.5} />
            <circle cx={340} cy={150} r={5} className="fill-white dark:fill-[#020617]" stroke="currentColor" strokeWidth={1.5} />
          </svg>

          <div className="relative space-y-6 compact:space-y-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Trenes circulando
              </span>
              {updatedAt && (
                <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <RefreshCw size={12} />
                  {updatedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-6">
                <span className="block h-20 w-48 animate-pulse rounded-3xl bg-slate-100 dark:bg-white/[0.06]" />
                <span className="block h-2.5 w-full animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
              </div>
            ) : error && !stats ? (
              <p className="text-slate-500 dark:text-slate-400">No se han podido cargar los datos en directo.</p>
            ) : (
              stats && (
                <>
                  <p
                    key={stats.total}
                    className="soft-fade bg-gradient-to-br from-[#002147] via-[#0b3a6e] to-accent-600 bg-clip-text pb-2 text-[clamp(3rem,6vw,4.75rem)] font-black leading-[0.9] tracking-tighter text-transparent tabular-nums dark:from-white dark:via-accent-100 dark:to-accent-400"
                  >
                    {stats.total.toLocaleString('es-ES')}
                  </p>

                  {/* Barra proporcional */}
                  <div className="flex h-2.5 w-full gap-1">
                    {stats.categories.map((c) => (
                      <span
                        key={c.label}
                        className="h-full rounded-full"
                        style={{ width: `${(c.count / stats.total) * 100}%`, background: c.color }}
                      />
                    ))}
                  </div>

                  {/* Tipos en columnas separadas por líneas */}
                  <ul className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-5">
                    {stats.categories.map((c) => (
                      <li
                        key={c.label}
                        className="border-t border-slate-200 pt-3 dark:border-white/10"
                      >
                        <span className="flex items-start gap-2 text-[12px] sm:min-h-[2lh] font-semibold leading-tight text-slate-500 dark:text-slate-400">
                          <span className="mt-[3px] h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                          {c.label}
                        </span>
                        <span className="mt-1 block text-2xl font-black tabular-nums text-slate-900 dark:text-white">{c.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            )}

            <button
              type="button"
              onClick={() => navigate('/mapa')}
              className="group flex items-center gap-2.5 rounded-full bg-slate-900 py-2.5 pl-5 pr-2.5 text-sm font-bold text-white transition-transform active:scale-95 dark:bg-white dark:text-slate-900"
            >
              Abrir mapa en vivo
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:rotate-45 dark:bg-slate-900/10">
                <ArrowUpRight size={15} strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Ranking de ciudades (tablero, sin tarjeta) ---------- */}
      <div className="min-w-0 lg:pt-2">
        <div className="flex items-baseline justify-between gap-4 pb-4">
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            <MapPin size={18} strokeWidth={2.5} className="text-accent-600 dark:text-accent-400" />
            Dónde hay más trenes
          </h3>
          <span className="whitespace-nowrap text-[12px] font-semibold text-slate-400 dark:text-slate-500">radio de {CITY_RADIUS_KM} km</span>
        </div>

        {loading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-5 border-t border-slate-200 py-3 dark:border-white/10">
                <span className="h-8 w-8 animate-pulse rounded-lg bg-slate-100 dark:bg-white/[0.06]" />
                <span className="h-4 flex-1 animate-pulse rounded-full bg-slate-100 dark:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : stats && stats.cities.length > 0 ? (
          <ol className="border-b border-slate-200 dark:border-white/10">
            {stats.cities.map(([name, count], i) => (
              <li key={name} className="flex items-center gap-5 border-t border-slate-200 py-3 dark:border-white/10">
                <span
                  className={`w-8 shrink-0 text-2xl font-black leading-none tabular-nums ${
                    i === 0 ? 'text-accent-600 dark:text-accent-400' : 'text-slate-200 dark:text-white/10'
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-base font-bold text-slate-900 dark:text-white">{name}</span>
                    <span className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{count}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    {/* Crece al aparecer y se ajusta con transición al llegar datos (CSS, GPU) */}
                    <span
                      className="grow-x block h-full w-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600"
                      style={{ transform: `scaleX(${count / stats.cities[0][1]})`, '--delay': `${i * 60}ms` } as CSSProperties}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="border-t border-slate-200 pt-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
            Sin datos en este momento.
          </p>
        )}
      </div>
    </section>
  );
};

export default LiveNetwork;
