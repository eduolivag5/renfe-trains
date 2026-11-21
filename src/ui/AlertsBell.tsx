import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { useBreakpoint } from '../hooks/use-breakpoint';
import { useTodayWarnings } from '../hooks/useTodayWarnings';
import { networkName } from '../components/alerts/alertFormat';

/**
 * Acceso a /avisos en móvil (la barra inferior se queda en 5 pestañas): botón flotante arriba a
 * la derecha con el nº de incidencias de hoy (ver useTodayWarnings; el rail de escritorio muestra
 * el mismo número). Va tal cual, sin tope: la píldora se ensancha. Con núcleo elegido en Ajustes,
 * abre /avisos filtrado por él.
 */
const AlertsBell = () => {
  const isDesktop = useBreakpoint('md');
  const { count, nucleo } = useTodayWarnings(!isDesktop);

  if (isDesktop) return null;

  const where = nucleo ? ` en ${networkName(nucleo)}` : '';

  return (
    <Link
      to={nucleo ? `/avisos?nucleo=${nucleo}` : '/avisos'}
      aria-label={count ? `Avisos${where}: ${count} hoy` : `Avisos${where}`}
      className="fixed right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/90 text-slate-600 shadow-[0_8px_24px_-12px_rgba(2,33,71,0.35)] backdrop-blur-md transition-transform duration-150 [-webkit-tap-highlight-color:transparent] active:scale-90 md:hidden dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300 dark:shadow-none"
    >
      {/* Mismo icono que Avisos en el rail de escritorio: avisos del servicio, no notificaciones */}
      <TriangleAlert size={20} strokeWidth={2.25} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black tabular-nums leading-none text-white ring-2 ring-[var(--page-bg)] dark:bg-amber-400 dark:text-amber-950">
          {count}
        </span>
      )}
    </Link>
  );
};

export default AlertsBell;
