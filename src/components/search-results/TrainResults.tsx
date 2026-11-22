import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ChevronDown,
  Clock3,
  ListFilter,
  Moon,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useAllAlerts } from '../../hooks/useAllAlerts';
import { alertMatcher, isWarningAlert, type ServiceAlert } from '../../api/alertsService';
import { AlertsList } from '../alerts/TrainAlerts';
import { TrainCard, type ProcessedTrain, type TrainStatus } from './TrainCard';
import TrainDetailSheet from './TrainDetailSheet';
import TrainSkeleton from './TrainSkeleton';
import { useNow } from '../../hooks/useNow';
import { useLiveTrains } from '../../hooks/useLiveTrains';
import { getResultsSort, getRouteFilters, setResultsSort, setRouteFilters, type ResultsSort } from '../../utils/preferences';
import {
  formatClock,
  formatDuration,
  getMapTrainInfo,
  getTrainIdentity,
  getTrainLogo,
  timeToMinutes,
  TRAIN_FAMILIES,
} from '../../utils/trainUtils';

type Sort = ResultsSort;

/** Ciudades y estaciones del trayecto (texto al compartir y evento de calendario) */
export interface RouteInfo {
  from: string;
  to: string;
  fromStation?: string;
  toStation?: string;
}

/** Franjas horarias (hora de salida) */
const PERIODS: { key: string; label: string; range: string; Icon: LucideIcon; from: number; to: number }[] = [
  { key: 'madrugada', label: 'Madrugada', range: '00:00 – 06:00', Icon: Moon, from: 0, to: 6 },
  { key: 'manana', label: 'Mañana', range: '06:00 – 14:00', Icon: Sunrise, from: 6, to: 14 },
  { key: 'tarde', label: 'Tarde', range: '14:00 – 20:00', Icon: Sun, from: 14, to: 20 },
  { key: 'noche', label: 'Noche', range: '20:00 – 24:00', Icon: Sunset, from: 20, to: 99 },
];

const periodOf = (t: ProcessedTrain) => {
  const h = Math.floor(timeToMinutes(t.departureTime) / 60);
  return PERIODS.find((p) => h >= p.from && h < p.to)!.key;
};
const typeKey = (t: string) => t.trim().toUpperCase();
const familyOf = (t: ProcessedTrain) => getMapTrainInfo(t.trainType).family?.name ?? null;

const toggleIn = (set: Set<string>, value: string) => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

const Chip = ({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-35 ${
      active
        ? 'border-accent-600 bg-accent-50 text-accent-700 dark:border-accent-400 dark:bg-accent-500/15 dark:text-accent-200'
        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-transparent dark:text-slate-300 dark:hover:border-white/20'
    }`}
  >
    {children}
  </button>
);

const FilterGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{title}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Resultados                                                          */
/* ------------------------------------------------------------------ */

interface TrainResultsProps {
  trains: ProcessedTrain[];
  /** Cargando otro día: se mantienen cabecera y filtros y la lista pasa a esqueleto */
  loading?: boolean;
  date: string; // yyyy-MM-dd
  /** Ciudades y estaciones del trayecto, para compartir un tren o añadirlo al calendario */
  route?: RouteInfo;
  /** "origen|destino": el orden y los filtros se recuerdan por trayecto */
  routeKey: string;
  onNextDay: () => void;
}

/**
 * Avisos de las líneas del trayecto: franja ámbar sobre los resultados que despliega sus textos.
 * Cuenta incidencias e información por separado.
 */
const RouteAlerts = ({ alerts, lines }: { alerts: ServiceAlert[]; lines: string[] }) => {
  const [open, setOpen] = useState(false);
  const warnings = alerts.filter(isWarningAlert).length;
  const infos = alerts.length - warnings;
  const parts = [
    warnings && `${warnings} ${warnings === 1 ? 'incidencia' : 'incidencias'}`,
    infos && `${infos} ${infos === 1 ? 'aviso informativo' : 'avisos informativos'}`,
  ].filter(Boolean);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-50 px-4 py-3 text-left transition-colors hover:bg-amber-100/70 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:hover:bg-amber-400/[0.1]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950">
          <TriangleAlert size={17} strokeWidth={2.5} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-black tracking-tight text-slate-900 dark:text-white">
            Avisos en {lines.length === 1 ? 'la línea' : 'las líneas'} {lines.join(', ')}
          </span>
          <span className="block text-[12px] font-semibold text-slate-500 dark:text-slate-400">{parts.join(' · ')}</span>
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2.5}
          className={`shrink-0 text-amber-700 transition-transform duration-300 dark:text-amber-400 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className="mt-2.5">
        <AlertsList alerts={alerts} open={open} />
      </div>
    </div>
  );
};

