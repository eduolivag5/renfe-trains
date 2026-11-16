import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TrainMap } from '../../api/trainsService';
import { Eye, EyeOff } from 'lucide-react';
import { COLORS, getTrainColor } from './MapConstants';
import { getPref, setPref } from '../../utils/preferences';

interface LiveCounterProps {
  trains: TrainMap[];
}

const CATEGORIES = [
  { label: 'Alta vel.', color: COLORS.altaVelocidad },
  { label: 'Media dist.', color: COLORS.mediaDistancia },
  { label: 'Cercanías', color: COLORS.cercanias },
  { label: 'Rodalies', color: COLORS.rodalies },
  { label: 'Otros', color: COLORS.otros },
] as const;

/** Hora actual con segundos; solo este componente se re-renderiza cada segundo */
const Clock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Alineado al cambio de segundo para que no "salte" de forma irregular
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 1000);
    }, 1000 - (Date.now() % 1000));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
  return (
    <time className="font-mono text-[13px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
      {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </time>
  );
};

/** Panel en directo: total de trenes, hora actual y reparto por tipo */
export const LiveCounter: React.FC<LiveCounterProps> = ({ trains }) => {
  const counts = useMemo(() => {
    const byColor = new Map<string, number>();
    for (const t of trains) {
      const c = getTrainColor(t.tipo);
      byColor.set(c, (byColor.get(c) ?? 0) + 1);
    }
    return CATEGORIES.map((c) => ({ ...c, count: byColor.get(c.color) ?? 0 })).filter(
      (c) => c.count > 0 || c.label !== 'Otros',
    );
  }, [trains]);

  const total = trains.length;
  const [hidden, setHidden] = useState(() => getPref('mapLegend') === 'hidden');
  const toggle = (hide: boolean) => {
    setHidden(hide);
    setPref('mapLegend', hide ? 'hidden' : 'visible');
  };

  /*
   * Un único contenedor que cambia de tamaño con animación de layout (panel ⇄ píldora)
   * mientras el contenido hace un fundido cruzado. El radio va en style para que framer-motion
   * lo corrija durante la animación y las esquinas no se deformen.
   */
  return (
    <motion.div
      layout
      transition={{ layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
      style={{ borderRadius: 24 }}
      className={`absolute left-4 top-4 z-40 select-none overflow-hidden border border-slate-200/80 bg-white/95 shadow-[0_16px_40px_-16px_rgba(2,33,71,0.35)] md:left-6 md:top-6 dark:border-white/10 dark:bg-slate-900/95 dark:shadow-none ${
        hidden ? '' : 'pointer-events-none w-[calc(100vw-6rem)] max-w-[290px]'
      }`}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {hidden ? (
          /* Oculta: píldora mínima con el total y el botón para volver a mostrarla */
          <motion.button
            key="pill"
            type="button"
            onClick={() => toggle(false)}
            aria-label="Mostrar leyenda"
            title="Mostrar leyenda"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.3, delay: 0.15 } }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
            className="flex h-11 items-center gap-2.5 whitespace-nowrap pl-3.5 pr-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[14px] font-black tabular-nums text-slate-900 dark:text-white">{total.toLocaleString('es-ES')}</span>
            <span className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">trenes</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
              <Eye size={15} strokeWidth={2.5} />
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.18 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="p-4"
          >
            {/* En directo + reloj + ocultar */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                En directo
              </span>
              <div className="flex items-center gap-1.5">
                <Clock />
                <button
                  type="button"
                  onClick={() => toggle(true)}
                  aria-label="Ocultar leyenda"
                  title="Ocultar leyenda"
                  className="pointer-events-auto -mr-1.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:scale-90 dark:hover:bg-white/10 dark:hover:text-slate-200"
                >
                  <EyeOff size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Total */}
            <p className="mt-3 flex items-baseline gap-2">
              <span className="text-[32px] font-black leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">
                {total.toLocaleString('es-ES')}
              </span>
              <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">trenes circulando</span>
            </p>

            {/* Reparto proporcional */}
            <div className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
              {counts.map((c) =>
                c.count ? (
                  <span
                    key={c.label}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${(c.count / Math.max(total, 1)) * 100}%`, background: c.color }}
                  />
                ) : null,
              )}
            </div>

            {/* Leyenda con recuentos */}
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {counts.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-600 dark:text-slate-300">{c.label}</span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">{c.count}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
