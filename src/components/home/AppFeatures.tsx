import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Layers } from 'lucide-react';
import { getTrainLogo } from '../../utils/trainUtils';

/* ------------------------------------------------------------------ */
/* Mini vistas previas (decorativas, sin datos)                        */
/* ------------------------------------------------------------------ */

/** Buscador + una fila de resultado */
const SearchPreview = () => (
  <div aria-hidden className="space-y-2">
    <div className="space-y-1.5 rounded-2xl bg-white p-3 shadow-[0_8px_24px_-12px_rgba(2,33,71,0.25)] dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full border-2 border-accent-500" />
        <span className="h-2 w-24 rounded-full bg-slate-200 dark:bg-white/15" />
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent-500" />
        <span className="h-2 w-16 rounded-full bg-slate-200 dark:bg-white/15" />
      </div>
    </div>
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_24px_-12px_rgba(2,33,71,0.25)] dark:bg-slate-800">
      <span className="text-[13px] font-black tabular-nums text-slate-900 dark:text-white">10:27</span>
      <span className="h-0.5 flex-1 rounded-full bg-accent-500/40" />
      <span className="text-[13px] font-black tabular-nums text-slate-900 dark:text-white">13:44</span>
    </div>
  </div>
);

/** Grupos de trenes sobre un mapa */
const MapPreview = () => (
  <svg aria-hidden viewBox="0 0 200 110" className="h-full w-full drop-shadow-[0_8px_16px_rgba(2,33,71,0.18)]">
    <path
      d="M40 22 L95 14 L150 20 L172 40 L160 62 L150 88 L110 98 L70 94 L48 80 L36 58 L28 40 Z"
      className="fill-white stroke-slate-200 dark:fill-slate-800 dark:stroke-white/10"
      strokeWidth={1.5}
    />
    {[
      { x: 92, y: 54, r: 15, n: '135', c: '#ef2c30' },
      { x: 150, y: 36, r: 12, n: '89', c: '#f47216' },
      { x: 140, y: 72, r: 10, n: '27', c: '#ef2c30' },
      { x: 62, y: 32, r: 9, n: '12', c: '#808080' },
    ].map((b) => (
      <g key={b.n}>
        <circle cx={b.x} cy={b.y} r={b.r} fill="none" stroke={b.c} strokeWidth={3} />
        <circle cx={b.x} cy={b.y} r={b.r - 3} className="fill-white dark:fill-slate-900" />
        <text x={b.x} y={b.y + 3} textAnchor="middle" fontSize={b.r > 12 ? 9 : 7.5} fontWeight={800} className="fill-slate-900 dark:fill-white">
          {b.n}
        </text>
      </g>
    ))}
    {[
      [70, 70],
      [116, 82],
      [124, 30],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} fill="#851765" stroke="white" strokeWidth={1.5} />
    ))}
  </svg>
);

/** Logos de los servicios (fondo blanco también en oscuro: algunos logos son oscuros) */
const FamiliesPreview = () => (
  <div aria-hidden className="grid grid-cols-3 gap-2">
    {['AVE', 'AVLO', 'AVANT', 'INTERCITY', 'REGIONAL', 'CERCANIAS'].map((k) => (
      <span key={k} className="flex h-11 items-center justify-center rounded-xl bg-white px-2 shadow-[0_8px_20px_-12px_rgba(2,33,71,0.3)]">
        <img src={getTrainLogo(k).src} alt="" className="max-h-4 w-auto max-w-full object-contain" />
      </span>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Sección: índice numerado (sin tarjetas)                             */
/* ------------------------------------------------------------------ */

const FEATURES: { title: string; text: string; cta: string; href: string; Preview: () => React.ReactElement }[] = [
  {
    title: 'Busca horarios',
    text: 'Todos los trenes del día entre dos estaciones, con filtros, duración y paradas.',
    cta: 'Buscar trenes',
    href: '/buscar',
    Preview: SearchPreview,
  },
  {
    title: 'Sigue el mapa en vivo',
    text: 'Dónde está cada tren ahora mismo, agrupados por zonas y con su recorrido.',
    cta: 'Abrir mapa',
    href: '/mapa',
    Preview: MapPreview,
  },
  {
    title: 'Conoce los trenes',
    text: 'Alta velocidad, media y larga distancia y Cercanías: qué ofrece cada servicio.',
    cta: 'Ver familias',
    href: '/trenes',
    Preview: FamiliesPreview,
  },
];

const AppFeatures = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-10">
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
          <Layers size={14} /> Todo en un sitio
        </div>
        <h2 className="text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-5xl lg:leading-[1.1] dark:text-white">
          Qué puedes hacer aquí
        </h2>
      </div>

      <ol className="border-b border-slate-200 dark:border-white/10">
        {FEATURES.map(({ title, text, cta, href, Preview }, i) => (
          <motion.li
            key={href}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={() => navigate(href)}
              aria-label={`${title}: ${cta}`}
              className="group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-4 border-t border-slate-200 py-8 text-left md:grid-cols-[5rem_1fr_15rem_auto] md:gap-x-10 md:py-10 dark:border-white/10"
            >
              {/* Línea superior que se rellena al pasar el ratón */}
              <span
                aria-hidden
                className="absolute -top-px left-0 h-0.5 w-0 bg-accent-600 transition-all duration-700 ease-out group-hover:w-full dark:bg-accent-400"
              />

              <span className="self-start pt-1.5 font-mono text-sm font-bold text-slate-300 transition-colors group-hover:text-accent-600 md:text-base dark:text-slate-600 dark:group-hover:text-accent-400">
                0{i + 1}
              </span>

              <div className="min-w-0">
                <h3 className="text-2xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-accent-600 md:text-4xl dark:text-white dark:group-hover:text-accent-400">
                  {title}
                </h3>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500 md:text-base dark:text-slate-400">{text}</p>
              </div>

              {/* Vista previa (escritorio) */}
              <div className="hidden h-28 items-center md:flex">
                <div className="w-full origin-center transition-transform duration-500 ease-out group-hover:-rotate-1 group-hover:scale-105">
                  <Preview />
                </div>
              </div>

              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 group-hover:rotate-45 group-hover:border-accent-600 group-hover:bg-accent-600 group-hover:text-white dark:border-white/10 dark:text-slate-500 dark:group-hover:border-accent-500 dark:group-hover:bg-accent-500">
                <ArrowUpRight size={20} strokeWidth={2.5} />
              </span>
            </button>
          </motion.li>
        ))}
      </ol>
    </section>
  );
};

export default AppFeatures;
