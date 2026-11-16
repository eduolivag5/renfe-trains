import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TriangleAlert, X } from 'lucide-react';
import { useAllAlerts } from '../hooks/useAllAlerts';
import { AlertItem, AlertItemSkeleton } from '../components/alerts/AlertItem';
import { GENERAL_KEY, networkName, sortAlertViews, toAlertView } from '../components/alerts/alertFormat';
import { cleanAlertText } from '../api/alertsService';

type Kind = 'all' | 'warning' | 'info';
const KINDS: [Kind, string][] = [
  ['all', 'Todo'],
  ['warning', 'Avisos'],
  ['info', 'Información'],
];

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Avisos del servicio: todas las alertas actuales de Cercanías y Rodalies,
 * filtrables por núcleo (se guarda en ?nucleo= para poder enlazarlo), tipo y texto.
 */
const AlertsPage = () => {
  const { alerts, error, updatedAt } = useAllAlerts();
  const [params, setParams] = useSearchParams();
  const network = params.get('nucleo');
  const [kind, setKind] = useState<Kind>('all');
  const [query, setQuery] = useState('');

  const now = updatedAt?.getTime() ?? 0;
  const views = useMemo(() => sortAlertViews((alerts ?? []).map((a) => toAlertView(a, now))), [alerts, now]);

  // Núcleos con su nº de alertas (los generales siempre al final)
  const networks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of views) for (const n of v.networks) counts.set(n, (counts.get(n) ?? 0) + 1);
    return [...counts.entries()].sort(([a, ca], [b, cb]) =>
      a === GENERAL_KEY ? 1 : b === GENERAL_KEY ? -1 : cb - ca || a.localeCompare(b),
    );
  }, [views]);
  const maxCount = Math.max(1, ...networks.map(([, c]) => c));

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return views.filter(
      (v) =>
        (!network || v.networks.includes(network)) &&
        (kind === 'all' || (kind === 'warning') === v.isWarning) &&
        (!q || normalize(`${cleanAlertText(v.alert.descripcion)} ${v.lines.join(' ')} ${v.networks.map(networkName).join(' ')}`).includes(q)),
    );
  }, [views, network, kind, query]);

  const warnings = views.filter((v) => v.isWarning).length;

  const selectNetwork = (code: string | null) =>
    setParams(
      (p) => {
        if (code) p.set('nucleo', code);
        else p.delete('nucleo');
        return p;
      },
      { replace: true },
    );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-12">
      {/* Cabecera */}
      <header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
            <TriangleAlert size={14} /> Alertas
          </div>
          <h1 className="text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-5xl dark:text-white">
            Avisos del servicio
          </h1>
          <p className="text-base leading-relaxed text-slate-500 md:text-lg dark:text-slate-400">
            Incidencias, obras y cambios publicados para Cercanías y Rodalies. Se actualiza solo cada 2 minutos.
          </p>
        </div>

        <dl className="flex gap-10">
          <div>
            <dt className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Activas</dt>
            <dd className="mt-1 bg-gradient-to-br from-accent-500 to-accent-700 bg-clip-text text-5xl font-black tabular-nums tracking-tighter text-transparent dark:from-accent-300 dark:to-accent-500">
              {alerts ? views.length : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Avisos</dt>
            <dd className="mt-1 text-5xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">
              {alerts ? warnings : '—'}
            </dd>
          </div>
        </dl>
      </header>

      <div className="grid min-w-0 gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
        {/* ---------- Filtros por núcleo ---------- */}
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Núcleos</h2>
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
            {[[null, views.length] as [string | null, number], ...networks].map(([code, count]) => {
              const active = network === code;
              return (
                <li key={code ?? 'all'}>
                  <button
                    type="button"
                    onClick={() => selectNetwork(code)}
                    aria-pressed={active}
                    className={`group relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors lg:w-full lg:justify-between lg:rounded-none lg:px-0 lg:py-2.5 ${
                      active
                        ? 'bg-slate-900 text-white lg:bg-transparent lg:text-accent-600 dark:bg-white dark:text-slate-900 lg:dark:bg-transparent lg:dark:text-accent-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 lg:bg-transparent lg:hover:bg-transparent lg:hover:text-slate-900 dark:bg-white/[0.06] dark:text-slate-300 lg:dark:bg-transparent dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{code ? networkName(code) : 'Todos'}</span>
                    <span className="tabular-nums opacity-60">{count}</span>
                    {/* Barra proporcional (solo escritorio): escala con transform */}
                    {code && (
                      <span className="absolute inset-x-0 bottom-0 hidden h-px bg-slate-200 lg:block dark:bg-white/[0.07]">
                        <span
                          className={`block h-full origin-left transition-transform duration-500 ${
                            active ? 'bg-accent-500' : 'bg-slate-400 dark:bg-slate-500'
                          }`}
                          style={{ transform: `scaleX(${count / maxCount})` }}
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ---------- Lista ---------- */}
        <section className="min-w-0">
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative flex min-w-0 flex-1 items-center sm:max-w-sm">
              <Search size={16} className="pointer-events-none absolute left-3.5 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar estación, línea…"
                aria-label="Buscar en los avisos"
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-9 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-accent-500 dark:border-white/10 dark:bg-slate-900/60 dark:text-white [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Borrar búsqueda"
                  className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06]"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </label>

            <div role="radiogroup" aria-label="Tipo" className="flex rounded-full bg-slate-100 p-1 dark:bg-white/[0.06]">
              {KINDS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={kind === value}
                  onClick={() => setKind(value)}
                  className={`flex-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors ${
                    kind === value
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="py-3 text-[12px] font-semibold text-slate-400 dark:text-slate-500">
            {alerts === null
              ? 'Cargando avisos…'
              : error && !views.length
                ? 'No se pudieron cargar los avisos. Se reintentará automáticamente.'
                : `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}${
                    updatedAt ? ` · actualizado a las ${updatedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''
                  }`}
          </p>

          <ul className="border-b border-slate-200/80 dark:border-white/[0.07]">
            {alerts === null
              ? Array.from({ length: 5 }).map((_, i) => <AlertItemSkeleton key={i} />)
              : filtered.map((v) => <AlertItem key={v.alert.id} view={v} now={now} />)}
          </ul>

          {alerts !== null && filtered.length === 0 && !error && (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              {views.length ? 'Ningún aviso coincide con estos filtros.' : 'No hay avisos activos ahora mismo. Todo circula con normalidad.'}
            </p>
          )}
        </section>
      </div>
    </motion.div>
  );
};

export default AlertsPage;
