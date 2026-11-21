import { motion, AnimatePresence } from 'framer-motion';
import { prettyName, type Estacion } from '../../utils/stationUtils';

import { FIELD, LABEL, fieldState } from './fieldStyles';

interface StationFieldProps {
  kind: 'origin' | 'destination';
  station: Estacion | null;
  active: boolean;
  onClick: () => void;
}

/** Campo de estación: solo etiqueta y nombre */
export const StationField = ({ kind, station, active, onClick }: StationFieldProps) => (
  <button type="button" onClick={onClick} aria-expanded={active} className={`${FIELD} ${fieldState(active)}`}>
    <span className={LABEL}>{kind === 'origin' ? 'Origen' : 'Destino'}</span>
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={station?.codigo ?? 'empty'}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.14 }}
        className={`block w-full truncate text-[16px] font-bold leading-snug ${
          station ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-600'
        }`}
      >
        {station ? prettyName(station.nombre) : 'Elige estación'}
      </motion.span>
    </AnimatePresence>
  </button>
);

interface DateFieldProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

/** Campo de fecha: etiqueta y fecha en una línea */
export const DateField = ({ label, active, onClick }: DateFieldProps) => (
  <button type="button" onClick={onClick} aria-expanded={active} className={`${FIELD} ${fieldState(active)}`}>
    <span className={LABEL}>Fecha</span>
    <span className="block w-full truncate text-[16px] font-bold leading-snug text-slate-900 first-letter:uppercase dark:text-white">
      {label}
    </span>
  </button>
);
