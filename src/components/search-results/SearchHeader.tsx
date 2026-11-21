import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Star, X } from 'lucide-react';
import { DateMinSelector } from '../../ui/DateMinSelector';
import { stationCity, stationShortName, type StationPlace } from '../../utils/stationUtils';
import { toggleFavoriteTrip, type SavedTrip } from '../../utils/savedTrips';
import { useSavedTrips } from '../../hooks/useSavedTrips';

type StationInfo = StationPlace;

interface SearchHeaderProps {
  originDetail?: StationInfo;
  destinationDetail?: StationInfo;
  /** Trayecto con códigos y nombres; hasta que cargan los nombres no hay favorito */
  trip?: SavedTrip;
  date: string;
  loading: boolean;
  editing: boolean;
  onDateChange: (newDate: string) => void;
  onEditSearch: () => void;
}

/* Una parada del billete: ciudad en grande y la estación en pequeño (debajo en móvil, al lado en PC) (con su nombre
   completo al mantener pulsado o pasar el ratón); esqueleto mientras cargan los nombres.
   La ciudad manda: la estación es la que se corta con "…" si no cabe. */
const Stop = ({ station }: { station?: StationInfo }) =>
  station ? (
    <span className="flex min-w-0 flex-col md:flex-row md:items-baseline md:gap-3" title={`${stationCity(station)} · ${stationShortName(station)}`}>
      <span className="truncate text-[17px] font-black leading-[22px] tracking-tight text-slate-900 md:max-w-[75%] md:shrink-0 md:text-2xl md:leading-8 dark:text-white">
        {stationCity(station)}
      </span>
      <span className="min-w-0 truncate text-[12px] font-medium leading-4 text-slate-500 md:text-sm md:leading-5 dark:text-slate-400">{stationShortName(station)}</span>
    </span>
  ) : (
    <span className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-2" aria-hidden>
      <span className="h-4 w-24 animate-pulse rounded-md bg-slate-200/70 md:h-6 md:w-36 dark:bg-white/[0.06]" />
      <span className="h-3 w-16 animate-pulse rounded bg-slate-200/70 dark:bg-white/[0.06]" />
    </span>
  );

const ROUND =
  'flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-40';

/** Estrella: guarda el trayecto en "Tus trayectos" (inicio y buscador) */
const FavoriteButton = ({ trip }: { trip?: SavedTrip }) => {
  const { favorites } = useSavedTrips();
  const saved = !!trip && favorites.some((f) => f.origin === trip.origin && f.destination === trip.destination);

  return (
    <button
      type="button"
      disabled={!trip}
      onClick={() => trip && toggleFavoriteTrip(trip)}
      aria-pressed={saved}
      aria-label={saved ? 'Quitar de favoritos' : 'Guardar trayecto en favoritos'}
      title={saved ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      className={`${ROUND} ${
        saved
          ? 'border-amber-300/70 bg-amber-50 text-amber-500 dark:border-amber-400/30 dark:bg-amber-400/10'
          : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]'
      }`}
    >
      <Star size={15} strokeWidth={2.5} className={saved ? 'fill-amber-400' : ''} />
    </button>
  );
};

/**
 * Cristal "liquid glass" de la cabecera ya pegada arriba: fondo de la página translúcido, con
 * desenfoque y algo más de saturación de lo que pasa por debajo, un brillo fino en el borde
 * superior y un filete claro abajo. Pensado para gastar poca GPU:
 * - Solo se activa al pegarse: arriba del todo no hay nada debajo que desenfocar, así que va
 *   opaco y sin backdrop-filter (cero coste mientras no se hace scroll).
 * - Desenfoque moderado (16 px): el coste crece con el radio, y más no se nota a través del 78 %.
 * - El cambio es instantáneo: animar backdrop-filter obliga a recalcularlo en cada frame.
 * - Sin soporte de backdrop-filter, fondo opaco (sin transparencia ilegible).
 */
const GLASS = [
  'bg-[var(--page-bg)]',
  'supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--page-bg)_78%,transparent)]',
  'supports-[backdrop-filter]:backdrop-blur-lg supports-[backdrop-filter]:backdrop-saturate-150',
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_0_rgba(15,23,42,0.06),0_14px_24px_-22px_rgba(2,33,71,0.5)]',
  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_0_rgba(255,255,255,0.08)]',
].join(' ');

/**
 * true cuando la cabecera fija ya está pegada arriba: el scroll de <main> ha pasado el marcador
 * de 1 px que va justo encima. La posición del marcador se mide una vez (y al cambiar el tamaño
 * de la ventana); en cada scroll solo se compara un número, sin leer el layout, y el estado solo
 * cambia al cruzar el umbral (un render por cruce, no por frame).
 */
