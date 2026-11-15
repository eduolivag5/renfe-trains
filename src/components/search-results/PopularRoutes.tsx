import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { POPULAR_ROUTES } from '../../utils/stationUtils';

/**
 * Rutas frecuentes como filas abiertas separadas por líneas (sin tarjetas).
 * Un toque lanza la búsqueda de trenes para hoy.
 */
const PopularRoutes = () => {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
      {POPULAR_ROUTES.map(({ from, to, city }) => (
        <button
          key={`${from.codigo}-${to.codigo}`}
          type="button"
          onClick={() => navigate(`/buscar?${new URLSearchParams({ origin: from.codigo, destination: to.codigo, date: today })}`)}
          className="group relative flex items-center gap-4 border-t border-slate-200 py-5 text-left dark:border-white/10"
        >
          {/* Línea que se rellena al pasar el ratón */}
          <span
            aria-hidden
            className="absolute -top-px left-0 h-0.5 w-0 bg-accent-600 transition-all duration-500 ease-out group-hover:w-full dark:bg-accent-400"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-400">
              {city[0]}
              <ArrowRight size={18} strokeWidth={2.5} className="shrink-0 text-slate-300 dark:text-slate-600" />
              {city[1]}
            </p>
            <p className="mt-1 truncate text-[13px] text-slate-500 dark:text-slate-400">
              {from.nombre} · {to.nombre}
            </p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 group-hover:rotate-45 group-hover:border-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:border-white/10 dark:text-slate-500 dark:group-hover:border-accent-500 dark:group-hover:bg-accent-500">
            <ArrowUpRight size={17} strokeWidth={2.5} />
          </span>
        </button>
      ))}
    </div>
  );
};

export default PopularRoutes;
