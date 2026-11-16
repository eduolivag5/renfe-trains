import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, TriangleAlert } from 'lucide-react';
import { useAllAlerts } from '../../hooks/useAllAlerts';
import { cleanAlertText } from '../../api/alertsService';
import { AlertKind, LineChips } from '../alerts/AlertItem';
import { GENERAL_KEY, networkName, relativeTime, sortAlertViews, toAlertView } from '../alerts/alertFormat';

const LATEST = 4;
const TOP_NETWORKS = 5;

/**
 * "Avisos en la red": nº de alertas activas, núcleos más afectados y las últimas publicadas.
 * Solo pide las alertas cuando la sección se acerca a la pantalla.
 */
const HomeAlerts = () => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const { alerts, error, updatedAt } = useAllAlerts(visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const now = updatedAt?.getTime() ?? 0;
  const { latest, networks, total } = useMemo(() => {
    const views = sortAlertViews((alerts ?? []).map((a) => toAlertView(a, now)));
    const counts = new Map<string, number>();
    for (const v of views) for (const n of v.networks) if (n !== GENERAL_KEY) counts.set(n, (counts.get(n) ?? 0) + 1);
    return {
      // Las últimas ya en vigor (las programadas a futuro se ven en la página de alertas)
      latest: views.filter((v) => !v.upcoming).slice(0, LATEST),
      networks: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_NETWORKS),
      total: views.length,
    };
  }, [alerts, now]);
  const maxCount = Math.max(1, ...networks.map(([, c]) => c));
  const loading = alerts === null;

  return (
    <section ref={ref} className="space-y-12">
      {/* Cabecera */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
            <TriangleAlert size={14} /> Alertas
          </div>
          <h2 className="text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-5xl lg:leading-[1.1] dark:text-white">
            Avisos en la red
          </h2>
          <p className="text-base leading-relaxed text-slate-500 md:text-xl dark:text-slate-400">
            Incidencias y cambios de servicio publicados para Cercanías y Rodalies.
          </p>
        </div>
        <Link
          to="/alertas"
          className="group flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-900 py-2 pl-4 pr-2 text-[13px] font-bold text-white transition-transform active:scale-95 md:self-auto dark:bg-white dark:text-slate-900"
        >
          Ver todos los avisos
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:rotate-45 dark:bg-slate-900/10">
            <ArrowUpRight size={13} strokeWidth={2.5} />
          </span>
        </Link>
      </div>

      <div className="grid min-w-0 gap-14 lg:grid-cols-[1fr_2fr] lg:gap-20">
        {/* ---------- Total y núcleos más afectados ---------- */}
        <div className="min-w-0 space-y-8">
          <div>
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">Alertas activas</p>
            <p className="bg-gradient-to-br from-amber-400 to-amber-600 bg-clip-text text-[clamp(3.5rem,8vw,6rem)] font-black leading-none tabular-nums tracking-tighter text-transparent">
              {loading ? '—' : total}
            </p>
          </div>
          <ul className="space-y-1">
            {(loading ? Array.from({ length: TOP_NETWORKS }, (_, i) => [`s${i}`, 0] as [string, number]) : networks).map(([code, count]) => (
              <li key={code}>
                {loading ? (
                  <span className="block h-10 animate-pulse border-b border-slate-200/80 dark:border-white/[0.07]" />
                ) : (
                  <Link
                    to={`/alertas?nucleo=${code}`}
                    className="group relative flex items-center justify-between gap-3 py-2.5 text-[14px] font-bold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    <span className="truncate">{networkName(code)}</span>
                    <span className="flex items-center gap-2 tabular-nums text-slate-400 dark:text-slate-500">
                      {count}
                      <ArrowRight size={14} strokeWidth={2.5} className="-translate-x-1 opacity-0 transition-[opacity,transform] group-hover:translate-x-0 group-hover:opacity-100" />
                    </span>
                    <span className="absolute inset-x-0 bottom-0 h-px bg-slate-200 dark:bg-white/[0.07]">
                      <span className="block h-full origin-left bg-amber-500" style={{ transform: `scaleX(${count / maxCount})` }} />
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Últimas alertas ---------- */}
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Últimas publicadas</p>
          {error && !total ? (
            <p className="border-t border-slate-200/80 py-8 text-sm text-slate-500 dark:border-white/[0.07] dark:text-slate-400">
              No se pudieron cargar los avisos ahora mismo.
            </p>
          ) : !loading && !latest.length ? (
            <p className="border-t border-slate-200/80 py-8 text-sm text-slate-500 dark:border-white/[0.07] dark:text-slate-400">
              No hay avisos activos. Todo circula con normalidad.
            </p>
          ) : (
            <ul>
              {loading
                ? Array.from({ length: LATEST }).map((_, i) => (
                    <li key={i} className="space-y-2.5 border-t border-slate-200/80 py-5 dark:border-white/[0.07]">
                      <span className="block h-3 w-40 animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
                      <span className="block h-3 w-full animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
                    </li>
                  ))
                : latest.map((v) => (
                    <li key={v.alert.id} className="border-t border-slate-200/80 dark:border-white/[0.07]">
                      <Link
                        to={v.networks[0] === GENERAL_KEY ? '/alertas' : `/alertas?nucleo=${v.networks[0]}`}
                        className="group block min-w-0 space-y-2 py-5"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <AlertKind warning={v.isWarning} />
                          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                            {v.networks.map(networkName).join(' · ')}
                          </span>
                          <LineChips lines={v.lines} max={5} />
                          {v.start && (
                            <span className="ml-auto text-[12px] font-semibold text-slate-400 dark:text-slate-500">{relativeTime(v.start, now)}</span>
                          )}
                        </div>
                        <p className="line-clamp-2 text-[14px] leading-relaxed text-slate-600 transition-colors [overflow-wrap:anywhere] group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-white">
                          {cleanAlertText(v.alert.descripcion)}
                        </p>
                      </Link>
                    </li>
                  ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeAlerts;
