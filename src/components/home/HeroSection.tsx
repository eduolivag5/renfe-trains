import React, { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { ArrowRight, Map, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTrainLogo } from '../../utils/trainUtils';
import { onIdle } from '../../hooks/useReveal';

// Mini mapa en directo: chunk aparte (d3-geo + geometría) y solo en pantallas grandes
const HeroLiveMap = lazy(() => import('./HeroLiveMap'));
const LG_QUERY = '(min-width: 1024px)';
const subscribeLg = (cb: () => void) => {
  const mq = window.matchMedia(LG_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const useIsLg = () => useSyncExternalStore(subscribeLg, () => window.matchMedia(LG_QUERY).matches);

/* ------------------------------------------------------------------ */
/* Datos decorativos                                                   */
/* ------------------------------------------------------------------ */

const DESTINATIONS = ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Málaga', 'Bilbao'];

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
      {/* Las dos palabras van en absoluto: no hace falta medir (popLayout). Se anima la propiedad
          `transform` completa (no y), que framer-motion delega en el compositor (WAAPI). */}
      <AnimatePresence initial={false}>
        <motion.span
          key={DESTINATIONS[index]}
          initial={{ transform: 'translateY(100%)', opacity: 0 }}
          animate={{ transform: 'translateY(0%)', opacity: 1 }}
          exit={{ transform: 'translateY(-100%)', opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 leading-[1.3] text-accent-700 dark:text-accent-400 lg:right-auto"
        >
          {DESTINATIONS[index]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

/** Retardo de la entrada en CSS (.rise-in): opacity + transform compuestos en GPU, sin JS por frame */
const riseIn = (delayMs = 0) => ({ style: { '--delay': `${delayMs}ms` } as React.CSSProperties });

/** Hueco del mini mapa mientras llega: mismo marco y alturas que HeroLiveMap (sin saltos) */
const MAP_PLACEHOLDER = (
  <div className="w-full max-w-[520px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:border-white/[0.07] dark:bg-slate-900/70">
    <div className="h-[61px] border-b border-slate-100 dark:border-white/5" />
    <div className="h-[clamp(220px,44vh,420px)] bg-slate-50/60 dark:bg-white/[0.02]" />
    <div className="h-[73px] border-t border-slate-100 dark:border-white/5" />
  </div>
);

/** El mini mapa se monta cuando el navegador queda libre, tras la animación de entrada */
const MAP_DELAY_MS = 700;

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const isLg = useIsLg();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!isLg) return;
    let cancelIdle = () => {};
    const t = setTimeout(() => {
      cancelIdle = onIdle(() => setMapReady(true));
    }, MAP_DELAY_MS);
    return () => {
      clearTimeout(t);
      cancelIdle();
    };
  }, [isLg]);

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

        {/* --- LOGO (solo móvil: en escritorio ya está en el rail). Misma altura y tamaño que el
            botón flotante de avisos de la esquina derecha; se desplaza con la página. --- */}
        <img
          src="/logo.svg"
          alt="Renfe"
          width={44}
          height={44}
          className="absolute left-4 top-[calc(env(safe-area-inset-top)+0.75rem)] h-11 w-11 rounded-[14px] shadow-[0_8px_24px_-12px_rgba(2,33,71,0.45)] ring-1 ring-slate-900/5 md:hidden dark:ring-white/10"
        />

        {/* --- CONTENIDO --- */}
        <div className="mx-auto flex w-full max-w-page flex-1 items-center px-page pb-4 pt-8 md:pb-8 md:pt-16 compact:pb-6 compact:pt-12">
          <div className="grid w-full grid-cols-1 items-center gap-16 lg:grid-cols-[1.15fr_1fr]">
            {/* Texto */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <h1
                {...riseIn(0)}
                className="rise-in text-[2.3rem] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl md:text-[clamp(3rem,min(5vw,9vh),4.5rem)] dark:text-white"
              >
                Tu próximo tren
                <br />
                <span className="font-semibold text-slate-400 dark:text-slate-500">con destino a</span>
                <RotatingDestination />
              </h1>

              <p
                {...riseIn(160)}
                className="rise-in mt-4 max-w-xl text-[15px] leading-relaxed text-slate-500 md:mt-6 md:text-lg compact:mt-5 dark:text-slate-400"
              >
                Consulta horarios, sigue cada tren sobre el mapa y descubre las salidas de toda la red
                ferroviaria española.
              </p>

              <div {...riseIn(240)} className="rise-in mt-7 grid w-full grid-cols-2 gap-2.5 sm:flex sm:w-auto sm:gap-3 md:mt-10 compact:mt-9">
                <button
                  onClick={scrollToSearch}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-[15px] font-semibold text-white sm:px-7 sm:py-3.5 sm:text-base transition-colors hover:bg-accent-700 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-accent-200"
                >
                  <Search size={18} />
                  <span>Buscar trenes</span>
                  <ArrowRight size={16} className="hidden transition-transform group-hover:translate-x-0.5 sm:block" />
                </button>

                <button
                  onClick={() => navigate('/mapa')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-[15px] font-semibold text-slate-900 sm:px-7 sm:py-3.5 sm:text-base transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                >
                  <Map size={18} />
                  <span>Mapa en vivo</span>
                </button>
              </div>

              {/* Métricas */}
              <dl
                {...riseIn(320)}
                className="rise-in mt-8 grid w-full max-w-md grid-cols-3 divide-x divide-slate-200 md:mt-12 compact:mt-10 dark:divide-white/10"
              >
                {[
                  { value: '24/7', label: 'Tiempo real' },
                  { value: '+10', label: 'Servicios' },
                  { value: 'GTFS', label: 'Datos oficiales' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col-reverse px-2 text-center lg:px-0 lg:pl-6 lg:text-left lg:first:pl-0">
                    <dt className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{s.label}</dt>
                    <dd className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl dark:text-white">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Mini mapa en directo (solo pantallas grandes; en móvil ni se descarga). Se monta
                cuando termina la entrada y el navegador queda libre, para no competir con ella. */}
            <div {...riseIn(300)} className="rise-in hidden lg:flex lg:justify-end">
              {isLg && (
                <Suspense fallback={MAP_PLACEHOLDER}>
                  {mapReady ? <HeroLiveMap /> : MAP_PLACEHOLDER}
                </Suspense>
              )}
            </div>
          </div>
        </div>

        {/* --- PIE: marcas --- */}
        <div className="mx-auto w-full max-w-page px-page pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-10 compact:pb-8">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-slate-100 pt-5 md:gap-x-8 md:gap-y-4 md:pt-8 compact:pt-6 dark:border-white/5">
            {BRANDS.map((brand) => (
              <img
                key={brand}
                src={getTrainLogo(brand).src}
                alt={brand}
                className="h-3.5 w-auto opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0 md:h-5 dark:invert dark:hover:grayscale"
              />
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
};

export default HeroSection;
