import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { ArrowRight, Map, Search, Clock, TrainFront } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTrainLogo } from '../../utils/trainUtils';

/* ------------------------------------------------------------------ */
/* Datos decorativos                                                   */
/* ------------------------------------------------------------------ */

const DESTINATIONS = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Málaga', 'Bilbao'];

const DEPARTURES = [
  { time: '08:30', dest: 'Barcelona-Sants', logo: 'AVE', train: '03071', via: '4', status: 'ontime' },
  { time: '08:45', dest: 'València J. Sorolla', logo: 'AVLO', train: '05161', via: '7', status: 'ontime' },
  { time: '09:05', dest: 'Málaga M. Zambrano', logo: 'INTERCITY', train: '02260', via: '2', status: 'delay' },
  { time: '09:20', dest: 'Toledo', logo: 'AVANT', train: '08062', via: '11', status: 'ontime' },
] as const;

const STATUS_STYLES = {
  ontime: { label: 'A tiempo', cls: 'text-emerald-600 dark:text-emerald-400' },
  delay: { label: '+5 min', cls: 'text-amber-600 dark:text-amber-400' },
} as const;

const BRANDS = ['AVE', 'AVLO', 'AVANT', 'INTERCITY', 'REGIONAL', 'CERCANIAS'];

/* ------------------------------------------------------------------ */
/* Sub-componentes                                                     */
/* ------------------------------------------------------------------ */

/** Plano de vías estático: sin animaciones ni filtros, coste de GPU nulo */
const RailLines: React.FC = () => (
  <svg
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    className="absolute inset-0 h-full w-full text-slate-300 dark:text-white/[0.07]"
    aria-hidden
  >
    <g fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round">
      <path d="M 820 -20 L 820 260 L 1000 440 L 1460 440" />
      <path d="M 980 -20 L 980 180 L 1140 340 L 1460 340" />
      <path d="M 700 920 L 700 760 L 860 600 L 1460 600" />
    </g>
    <g className="fill-white dark:fill-[#020617]" stroke="currentColor" strokeWidth={1.5}>
      <circle cx={820} cy={260} r={5} />
      <circle cx={1000} cy={440} r={5} />
      <circle cx={1140} cy={340} r={5} />
      <circle cx={860} cy={600} r={5} />
    </g>
  </svg>
);

const RotatingDestination: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % DESTINATIONS.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="relative block h-[1.3em] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={DESTINATIONS[index]}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 leading-[1.3] text-accent-700 dark:text-accent-400 lg:right-auto"
        >
          {DESTINATIONS[index]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

const LiveClock: React.FC = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono tabular-nums">
      {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

const DepartureBoard: React.FC = () => (
  <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
    {/* Cabecera */}
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-white/5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400">
          <TrainFront size={18} />
        </div>
        <div className="leading-tight">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Salidas</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Madrid Pta. de Atocha</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Clock size={12} />
        <LiveClock />
      </div>
    </div>

    {/* Filas */}
    <ul className="divide-y divide-slate-100 dark:divide-white/5">
      {DEPARTURES.map((d) => {
        const status = STATUS_STYLES[d.status];
        return (
          <li key={d.train} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 px-6 py-3.5">
            <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">
              {d.time}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{d.dest}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px]">
                <img
                  src={getTrainLogo(d.logo).src}
                  alt={d.logo}
                  className={`h-3 w-auto ${getTrainLogo(d.logo).monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
                />
                <span className="text-slate-400">{d.train}</span>
                <span className={`font-semibold ${status.cls}`}>· {status.label}</span>
              </div>
            </div>
            <span className="text-right">
              <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Vía</span>
              <span className="font-mono text-base font-bold text-slate-900 dark:text-white">{d.via}</span>
            </span>
          </li>
        );
      })}
    </ul>
  </div>
);

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  const scrollToSearch = () =>
    document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-white dark:bg-[#020617]">
        {/* --- FONDO (estático) --- */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_20%,rgba(139,92,246,0.08),transparent)] dark:bg-[radial-gradient(ellipse_70%_60%_at_80%_20%,rgba(139,92,246,0.12),transparent)]" />
          <RailLines />
        </div>

        {/* --- CONTENIDO --- */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 pt-16 pb-8 md:pt-16">
          <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
            {/* Texto */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <motion.div
                {...fadeUp(0)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Datos de la red en tiempo real
              </motion.div>

              <motion.h1
                {...fadeUp(0.08)}
                className="mt-8 text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-6xl md:text-7xl"
              >
                Tu próximo tren
                <br />
                <span className="font-semibold text-slate-400 dark:text-slate-500">con destino a</span>
                <RotatingDestination />
              </motion.h1>

              <motion.p
                {...fadeUp(0.16)}
                className="mt-6 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400 md:text-lg"
              >
                Consulta horarios, sigue cada tren sobre el mapa y descubre las salidas de toda la red
                ferroviaria española.
              </motion.p>

              <motion.div {...fadeUp(0.24)} className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <button
                  onClick={scrollToSearch}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-accent-700 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-accent-200"
                >
                  <Search size={18} />
                  <span>Buscar trenes</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => navigate('/mapa')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-7 py-3.5 font-semibold text-slate-900 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                  <Map size={18} />
                  <span>Mapa en vivo</span>
                </button>
              </motion.div>

              {/* Métricas */}
              <motion.dl
                {...fadeUp(0.32)}
                className="mt-12 grid w-full max-w-md grid-cols-3 divide-x divide-slate-200 dark:divide-white/10"
              >
                {[
                  { value: '24/7', label: 'Tiempo real' },
                  { value: '+10', label: 'Servicios' },
                  { value: 'GTFS', label: 'Datos oficiales' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col-reverse px-2 text-center lg:px-0 lg:pl-6 lg:text-left lg:first:pl-0">
                    <dt className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</dt>
                    <dd className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{s.value}</dd>
                  </div>
                ))}
              </motion.dl>
            </div>

            {/* Panel de salidas (solo desktop) */}
            <motion.div {...fadeUp(0.3)} className="hidden lg:flex lg:justify-end">
              <DepartureBoard />
            </motion.div>
          </div>
        </div>

        {/* --- PIE: marcas --- */}
        <div className="mx-auto w-full max-w-5xl px-6 pb-28 md:pb-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-slate-100 pt-8 dark:border-white/5">
            {BRANDS.map((brand) => (
              <img
                key={brand}
                src={getTrainLogo(brand).src}
                alt={brand}
                loading="lazy"
                className="h-5 w-auto opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0 dark:invert dark:hover:grayscale"
              />
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
};

export default HeroSection;
