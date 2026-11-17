import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { CalendarCheck, ChevronDown, ChevronUp, RotateCw, Search, SearchX, SlidersHorizontal, TriangleAlert, X } from 'lucide-react';
import { useAllAlerts } from '../hooks/useAllAlerts';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { AlertItem, AlertItemSkeleton } from '../components/alerts/AlertItem';
import { GENERAL_KEY, lineSort, networkName, sortAlertViews, toAlertView, type AlertView } from '../components/alerts/alertFormat';
import { cleanAlertText } from '../api/alertsService';

type Kind = 'all' | 'warning' | 'info';
const KINDS: [Kind, string][] = [
  ['all', 'Todo'],
  ['warning', 'Avisos'],
  ['info', 'Información'],
];

/** Espera desde la última tecla hasta filtrar la lista */
const SEARCH_DEBOUNCE_MS = 250;

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** "C1,c5" (?lineas=) → ["C1", "C5"] */
const parseLines = (param: string) => param.split(',').filter(Boolean).map((l) => l.toUpperCase());

/** Muelle para los indicadores que se desplazan (solo transform → compuesto en GPU) */
const SLIDE = { type: 'spring', stiffness: 520, damping: 42, mass: 0.8 } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Fila de filtros: scroll horizontal en móvil, lista vertical en escritorio */
const FacetGroup = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-w-0">
    <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{title}</h2>
    {/* layoutScroll: el indicador se mide bien aunque la fila esté desplazada */}
    <motion.ul
      layoutScroll
      className="-mx-[var(--page-gutter)] flex gap-2 overflow-x-auto px-[var(--page-gutter)] [scrollbar-width:none] lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </motion.ul>
  </div>
);

/**
 * Opción de un grupo de filtros. El estado activo se marca con un indicador compartido por
 * todo el grupo (layoutId) que se desliza de una opción a otra: píldora en móvil, filete
 * lateral en escritorio.
 */