const useStuck = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const main = el?.closest('main');
    if (!el || !main) return;
    let threshold = 0;
    const measure = () => {
      threshold = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop;
    };
    const update = () => setStuck(main.scrollTop > threshold);
    const onResize = () => {
      measure();
      update();
    };
    onResize();
    main.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      main.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return [ref, stuck] as const;
};

/**
 * Cabecera de resultados: billete vertical (origen / destino con su estación), acciones y tira
 * de días. Se queda fija arriba al hacer scroll (sticky dentro de <main>) con el fondo de la
 * página a todo el ancho. Mide siempre lo mismo, fija o no: solo aparece una sombra al pegarse,
 * así la lista de debajo nunca da saltos. Tiene que ser hija directa de la página (su contenedor
 * es el que limita hasta dónde acompaña el scroll).
 */
export const SearchHeader = ({
  originDetail,
  destinationDetail,
  trip,
  date,
  loading,
  editing,
  onDateChange,
  onEditSearch,
}: SearchHeaderProps) => {
  const [sentinel, stuck] = useStuck();

  return (
    <>
      {/* Móvil: el margen de arriba va FUERA de la cabecera fija (parte del de la página) y el de
          abajo es el margen de lo que sigue: arriba del todo se ve holgada y, al hacer scroll, esos
          márgenes se van con la página y la cabecera queda compacta pegada arriba. Sin cambiar su
          tamaño ni una línea de JavaScript: la lista nunca da saltos. La cabecera solo reserva el
          hueco de la barra de estado. */}
      <div ref={sentinel} aria-hidden className="h-px max-md:-mt-7" />
      <header
        className={`sticky top-0 z-30 -mx-[var(--page-gutter)] -mt-px space-y-2 px-[var(--page-gutter)] pt-[calc(env(safe-area-inset-top)+0.625rem)] md:space-y-3 md:pt-3 ${
          stuck ? GLASS : 'bg-[var(--page-bg)]'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Billete vertical: origen arriba y destino debajo, unidos por una línea con puntos
              (hueco = origen, relleno = destino, como en Rutas populares). Cada fila usa todo el
              ancho; en móvil mide lo mismo que cada botón de la derecha, así quedan alineados */}
          {/* Móvil: cada fila mide 38 px (ciudad 22 + estación 16) y el punto va a la altura de la
              ciudad (centro a 11 px), de ahí top-[11px] y bottom-[27px] de la línea */}
          <h1 className="relative grid min-w-0 flex-1 grid-cols-[0.625rem_minmax(0,1fr)] gap-x-3 gap-y-1.5">
            <span aria-hidden className="absolute bottom-[27px] left-[calc(0.3125rem-1px)] top-[11px] border-l-2 border-dashed border-slate-300 md:top-5 md:bottom-5 dark:border-white/15" />
            <span aria-hidden className="relative flex h-[22px] items-center md:h-10">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-accent-500 bg-[var(--page-bg)]" />
            </span>
            <span className="flex min-w-0 items-center md:h-10">
              <Stop station={originDetail} />
            </span>
            <span className="sr-only"> a </span>
            <span aria-hidden className="relative flex h-[22px] items-center md:h-10">
              <span className="h-2.5 w-2.5 rounded-full bg-accent-500" />
            </span>
            <span className="flex min-w-0 items-center md:h-10">
              <Stop station={destinationDetail} />
            </span>
          </h1>

          {/* Móvil: uno encima de otro, a la altura de cada fila del billete. PC: en línea */}
          <div className="flex shrink-0 flex-col gap-3 md:flex-row md:items-center md:gap-2">
            <FavoriteButton trip={trip} />
            <button
              type="button"
              onClick={onEditSearch}
              aria-expanded={editing}
              aria-label={editing ? 'Cerrar' : 'Modificar búsqueda'}
              className={`flex h-8 shrink-0 items-center justify-center gap-2 rounded-full text-[13px] font-bold transition-colors active:scale-95 max-md:w-8 md:h-10 md:px-4 ${
                editing
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.06]'
              }`}
            >
              {editing ? <X size={15} strokeWidth={2.5} /> : <SlidersHorizontal size={15} strokeWidth={2.5} />}
              <span className="hidden md:inline">{editing ? 'Cerrar' : 'Modificar'}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-200/80 py-1.5 dark:border-white/[0.07] md:py-2">
          <DateMinSelector date={date} loading={loading} onDateChange={onDateChange} />
        </div>
      </header>
    </>
  );
};
