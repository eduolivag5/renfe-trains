import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPinned, TriangleAlert } from 'lucide-react';
import { KindBadge, ScheduledBadge } from '../alerts/AlertItem';
import { NETWORK_LIST } from '../alerts/alertFormat';
import { Eyebrow } from '../../ui/heading';
import { HEADING, LEAD } from '../../ui/headingStyles';
import { usePref } from '../../hooks/usePref';

/** Tipos de aviso que hay en /avisos, con la misma insignia que se usa allí */
const KINDS: { badge: ReactNode; title: string; text: string; warning?: boolean }[] = [
  {
    badge: <KindBadge warning />,
    title: 'Incidencias en curso',
    text: 'Retrasos, trenes suprimidos o cortes de vía que afectan al servicio ahora mismo.',
    warning: true,
  },
  {
    badge: <KindBadge warning={false} />,
    title: 'Cambios y obras',
    text: 'Ascensores fuera de servicio, cambios de andén, autobuses alternativos y obras.',
  },
  {
    badge: <ScheduledBadge />,
    title: 'Anunciados con antelación',
    text: 'Huelgas, cortes y servicios especiales que empiezan en los próximos días.',
  },
];

/**
 * "Avisos en la red": sección estática (sin llamar a la API ni animaciones) para que la home
 * cargue lo más rápido posible. Explica qué tipos de aviso hay y ofrece un índice de núcleos
 * que abre /avisos ya filtrado (el del usuario, si lo eligió en Ajustes, el primero); los avisos
 * reales solo se cargan en esa página.
 */
const HomeAlerts = () => {
  // "Mi núcleo" (Ajustes) va el primero del índice y marcado; el resto, en orden alfabético
  const nucleo = usePref('nucleo');
  const networks = nucleo
    ? [...NETWORK_LIST.filter(([c]) => c === nucleo), ...NETWORK_LIST.filter(([c]) => c !== nucleo)]
    : NETWORK_LIST;

  return (
  <section className="space-y-8 compact:space-y-6">
    {/* Cabecera */}
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        <Eyebrow icon={TriangleAlert}>Avisos</Eyebrow>
        <h2 className={HEADING.section}>Avisos en la red</h2>
        <p className={LEAD}>
          Incidencias y cambios de servicio publicados para Cercanías y Rodalies.
        </p>
      </div>
      <Link
        to="/avisos"
        className="group flex shrink-0 items-center gap-1.5 self-start rounded-full bg-slate-900 py-2 pl-4 pr-2 text-[13px] font-bold text-white md:self-auto dark:bg-white dark:text-slate-900"
      >
        Ver todos los avisos
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 dark:bg-slate-900/10">
          <ArrowUpRight size={13} strokeWidth={2.5} />
        </span>
      </Link>
    </div>

    <div className="grid min-w-0 gap-10 lg:grid-cols-[1fr_1.35fr] lg:gap-16">
      {/* ---------- Qué vas a encontrar ---------- */}
      <div className="min-w-0">
        <h3 className="mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Qué vas a encontrar</h3>
        <ul className="border-b border-slate-200/80 dark:border-white/[0.07]">
          {KINDS.map(({ badge, title, text, warning }) => (
            <li
              key={title}
              className={`relative space-y-1.5 border-t border-slate-200/80 py-4 pl-4 pr-2 md:pl-5 dark:border-white/[0.07] ${
                warning ? 'bg-amber-50/70 dark:bg-amber-400/[0.035]' : ''
              }`}
            >
              {/* Mismo filete ámbar que los avisos de /avisos */}
              {warning && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-amber-500 dark:bg-amber-400" />}
              <div className="flex">{badge}</div>
              <p className="text-base font-black tracking-tight text-slate-900 dark:text-white">{title}</p>
              <p className="max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- Índice de núcleos ---------- */}
      <div className="min-w-0">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            <MapPinned size={18} strokeWidth={2.5} className="text-amber-600 dark:text-amber-400" />
            Consulta por núcleo
          </h3>
          <span className="whitespace-nowrap text-[12px] font-semibold text-slate-400 dark:text-slate-500">
            {NETWORK_LIST.length} núcleos
          </span>
        </div>

        <ol className="grid border-b border-slate-200 sm:grid-cols-2 sm:gap-x-8 xl:grid-cols-3 dark:border-white/10">
          {networks.map(([code, name]) => (
            <li key={code} className="min-w-0 border-t border-slate-200 dark:border-white/10">
              <Link
                to={`/avisos?nucleo=${code}`}
                className="group flex items-center gap-3 py-2.5 text-[15px] font-bold text-slate-700 hover:text-amber-700 dark:text-slate-200 dark:hover:text-amber-400"
              >
                <span className="w-6 shrink-0 font-mono text-[12px] font-bold text-slate-300 group-hover:text-amber-500 dark:text-slate-600">
                  {code}
                </span>
                <span className="min-w-0 flex-1 truncate">{name}</span>
                {code === nucleo && (
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
                    Tu núcleo
                  </span>
                )}
                <ArrowUpRight
                  size={15}
                  strokeWidth={2.5}
                  className="shrink-0 text-slate-300 group-hover:text-amber-600 dark:text-slate-600 dark:group-hover:text-amber-400"
                />
              </Link>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
          Cada núcleo abre sus avisos ya filtrados, con sus líneas para afinar la búsqueda.
          {!nucleo && (
            <>
              {' '}
              <Link to="/ajustes" className="font-bold text-amber-700 hover:underline dark:text-amber-400">
                Elige tu núcleo en Ajustes
              </Link>{' '}
              para tenerlo siempre a mano.
            </>
          )}
        </p>
      </div>
    </div>
  </section>
  );
};

export default HomeAlerts;
