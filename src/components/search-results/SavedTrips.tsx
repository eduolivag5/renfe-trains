import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, History, Star } from 'lucide-react';
import { useSavedTrips } from '../../hooks/useSavedTrips';
import { clearRecentTrips, type SavedTrip } from '../../utils/savedTrips';
import { prettyName } from '../../utils/stationUtils';

const TITLE = 'flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500';

const TripChip = ({ trip, favorite }: { trip: SavedTrip; favorite?: boolean }) => {
  const navigate = useNavigate();
  const from = prettyName(trip.originName);
  const to = prettyName(trip.destinationName);
  const go = () =>
    navigate(
      `/buscar?${new URLSearchParams({ origin: trip.origin, destination: trip.destination, date: format(new Date(), 'yyyy-MM-dd') })}`,
    );

  return (
    <li className="min-w-0 max-w-full">
      <button
        type="button"
        onClick={go}
        aria-label={`Trenes de hoy de ${from} a ${to}`}
        className={`flex max-w-full items-center gap-2 rounded-full border py-2 pl-3 pr-4 text-[13px] font-bold transition-colors active:scale-[0.98] ${
          favorite
            ? 'border-amber-300/60 bg-amber-50 text-slate-800 hover:border-amber-400 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-slate-100 dark:hover:border-amber-400/40'
            : 'border-slate-200 bg-white text-slate-700 hover:border-accent-500 hover:text-accent-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-accent-400 dark:hover:text-accent-300'
        }`}
      >
        {favorite ? (
          <Star size={14} strokeWidth={2.5} className="shrink-0 fill-amber-400 text-amber-500" />
        ) : (
          <History size={14} strokeWidth={2.5} className="shrink-0 text-slate-400 dark:text-slate-500" />
        )}
        <span className="min-w-0 truncate">{from}</span>
        <ArrowRight size={13} strokeWidth={2.5} className="shrink-0 text-slate-400 dark:text-slate-500" />
        <span className="min-w-0 truncate">{to}</span>
      </button>
    </li>
  );
};

/**
 * "Tus trayectos": favoritos (estrella) y últimas búsquedas, como accesos directos a los trenes
 * de hoy. Los recientes que ya son favoritos no se repiten. Si no hay nada guardado, no se pinta.
 */
const SavedTrips = () => {
  const { recent, favorites } = useSavedTrips();
  const recentOnly = recent.filter((r) => !favorites.some((f) => f.origin === r.origin && f.destination === r.destination));

  if (favorites.length === 0 && recentOnly.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className={TITLE}>
          <Star size={13} /> Tus trayectos
        </h2>
        {recentOnly.length > 0 && (
          <button
            type="button"
            onClick={clearRecentTrips}
            className="px-1 text-[12px] font-bold text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
          >
            Borrar recientes
          </button>
        )}
      </div>
      <ul className="flex min-w-0 flex-wrap gap-2">
        {favorites.map((t) => (
          <TripChip key={`f-${t.origin}-${t.destination}`} trip={t} favorite />
        ))}
        {recentOnly.map((t) => (
          <TripChip key={`r-${t.origin}-${t.destination}`} trip={t} />
        ))}
      </ul>
    </section>
  );
};

export default SavedTrips;
