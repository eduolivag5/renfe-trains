import { type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import { FALLBACK_LOGO, formatClock, formatDuration, getMapTrainInfo, getTrainIdentity, getTrainLogo, timeToMinutes, trainTypeHint } from '../../utils/trainUtils';
import { type TrainSearchResult } from '../../api/trainsService';
import { prefetchDetail } from '../../api/detailCache';

export type TrainStatus = 'departed' | 'next' | null;

export interface ProcessedTrain extends TrainSearchResult {
  durationMin: number;
  isFastest: boolean;
}

interface TrainCardProps {
  train: ProcessedTrain;
  index: number;
  status: TrainStatus;
  /** El detalle se abre en un panel aparte (hoja inferior en móvil, lateral en escritorio) */
  onOpen: (train: ProcessedTrain) => void;
  /** Tarjeta cuyo detalle está abierto ahora mismo */
  active?: boolean;
}

/**
 * Tarjeta de tren. Al pulsarla abre el detalle del trayecto en un panel aparte.
 * Precarga las paradas al pasar el ratón o al empezar a tocar, así el panel llega con datos.
 */
export const TrainCard = ({ train, index, status, onOpen, active = false }: TrainCardProps) => {
  const logo = getTrainLogo(getTrainIdentity(train.trainType.trim().toUpperCase()).logo);
  const family = getMapTrainInfo(train.trainType).family;
  const color = family?.color ?? '#7c3aed';
  const nextDay = timeToMinutes(train.arrivalTime) < timeToMinutes(train.departureTime);
  const departed = status === 'departed';
  const prefetch = () => prefetchDetail(train.tripId);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03 }}
      style={{ '--c': color } as CSSProperties}
      className={`w-full min-w-0 max-w-full overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300 [contain:layout_paint] dark:bg-slate-900/60 ${
        active
          ? 'border-accent-500 shadow-[0_0_0_3px_rgb(139_92_246/0.15)] dark:border-accent-400'
          : 'border-slate-200/80 hover:border-slate-300 dark:border-white/[0.07] dark:hover:border-white/15'
      } ${departed ? 'opacity-55' : ''}`}
    >
      <button
        type="button"
        onClick={() => onOpen(train)}
        onPointerEnter={prefetch}
        onPointerDown={prefetch}
        onFocus={prefetch}
        aria-haspopup="dialog"
        aria-label={`Ver recorrido del ${train.trainType} de las ${formatClock(train.departureTime)}`}
        className="group block w-full px-4 pb-4 pt-3 text-left md:px-5"
      >
        {/* Fila de etiquetas: familia (izquierda) · más rápido (derecha) */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {family && (
              <span className="flex items-center gap-1.5 truncate rounded-full bg-[var(--c)]/10 px-2.5 py-1 text-[11px] font-bold text-[var(--c)] dark:bg-white/[0.06] dark:text-slate-200">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--c)] dark:bg-slate-300" />
                {family.name}
              </span>
            )}
            {status === 'next' && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Próximo
              </span>
            )}
            {departed && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">
                Ha salido
              </span>
            )}
          </div>
          {train.isFastest && !departed && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <Zap size={11} strokeWidth={2.75} fill="currentColor" /> Más rápido
            </span>
          )}
        </div>

        {/* Servicio · horario · abrir detalle */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[8.5rem_minmax(0,1fr)_auto] md:gap-x-6">
          <div className="flex min-w-0 items-center gap-2.5 md:flex-col md:items-start md:gap-1">
            <img
              src={logo.src}
              alt={train.trainType}
              className={`h-[18px] w-auto max-w-[110px] object-contain object-left ${logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_LOGO;
                e.currentTarget.onerror = null;
              }}
            />
            {trainTypeHint(train.trainType) && (
              <span className="truncate text-[11px] font-semibold text-slate-400 dark:text-slate-500">{trainTypeHint(train.trainType)}</span>
            )}
          </div>

          <span
            className={`col-start-2 row-start-1 flex h-8 w-8 items-center justify-center justify-self-end rounded-full transition-[background-color,color,transform] duration-200 group-hover:translate-x-0.5 md:col-start-3 ${
              active
                ? 'bg-accent-600 text-white dark:bg-accent-500'
                : 'bg-slate-100 text-slate-500 group-hover:bg-accent-600 group-hover:text-white dark:bg-white/[0.06] dark:text-slate-400 dark:group-hover:bg-accent-500'
            }`}
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </span>

          <div className="col-span-2 flex items-center gap-3 md:col-span-1 md:col-start-2 md:row-start-1 md:gap-5">
            <time className="text-[26px] font-black leading-none tracking-tight tabular-nums text-slate-900 md:text-[28px] dark:text-white">
              {formatClock(train.departureTime)}
            </time>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="whitespace-nowrap text-[12px] font-bold tabular-nums text-slate-500 dark:text-slate-400">
                {formatDuration(train.durationMin)}
              </span>
              <div className="flex w-full items-center">
                <span className="h-2 w-2 shrink-0 rounded-full border-2 border-[var(--c)] dark:border-slate-400" />
                <span className="h-0.5 flex-1 bg-[var(--c)] opacity-50 dark:bg-slate-500" />
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--c)] dark:bg-slate-300" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Directo</span>
            </div>
            <time className="relative text-[26px] font-black leading-none tracking-tight tabular-nums text-slate-900 md:text-[28px] dark:text-white">
              {formatClock(train.arrivalTime)}
              {nextDay && <sup className="absolute -right-4 -top-1 text-[11px] font-bold text-accent-600 dark:text-accent-400">+1</sup>}
            </time>
          </div>
        </div>
      </button>
    </motion.article>
  );
};