const FacetButton = ({
  group,
  label,
  count,
  active,
  onClick,
  ratio,
}: {
  group: string;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  /** Proporción 0–1 para la barra inferior (solo escritorio) */
  ratio?: number;
}) => (
  <li className="shrink-0">
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors duration-200 lg:w-full lg:justify-between lg:rounded-none lg:px-0 lg:py-2.5 ${
        active
          ? 'text-white lg:text-accent-600 dark:text-slate-900 lg:dark:text-accent-400'
          : `bg-slate-100 text-slate-600 hover:bg-slate-200 lg:bg-transparent lg:hover:bg-transparent lg:hover:text-slate-900 dark:bg-white/[0.06] dark:text-slate-300 lg:dark:bg-transparent dark:hover:text-white ${
              count === 0 ? 'opacity-45' : ''
            }`
      }`}
    >
      {active && (
        <>
          <motion.span layoutId={`${group}-pill`} transition={SLIDE} className="absolute inset-0 rounded-full bg-slate-900 lg:hidden dark:bg-white" />
          <motion.span
            layoutId={`${group}-rule`}
            transition={SLIDE}
            className="absolute -left-3 top-2.5 bottom-2.5 hidden w-[3px] rounded-full bg-accent-500 lg:block"
          />
        </>
      )}
      <span className="relative truncate">{label}</span>
      {count !== undefined && <span className="relative tabular-nums opacity-60">{count}</span>}
      {ratio !== undefined && (
        <span className="absolute inset-x-0 bottom-0 hidden h-px bg-slate-200 lg:block dark:bg-white/[0.07]">
          <span
            className={`block h-full origin-left transition-transform duration-500 ease-out ${
              active ? 'bg-accent-500' : 'bg-slate-400 dark:bg-slate-500'
            }`}
            style={{ transform: `scaleX(${ratio})` }}
          />
        </span>
      )}
    </button>
  </li>
);

/**
 * Buscador con estado propio: cada tecla solo re-renderiza este input. La página (y la lista
 * animada) recibe el texto con `onSearch` cuando el usuario lleva SEARCH_DEBOUNCE_MS sin escribir.
 * Borrar con la X se aplica al instante. Para vaciarlo desde fuera, se remonta cambiando su `key`.
 */
const SearchInput = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [text, setText] = useState('');
  const debounced = useDebouncedValue(text, SEARCH_DEBOUNCE_MS);

  useEffect(() => onSearch(debounced), [debounced, onSearch]);

  return (
    <label className="relative flex min-w-0 flex-1 items-center sm:max-w-sm">
      <Search size={16} className="pointer-events-none absolute left-3.5 text-slate-400" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Buscar estación, línea…"
        aria-label="Buscar en los avisos"
        className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:border-white/10 dark:bg-slate-900/60 dark:text-white [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText('');
            onSearch('');
          }}
          aria-label="Borrar búsqueda"
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06]"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </label>
  );
};

/**
 * Avisos del servicio: todos los avisos actuales de Cercanías y Rodalies.
 * Filtros por núcleo, líneas del núcleo, tipo y texto. Núcleo y líneas se guardan en la URL
 * (?nucleo=10&lineas=C1,C5) para poder enlazarlos.
 * Los recuentos de cada filtro tienen en cuenta el resto de filtros activos.
 */
const AlertsPage = () => {
  const { alerts, error, updatedAt, refresh, refreshing } = useAllAlerts();
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<Kind>('all');
  /** Texto ya "asentado" (con debounce): solo cambia cuando el usuario deja de escribir */
  const [query, setQuery] = useState('');
  /** Cambia para vaciar el buscador desde fuera ("Limpiar filtros") */
  const [searchKey, setSearchKey] = useState(0);

  // --- Filtros en la URL ---
  const network = params.get('nucleo');
  const linesParam = params.get('lineas') ?? '';
  const selectedLines = useMemo(() => parseLines(linesParam), [linesParam]);

  const update = (changes: Record<string, string | null>) =>
    setParams(
      (p) => {
        for (const [k, v] of Object.entries(changes)) {
          if (v) p.set(k, v);
          else p.delete(k);
        }
        return p;
      },
      { replace: true },
    );

  const selectNetwork = (code: string | null) => update({ nucleo: code, lineas: null });
  const toggleLine = (line: string) => {
    const next = selectedLines.includes(line) ? selectedLines.filter((l) => l !== line) : [...selectedLines, line];
    update({ lineas: next.sort(lineSort).join(',') || null });
  };
  const now = updatedAt?.getTime() ?? 0;
  const views = useMemo(() => sortAlertViews((alerts ?? []).map((a) => toAlertView(a, now))), [alerts, now]);

  // Texto de búsqueda de cada aviso, normalizado una sola vez por carga (no en cada filtrado)
  const searchIndex = useMemo(
    () =>
      new Map(
        views.map((v) => [
          v.alert.id,
          normalize(`${cleanAlertText(v.alert.descripcion)} ${v.lines.join(' ')} ${v.networks.map(networkName).join(' ')}`),
        ]),
      ),
    [views],
  );

  // Núcleos: orden estable por nº total de avisos (generales primero); el recuento sí es filtrado
  const networks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of views) for (const n of v.networks) counts.set(n, (counts.get(n) ?? 0) + 1);
    return [...counts.entries()]
      .sort(([a, ca], [b, cb]) => (a === GENERAL_KEY ? -1 : b === GENERAL_KEY ? 1 : cb - ca || a.localeCompare(b)))
      .map(([code]) => code);
  }, [views]);

  // Versiones diferidas de los filtros: los indicadores (píldoras, chips) usan el valor inmediato
  // y responden al instante; la lista y los recuentos se recalculan con prioridad baja, sin
  // bloquear la animación del indicador.
  const dKind = useDeferredValue(kind);
  const dNetwork = useDeferredValue(network);
  const dLinesParam = useDeferredValue(linesParam);
  const dQuery = useDeferredValue(query);

  /**
   * Una sola pasada por los avisos para obtener la lista filtrada y los recuentos de cada
   * grupo (núcleos sin contar núcleo/líneas; líneas sin contar líneas). Solo se recalcula
   * cuando cambian los datos o un filtro, nunca en renders intermedios.
   */
  const { filtered, networkCounts, networkTotal, lineCounts, lineOptions } = useMemo(() => {
    const q = normalize(dQuery.trim());
    const lines = parseLines(dLinesParam);
    const filtered: AlertView[] = [];
    const networkCounts = new Map<string, number>();
    const lineCounts = new Map<string, number>();
    const options = new Set<string>();
    let networkTotal = 0;

    for (const v of views) {
      const own = dNetwork ? (v.linesByNetwork[dNetwork] ?? []) : [];
      for (const l of own) options.add(l);

      if (q && !searchIndex.get(v.alert.id)?.includes(q)) continue;
      if (dKind !== 'all' && (dKind === 'warning') !== v.isWarning) continue;

      networkTotal++;
      for (const n of v.networks) networkCounts.set(n, (networkCounts.get(n) ?? 0) + 1);

      if (dNetwork && !v.networks.includes(dNetwork)) continue;
      for (const l of own) lineCounts.set(l, (lineCounts.get(l) ?? 0) + 1);

      if (dNetwork && lines.length && !lines.some((l) => own.includes(l))) continue;
      filtered.push(v);
    }

    return { filtered, networkCounts, networkTotal, lineCounts, lineOptions: [...options].sort(lineSort) };
  }, [views, searchIndex, dQuery, dKind, dNetwork, dLinesParam]);

  const networkCount = (code: string) => networkCounts.get(code) ?? 0;
  const maxNetworkCount = Math.max(1, ...networkCounts.values());
  const lineCount = (l: string) => lineCounts.get(l) ?? 0;
  /** Cambia con cada combinación de filtros: la lista se monta de nuevo y entra con su animación */
  const listKey = `${dKind}|${dNetwork}|${dLinesParam}|${dQuery}`;

  // De primeras solo se pintan los avisos de hoy (y los programados): menos filas que renderizar.
  // El resto se muestra bajo demanda con "Mostrar anteriores".
  const [showOlder, setShowOlder] = useState(false);
  const { recent, olderCount } = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const recent = filtered.filter((v) => v.upcoming || (v.start?.getTime() ?? 0) >= today.getTime());
    return { recent, olderCount: filtered.length - recent.length };
  }, [filtered, now]);
  const shown = showOlder ? filtered : recent;

  const hasFilters = !!(network || query || kind !== 'all');
  const clearFilters = () => {
    setKind('all');
    setQuery('');
    setSearchKey((k) => k + 1);
    update({ nucleo: null, lineas: null });
  };

  return (
    // reducedMotion="user": sin desplazamientos si el sistema pide reducir el movimiento
    <MotionConfig reducedMotion="user">
      <div className="fade-up space-y-12 pb-12">
        {/* Cabecera */}
        <header className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            <TriangleAlert size={14} /> Avisos
          </div>
          <h1 className="text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-5xl dark:text-white">
            Avisos del servicio
          </h1>
          <p className="text-base leading-relaxed text-slate-500 md:text-lg dark:text-slate-400">
            Incidencias, obras y cambios publicados para Cercanías y Rodalies.
          </p>
        </header>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
          {/* ---------- Filtros laterales ---------- */}
          <aside className="min-w-0 space-y-6 lg:sticky lg:top-6 lg:space-y-10 lg:self-start">
            <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
              <SlidersHorizontal size={18} strokeWidth={2.5} className="text-accent-600 dark:text-accent-400" />
              Filtros
            </h2>

            <FacetGroup title="Núcleos">
              <FacetButton group="network" label="Todos" count={networkTotal} active={!network} onClick={() => selectNetwork(null)} />
              {networks.map((code) => {
                const count = networkCount(code);
                return (
                  <FacetButton
                    key={code}
                    group="network"
                    label={networkName(code)}
                    count={count}
                    ratio={count / maxNetworkCount}
                    active={network === code}
                    onClick={() => selectNetwork(code)}
                  />
                );
              })}
            </FacetGroup>
          </aside>

          {/* ---------- Lista ---------- */}
          <section className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput key={searchKey} onSearch={setQuery} />

              <div role="radiogroup" aria-label="Tipo" className="flex rounded-full bg-slate-100 p-1 dark:bg-white/[0.06]">
                {KINDS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={kind === value}
                    onClick={() => setKind(value)}
                    className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors duration-200 ${
                      kind === value
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {/* Indicador único que se desliza (con su sombra) entre opciones */}
                    {kind === value && (
                      <motion.span
                        layoutId="kind-indicator"
                        transition={SLIDE}
                        className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.12),0_1px_2px_rgba(15,23,42,0.06)] dark:bg-slate-800 dark:shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                      />
                    )}
                    {value !== 'all' && (
                      <span className={`relative h-1.5 w-1.5 rounded-full ${value === 'warning' ? 'bg-amber-500' : 'bg-sky-500'}`} />
                    )}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Líneas del núcleo elegido */}
            <AnimatePresence initial={false} mode="wait">
              {lineOptions.length > 0 && (
                <motion.div
                  key={network}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="mt-4 flex flex-wrap items-center gap-1.5"
                >
                  <span className="mr-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                    Líneas
                  </span>
                  {lineOptions.map((l) => {
                    const active = selectedLines.includes(l);
                    const count = lineCount(l);
                    return (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLine(l)}
                        aria-pressed={active}
                        title={`${count} ${count === 1 ? 'aviso' : 'avisos'}`}
                        className={`rounded-md border px-2 py-1 text-[11px] font-black leading-none transition-colors ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                            : `border-slate-200 text-slate-600 hover:border-slate-400 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/30 ${
                                count === 0 ? 'opacity-45' : ''
                              }`
                        }`}
                      >
                        {l}
                      </button>
                    );
                  })}
                  {selectedLines.length > 0 && (
                    <button
                      type="button"
                      onClick={() => update({ lineas: null })}
                      className="ml-1 text-[12px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    >
                      Todas
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Estado + acciones */}
            <div className="mt-2 flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
              <p className="flex flex-wrap items-center gap-x-1.5 text-[12px] font-semibold text-slate-400 dark:text-slate-500">
                {alerts === null ? (
                  'Cargando avisos…'
                ) : error && !views.length ? (
                  'No se pudieron cargar los avisos.'
                ) : (
                  <>
                    <span>
                      {showOlder || !olderCount
                        ? `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}`
                        : `${recent.length} de hoy · ${olderCount} ${olderCount === 1 ? 'anterior oculto' : 'anteriores ocultos'}`}
                    </span>
                    {updatedAt && (
                      <span>· actualizado a las {updatedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {error && <span className="text-amber-600 dark:text-amber-400">· no se pudo actualizar</span>}
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="ml-1.5 inline-flex items-center gap-1 font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
                      >
                        <X size={12} strokeWidth={3} /> Limpiar filtros
                      </button>
                    )}
                  </>
                )}
              </p>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing || alerts === null}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-[13px] font-bold text-slate-700 transition-[background-color,transform] duration-200 hover:bg-slate-100 active:scale-[0.97] disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <RotateCw size={14} strokeWidth={2.5} className={refreshing ? 'animate-spin' : ''} />
                {/* Ancho fijo: las dos etiquetas ocupan la misma celda y la más larga reserva el espacio */}
                <span className="grid text-center">
                  <span aria-hidden className="invisible col-start-1 row-start-1">Actualizando…</span>
                  <span className="col-start-1 row-start-1">{refreshing ? 'Actualizando…' : 'Actualizar'}</span>
                </span>
              </button>
            </div>

            {/* La lista se remonta al cambiar los filtros (key) y sus primeras filas entran con una
                animación CSS escalonada. Al refrescar no se remonta: solo entran los avisos nuevos. */}
            <ul
              key={alerts === null ? 'loading' : listKey}
              className={`border-b border-slate-200/80 transition-opacity duration-300 dark:border-white/[0.07] ${refreshing ? 'opacity-60' : ''}`}
              aria-busy={refreshing}
            >
              {alerts === null
                ? Array.from({ length: 5 }).map((_, i) => <AlertItemSkeleton key={i} />)
                : shown.map((v, i) => <AlertItem key={v.alert.id} view={v} now={now} index={i} />)}
            </ul>

            {/* Avisos anteriores a hoy: se pintan solo si el usuario los pide */}
            {alerts !== null && olderCount > 0 && (
              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  onClick={() => setShowOlder((v) => !v)}
                  aria-expanded={showOlder}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-[13px] font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {showOlder ? <ChevronUp size={15} strokeWidth={2.5} /> : <ChevronDown size={15} strokeWidth={2.5} />}
                  {showOlder
                    ? 'Mostrar solo los de hoy'
                    : `Mostrar ${olderCount} ${olderCount === 1 ? 'aviso anterior' : 'avisos anteriores'}`}
                </button>
              </div>
            )}

            {alerts !== null && shown.length === 0 && !(error && !views.length) && (
              <div className="fade-up flex flex-col items-center gap-3 py-12 text-center">
                {filtered.length ? (
                  // Hay coincidencias, pero todas son de días anteriores (el botón de arriba las muestra)
                  <>
                    <CalendarCheck size={22} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {hasFilters ? 'Hoy no hay avisos nuevos con estos filtros.' : 'Hoy no se ha publicado ningún aviso nuevo.'}
                    </p>
                  </>
                ) : views.length ? (
                  <>
                    <SearchX size={22} className="text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ningún aviso coincide con estos filtros.</p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-[13px] font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300"
                    >
                      Limpiar filtros
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No hay avisos activos ahora mismo. Todo circula con normalidad.</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </MotionConfig>
  );
};

export default AlertsPage;
