import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowUpRight, TrainFront } from 'lucide-react';
import { POPULAR_ROUTES } from '../../utils/stationUtils';

/** Quita el prefijo de ciudad del nombre de estación: "Madrid-Puerta de Atocha" → "Puerta de Atocha" */
const shortStation = (name: string, city: string) => {
  const stripped = name.replace(new RegExp(`^${city}[\\s-]*`, 'i'), '').trim();
  return stripped || name;
};

/**
 * Rutas frecuentes como mini línea de horario: "Madrid ●- - -● Barcelona".
 * La línea central es flexible (encoge en móvil) y todos los elementos tienen min-w-0,
 * así nunca se genera scroll horizontal. Un toque lanza la búsqueda de trenes para hoy.
 */
const PopularRoutes = () => {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="grid min-w-0 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
      {POPULAR_ROUTES.map(({ from, to, city }) => (
        <button
          key={`${from.codigo}-${to.codigo}`}
          type="button"
          onClick={() => navigate(`/buscar?${new URLSearchParams({ origin: from.codigo, destination: to.codigo, date: today })}`)}
          aria-label={`Trenes de hoy de ${city[0]} a ${city[1]}`}
          className="group relative flex w-full min-w-0 items-center gap-4 border-t border-slate-200 py-4 text-left dark:border-white/10"
        >
          {/* Línea superior que se rellena al pasar el ratón */}
          <span
            aria-hidden
            className="absolute -top-px left-0 h-0.5 w-full origin-left scale-x-0 bg-accent-600 transition-transform duration-500 ease-out group-hover:scale-x-100 dark:bg-accent-400"
          />

          {/* Ciudad ●- - 🚆 - -● Ciudad. Rejilla de 3 columnas: la línea tiene SIEMPRE el mismo ancho
              y queda centrada; cada ciudad ocupa su mitad, pegada a la línea (origen alineado a la
              derecha, destino a la izquierda), y la estación va debajo con la misma alineación. */}
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] items-center gap-x-2 gap-y-1">
            <span className="truncate text-right text-base font-black tracking-tight text-slate-900 dark:text-white" title={city[0]}>
              {city[0]}
            </span>
            <span aria-hidden className="relative flex items-center">
              <span className="h-2 w-2 shrink-0 rounded-full border-2 border-accent-500" />
              <span className="relative h-0 flex-1 border-t-2 border-dashed border-slate-200 dark:border-white/15">
                {/* Relleno de la línea al pasar el ratón */}
                <span className="absolute -top-0.5 left-0 h-0.5 w-full origin-left scale-x-0 bg-accent-500 transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />
              {/* Tren que recorre la línea: solo transform (GPU) */}
              <span className="pointer-events-none absolute inset-y-0 left-1 right-1 flex items-center transition-transform duration-500 ease-out group-hover:translate-x-[calc(100%-0.9rem)]">
                <TrainFront
                  size={13}
                  strokeWidth={2.5}
                  className="shrink-0 text-accent-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-accent-400"
                />
              </span>
            </span>
            <span className="truncate text-base font-black tracking-tight text-slate-900 dark:text-white" title={city[1]}>
              {city[1]}
            </span>

            {/* Estaciones bajo cada ciudad */}
            <span className="truncate text-right text-[12px] text-slate-500 dark:text-slate-400">{shortStation(from.nombre, city[0])}</span>
            <span aria-hidden />
            <span className="truncate text-[12px] text-slate-500 dark:text-slate-400">{shortStation(to.nombre, city[1])}</span>
          </div>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition duration-300 group-hover:rotate-45 group-hover:border-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:border-white/10 dark:text-slate-500 dark:group-hover:border-accent-500 dark:group-hover:bg-accent-500">
            <ArrowUpRight size={17} strokeWidth={2.5} />
          </span>
        </button>
      ))}
    </div>
  );
};

export default PopularRoutes;