/** "15 trenes · primero 06:20 · último 21:30 · el más rápido 2 h 30 min" */
const DaySummary = ({ trains }: { trains: ProcessedTrain[] }) => {
  const byDeparture = [...trains].sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime));
  const fastest = Math.min(...trains.map((t) => t.durationMin));
  const parts = [
    `${trains.length} ${trains.length === 1 ? 'tren' : 'trenes'}`,
    trains.length > 1 && `primero ${formatClock(byDeparture[0].departureTime)}`,
    trains.length > 1 && `último ${formatClock(byDeparture[byDeparture.length - 1].departureTime)}`,
    `${trains.length > 1 ? 'el más rápido' : 'duración'} ${formatDuration(fastest)}`,
  ].filter(Boolean);
  return (
    <p className="mb-3 px-1 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>}
          <span className={i === 0 ? 'font-bold text-slate-700 dark:text-slate-200' : 'tabular-nums'}>{p}</span>
        </Fragment>
      ))}
    </p>
  );
};

/** Separador "Ahora · 14:32" entre los trenes que ya han salido y los siguientes */
const NowMarker = ({ time, ref }: { time: string; ref: React.Ref<HTMLDivElement> }) => (
  <div ref={ref} className="col-span-full flex scroll-mt-48 items-center gap-3 py-1" role="separator" aria-label={`Ahora, ${time}`}>
    <span className="flex items-center gap-1.5 rounded-full bg-accent-600 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white dark:bg-accent-500">
      Ahora <span className="tabular-nums opacity-80">{time}</span>
    </span>
    <span className="h-0.5 flex-1 rounded-full bg-accent-500/40" />
  </div>
);

