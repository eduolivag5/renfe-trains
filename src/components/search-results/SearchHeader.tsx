import { ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateMinSelector } from '../../ui/DateMinSelector';
import { prettyName } from '../../utils/stationUtils';

interface StationInfo {
  nombre: string;
  provincia: string;
}

interface SearchHeaderProps {
  originDetail?: StationInfo;
  destinationDetail?: StationInfo;
  date: string;
  loading: boolean;
  editing: boolean;
  onDateChange: (newDate: string) => void;
  onEditSearch: () => void;
}

const Name = ({ station }: { station?: StationInfo }) =>
  station ? (
    <span>{prettyName(station.nombre)}</span>
  ) : (
    <span className="inline-block h-6 w-48 animate-pulse rounded-lg bg-slate-200/70 align-middle md:h-8 dark:bg-white/[0.06]" />
  );

/** Cabecera abierta (sin tarjeta): fecha, trayecto, botón de modificar y tira de días */
export const SearchHeader = ({
  originDetail,
  destinationDetail,
  date,
  loading,
  editing,
  onDateChange,
  onEditSearch,
}: SearchHeaderProps) => (
  <header className="space-y-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <p className="text-[13px] font-bold text-accent-600 first-letter:uppercase dark:text-accent-400">
          {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: es })}
        </p>
        <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xl font-black leading-tight tracking-tight text-slate-900 md:text-3xl dark:text-white">
          <Name station={originDetail} />
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 md:h-7 md:w-7 dark:text-slate-600" strokeWidth={2.5} />
          <Name station={destinationDetail} />
        </h1>
        {originDetail && destinationDetail && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {prettyName(originDetail.provincia)} · {prettyName(destinationDetail.provincia)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onEditSearch}
        aria-expanded={editing}
        className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-3 text-[13px] font-bold transition-colors active:scale-95 md:px-4 ${
          editing
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            : 'border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.06]'
        }`}
      >
        {editing ? <X size={15} strokeWidth={2.5} /> : <SlidersHorizontal size={15} strokeWidth={2.5} />}
        <span className="hidden sm:inline">{editing ? 'Cerrar' : 'Modificar'}</span>
      </button>
    </div>

    <div className="border-y border-slate-200/80 py-2 dark:border-white/[0.07]">
      <DateMinSelector date={date} loading={loading} onDateChange={onDateChange} />
    </div>
  </header>
);
