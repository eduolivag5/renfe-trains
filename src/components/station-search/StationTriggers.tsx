import { motion } from 'framer-motion';
import { MapPin, Navigation2, Calendar as CalendarIcon } from 'lucide-react';

export const StationTrigger = ({ icon, label, value, placeholder, onClick }: {
  icon: 'origin' | 'destination'; label: string; value?: string; placeholder: string; onClick: () => void;
}) => (
  <button onClick={onClick}
    className="flex-1 flex items-center gap-2.5 py-3 px-2 rounded-xl text-left transition-colors active:bg-slate-50 dark:active:bg-white/5">
    <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${icon === 'origin' ? 'bg-blue-50 dark:bg-blue-500/15' : 'bg-orange-50 dark:bg-orange-500/15'}`}>
      {icon === 'origin'
        ? <MapPin size={13} className="text-blue-500" />
        : <Navigation2 size={13} className="text-orange-400" />}
    </span>
    <span>
      <span className="block text-[9.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">{label}</span>
      <span className={`block text-[15px] font-semibold leading-tight mt-0.5 ${value ? 'text-slate-800 dark:text-white' : 'text-slate-300 dark:text-slate-600'}`}>
        {value || placeholder}
      </span>
    </span>
  </button>
);

export const DateTrigger = ({ label, date, active, disabled, onClick }: {
  label: string; date: string; active: boolean; disabled?: boolean; onClick: () => void;
}) => (
  <motion.button animate={{ opacity: disabled ? 0.35 : 1 }} disabled={disabled} onClick={onClick}
    className="flex-1 flex items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-50">
    <CalendarIcon size={14} className={`shrink-0 ${active ? 'text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
    <span>
      <span className="block text-[9.5px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">{label}</span>
      <span className={`block text-sm font-semibold mt-0.5 ${active ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>{date}</span>
    </span>
  </motion.button>
);