export const TrainResults = ({ trains, loading = false, date, route, routeKey, onNextDay }: TrainResultsProps) => {
  // Orden preferido (uno para todos los trayectos) y filtros de este trayecto: se recuerdan.
  // El componente se monta de nuevo al cambiar de trayecto (key en la página)
  const [sort, setSortState] = useState<Sort>(getResultsSort);
  const setSort = (value: Sort) => {
    setSortState(value);
    setResultsSort(value);
  };
  const [saved] = useState(() => getRouteFilters(routeKey));

  // Hoy: reloj que avanza solo (cuenta atrás, "ya ha salido") y trenes en circulación
  const isToday = date === format(new Date(), 'yyyy-MM-dd');
  const now = useNow(isToday);
  const live = useLiveTrains(
    useMemo(() => trains.map((t) => t.tripId), [trains]),
    isToday && !loading,
  );

  /* --- Avisos de Cercanías/Rodalies que afectan a estos trenes (hoy o días siguientes) --- */
  const upcomingDate = date >= format(new Date(), 'yyyy-MM-dd');
  const { alerts: allAlerts } = useAllAlerts(upcomingDate);
  const { alertsByTrip, routeAlerts, alertLines } = useMemo(() => {
    const byTrip = new Map<string, ServiceAlert[]>();
    const unique = new Map<number, ServiceAlert>();
    const lines = new Set<string>();
    if (!upcomingDate || !allAlerts?.length) return { alertsByTrip: byTrip, routeAlerts: [], alertLines: [] };
    // Los trenes de un trayecto comparten muy pocas líneas: se calcula una vez por núcleo + línea
    const byLine = new Map<string, ServiceAlert[]>();
    for (const t of trains) {
      const key = `${t.tripId.slice(0, 2)}|${typeKey(t.trainType)}`;
      let found = byLine.get(key);
      if (!found) {
        found = allAlerts.filter(alertMatcher({ tripId: t.tripId, tipo: t.trainType }));
        byLine.set(key, found);
      }
      if (!found.length) continue;
      byTrip.set(t.tripId, found);
      lines.add(t.trainType.trim());
      for (const a of found) unique.set(a.id, a);
    }
    // Incidencias primero; dentro de cada tipo, las más recientes arriba
    const sorted = [...unique.values()].sort(
      (a, b) => Number(isWarningAlert(b)) - Number(isWarningAlert(a)) || b.fechaInicio.localeCompare(a.fechaInicio),
    );
    return { alertsByTrip: byTrip, routeAlerts: sorted, alertLines: [...lines].sort() };
  }, [trains, allAlerts, upcomingDate]);
  // Tren cuyo detalle está abierto en el panel (hoja inferior en móvil, lateral en escritorio)
  const [selected, setSelected] = useState<ProcessedTrain | null>(null);
  const closeDetail = useCallback(() => setSelected(null), []);

  // Enlace compartido de un tren concreto (?tren=tripId): se abre su detalle al llegar y el
  // parámetro se quita, para que cerrar el panel no lo vuelva a abrir
  const [searchParams, setSearchParams] = useSearchParams();
  const sharedTrip = searchParams.get('tren');
  useEffect(() => {
    if (!sharedTrip) return;
    const train = trains.find((t) => t.tripId === sharedTrip);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abrir una sola vez el tren del enlace
    if (train) setSelected(train);
    setSearchParams(
      (prev) => {
        prev.delete('tren');
        return prev;
      },
      { replace: true },
    );
  }, [sharedTrip, trains, setSearchParams]);
  const [types, setTypes] = useState<Set<string>>(() => new Set(saved?.types));
  const [periods, setPeriods] = useState<Set<string>>(() => new Set(saved?.periods));
  const [families, setFamilies] = useState<Set<string>>(() => new Set(saved?.families));
  const [maxDuration, setMaxDuration] = useState<number | null>(saved?.maxDuration ?? null);

  // Se guardan al cambiar (localStorage es un sistema externo: efecto sin estado)
  useEffect(() => {
    setRouteFilters(routeKey, { types: [...types], periods: [...periods], families: [...families], maxDuration });
  }, [routeKey, types, periods, families, maxDuration]);
  const [showDeparted, setShowDeparted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  /* --- Opciones disponibles según los trenes del día --- */
  const typeOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    for (const t of trains) {
      const k = typeKey(t.trainType);
      const cur = counts.get(k);
      if (cur) cur.count++;
      else counts.set(k, { label: t.trainType.trim(), count: 1 });
    }
    return [...counts.entries()].sort((a, b) => b[1].count - a[1].count);
  }, [trains]);

  const periodCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const t of trains) c.set(periodOf(t), (c.get(periodOf(t)) ?? 0) + 1);
    return c;
  }, [trains]);

  const familyCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const t of trains) {
      const f = familyOf(t);
      if (f) c.set(f, (c.get(f) ?? 0) + 1);
    }
    return c;
  }, [trains]);

  const durations = trains.map((t) => t.durationMin);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const durationLimit = maxDuration !== null && maxDuration < maxDur ? Math.max(maxDuration, minDur) : null;

  /* --- Estado: ya ha salido / próximo (solo si la fecha es hoy) --- */
  // Se recalcula cada 30 s con el reloj: un tren pasa a "ha salido" sin recargar
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const { statusById, nextDepartsIn } = useMemo(() => {
    const map = new Map<string, TrainStatus>();
    let departsIn: number | null = null;
    if (!isToday) return { statusById: map, nextDepartsIn: departsIn };
    for (const t of [...trains].sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime))) {
      if (timeToMinutes(t.departureTime) < nowMin) map.set(t.tripId, 'departed');
      else if (departsIn === null) {
        map.set(t.tripId, 'next');
        departsIn = timeToMinutes(t.departureTime) - nowMin;
      }
    }
    return { statusById: map, nextDepartsIn: departsIn };
  }, [trains, isToday, nowMin]);

  const departedCount = [...statusById.values()].filter((s) => s === 'departed').length;
  const allGoneToday = departedCount > 0 && departedCount === trains.length && !showDeparted;

  // Los filtros que ya no aplican (p. ej. tras cambiar de día) se ignoran
  const activeTypes = [...types].filter((k) => typeOptions.some(([o]) => o === k));
  const activePeriods = [...periods].filter((p) => periodCounts.has(p));
  const activeFamilies = [...families].filter((f) => familyCounts.has(f));
  const activeFilterCount =
    activePeriods.length + activeFamilies.length + (durationLimit !== null ? 1 : 0) + (showDeparted ? 1 : 0);

  const clearFilters = () => {
    setTypes(new Set());
    setPeriods(new Set());
    setFamilies(new Set());
    setMaxDuration(null);
    setShowDeparted(false);
  };

  /* --- Lista filtrada, ordenada y agrupada --- */
  const visible = (() => {
    const list = trains.filter(
      (t) =>
        (activeTypes.length === 0 || activeTypes.includes(typeKey(t.trainType))) &&
        (activePeriods.length === 0 || activePeriods.includes(periodOf(t))) &&
        (activeFamilies.length === 0 || activeFamilies.includes(familyOf(t) ?? '')) &&
        (durationLimit === null || t.durationMin <= durationLimit) &&
        (showDeparted || statusById.get(t.tripId) !== 'departed'),
    );
    return list.sort((a, b) =>
      sort === 'duration'
        ? a.durationMin - b.durationMin || timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime)
        : timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime),
    );
  })();

  // Línea "Ahora": hoy, ordenando por salida y con los que ya han salido a la vista, justo antes
  // del primer tren que aún no ha salido (si hay trenes a los dos lados)
  const nowMarkerId =
    isToday && sort === 'departure' && showDeparted && visible.some((t) => statusById.get(t.tripId) === 'departed')
      ? (visible.find((t) => statusById.get(t.tripId) !== 'departed')?.tripId ?? null)
      : null;
  // Al mostrar los que ya han salido, la lista baja sola hasta "Ahora" (el próximo tren)
  const nowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showDeparted) nowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [showDeparted]);

  return (
    <div className="space-y-6">
      {routeAlerts.length > 0 && <RouteAlerts alerts={routeAlerts} lines={alertLines} />}

      {/* ---------- Barra: filtros rápidos · filtros · orden ---------- */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* data-no-swipe: aquí deslizar desplaza los filtros, no cambia de día */}
          <div data-no-swipe className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:pb-0 [&::-webkit-scrollbar]:hidden">
            {/* Tipos de tren (con su logo) */}
            {typeOptions.map(([k, { label }]) => {
              const logo = getTrainLogo(getTrainIdentity(k).logo);
              return (
                <Chip key={k} active={activeTypes.includes(k)} onClick={() => setTypes((s) => toggleIn(s, k))}>
                  <img
                    src={logo.src}
                    alt=""
                    className={`h-3.5 w-auto max-w-[56px] object-contain ${logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
                  />
                  {label}
                </Chip>
              );
            })}

            {/* Panel de filtros */}
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              aria-expanded={panelOpen}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition-colors active:scale-95 ${
                panelOpen || activeFilterCount
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-white/10 dark:bg-transparent dark:text-slate-300'
              }`}
            >
              <ListFilter size={15} strokeWidth={2.5} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1.5 text-[11px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Orden */}
          <div className="flex shrink-0 rounded-full bg-slate-100 p-1 dark:bg-white/[0.06]" role="radiogroup" aria-label="Ordenar">
            {(
              [
                ['departure', 'Salida', Clock3],
                ['duration', 'Más rápidos', ArrowDownWideNarrow],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={sort === value}
                onClick={() => setSort(value)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition ${
                  sort === value
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon size={14} strokeWidth={2.5} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Panel de filtros ---------- */}
        {/* Se despliega con CSS (grid-template-rows + fundido), sin JavaScript por frame. Cerrado
            queda inerte: ni foco ni lector de pantalla */}
        <div
          data-no-swipe
          className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            panelOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
          inert={!panelOpen}
          aria-hidden={!panelOpen}
        >
          <div className="min-h-0 overflow-hidden">
              <div
                className={`grid gap-6 rounded-3xl border border-slate-200/80 bg-white p-5 transition-opacity duration-200 md:grid-cols-2 xl:grid-cols-4 dark:border-white/[0.07] dark:bg-slate-900/60 ${
                  panelOpen ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <FilterGroup title="Hora de salida">
                  {PERIODS.map((p) => (
                    <Chip
                      key={p.key}
                      active={activePeriods.includes(p.key)}
                      disabled={!periodCounts.has(p.key)}
                      onClick={() => setPeriods((s) => toggleIn(s, p.key))}
                    >
                      <p.Icon size={14} strokeWidth={2.5} />
                      {p.label}
                      <span className="text-[11px] font-semibold opacity-60">{p.range.replace(' – ', '–')}</span>
                    </Chip>
                  ))}
                </FilterGroup>

                <FilterGroup title="Familia">
                  {Object.values(TRAIN_FAMILIES).map((f) => (
                    <Chip
                      key={f.name}
                      active={activeFamilies.includes(f.name)}
                      disabled={!familyCounts.has(f.name)}
                      onClick={() => setFamilies((s) => toggleIn(s, f.name))}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: f.color }} />
                      {f.name}
                    </Chip>
                  ))}
                </FilterGroup>

                <div className="space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                      Duración máxima
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {durationLimit === null ? 'Cualquiera' : `Hasta ${formatDuration(durationLimit)}`}
                    </p>
                  </div>
                  <input
                    type="range"
                    min={minDur}
                    max={maxDur}
                    step={5}
                    disabled={minDur === maxDur}
                    value={durationLimit ?? maxDur}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    aria-label="Duración máxima"
                    className="w-full accent-accent-600 disabled:opacity-40"
                  />
                  <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    <span>{formatDuration(minDur)}</span>
                    <span>{formatDuration(maxDur)}</span>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4">
                  {departedCount > 0 && (
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Mostrar trenes que ya han salido
                        <span className="ml-1 text-slate-400">({departedCount})</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={showDeparted}
                        onChange={(e) => setShowDeparted(e.target.checked)}
                        className="h-5 w-5 accent-accent-600"
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={activeFilterCount === 0 && activeTypes.length === 0}
                    className="flex items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-[13px] font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  >
                    <RotateCcw size={14} strokeWidth={2.5} /> Limpiar filtros
                  </button>
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* ---------- Resumen del día (de los trenes que se ven) ---------- */}
      {!loading && visible.length > 0 && <DaySummary trains={visible} />}

      {/* ---------- Lista ---------- */}
      {loading ? (
        <div className="grid gap-2.5 2xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <TrainSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        allGoneToday ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-200 px-6 py-12 text-center dark:border-white/10">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
              <Moon size={24} />
            </span>
            <p className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Ya no quedan trenes hoy</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Todos los trenes de este trayecto ya han salido. Mira los de mañana.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={onNextDay}
                className="flex items-center gap-2 rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white transition-transform active:scale-95 dark:bg-accent-500"
              >
                Ver trenes de mañana <ArrowRight size={15} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={() => setShowDeparted(true)}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 active:scale-95 dark:bg-white/[0.06] dark:text-slate-200"
              >
                Ver los de hoy
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-white/10">
            <p className="text-sm text-slate-500 dark:text-slate-400">Ningún tren cumple estos filtros.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-[13px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-slate-200"
            >
              <RotateCcw size={14} strokeWidth={2.5} /> Limpiar filtros
            </button>
          </div>
        )
      ) : (
        // Lista seguida, sin separar por tramos horarios (se filtran desde "Hora de salida").
        // Hoy, con los que ya han salido a la vista, una línea "Ahora" separa pasado y futuro
        <div className="grid gap-2.5 2xl:grid-cols-2">
          {visible.map((train, i) => {
            const status = statusById.get(train.tripId) ?? null;
            const showNow = nowMarkerId === train.tripId;
            return (
              <Fragment key={train.tripId}>
                {showNow && <NowMarker ref={nowRef} time={format(now, 'HH:mm')} />}
                <TrainCard
                  train={train}
                  index={i}
                  status={status}
                  departsIn={status === 'next' ? nextDepartsIn : null}
                  live={live.get(train.tripId)}
                  warning={alertsByTrip.get(train.tripId)?.some(isWarningAlert) ?? false}
                  onOpen={setSelected}
                  active={selected?.tripId === train.tripId}
                />
              </Fragment>
            );
          })}
        </div>
      )}

      <TrainDetailSheet
        train={selected}
        date={date}
        route={route}
        live={selected ? live.get(selected.tripId) : undefined}
        onClose={closeDetail}
      />
    </div>
  );
};
