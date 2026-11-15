import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  Clock3,
  ListFilter,
  Moon,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from 'lucide-react';
import { TrainCard, type ProcessedTrain, type TrainStatus } from './TrainCard';
import {
  formatDuration,
  getMapTrainInfo,
  getTrainIdentity,
  getTrainLogo,
  timeToMinutes,
  TRAIN_FAMILIES,
} from '../../utils/trainUtils';

type Sort = 'departure' | 'duration';

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
  date: string; // yyyy-MM-dd
  onNextDay: () => void;
}

export const TrainResults = ({ trains, date, onNextDay }: TrainResultsProps) => {
  const [sort, setSort] = useState<Sort>('departure');
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [periods, setPeriods] = useState<Set<string>>(new Set());
  const [families, setFamilies] = useState<Set<string>>(new Set());
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
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
  const statusById = useMemo(() => {
    const map = new Map<string, TrainStatus>();
    if (date !== format(new Date(), 'yyyy-MM-dd')) return map;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let nextAssigned = false;
    for (const t of [...trains].sort((a, b) => timeToMinutes(a.departureTime) - timeToMinutes(b.departureTime))) {
      if (timeToMinutes(t.departureTime) < nowMin) map.set(t.tripId, 'departed');
      else if (!nextAssigned) {
        map.set(t.tripId, 'next');
        nextAssigned = true;
      }
    }
    return map;
  }, [trains, date]);

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

  const groups =
    sort === 'departure'
      ? PERIODS.map((p) => ({ ...p, items: visible.filter((t) => periodOf(t) === p.key) })).filter((g) => g.items.length)
      : [{ key: 'all', label: '', range: '', Icon: null as LucideIcon | null, from: 0, to: 0, items: visible }];

  let index = 0;

  return (
    <div className="space-y-6">
      {/* ---------- Barra: filtros rápidos · filtros · orden ---------- */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:pb-0 [&::-webkit-scrollbar]:hidden">
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
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-all ${
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
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="grid gap-6 rounded-3xl border border-slate-200/80 bg-white p-5 md:grid-cols-2 dark:border-white/[0.07] dark:bg-slate-900/60">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- Lista ---------- */}
      {visible.length === 0 ? (
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
        groups.map((g) => (
          <section key={g.key} className="space-y-3">
            {g.Icon && (
              <div className="flex items-center gap-3 pt-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  <g.Icon size={17} strokeWidth={2.5} />
                </span>
                <div className="leading-tight">
                  <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">{g.label}</h3>
                  <p className="font-mono text-[12px] font-semibold text-slate-400 dark:text-slate-500">{g.range}</p>
                </div>
                <span className="ml-1 h-px flex-1 bg-slate-200 dark:bg-white/[0.08]" />
              </div>
            )}
            <div className="space-y-2.5">
              {g.items.map((train) => (
                <TrainCard key={train.tripId} train={train} index={index++} status={statusById.get(train.tripId) ?? null} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
