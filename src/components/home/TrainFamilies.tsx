import React from 'react';
import { TrainFront } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal';
import { getTrainLogo, TRAIN_FAMILIES } from '../../utils/trainUtils';

interface TrainType {
  logo: string;
  name: string;
  image: string;
  description: string;
}

interface TrainFamily {
  name: string;
  tagline: string;
  color: string;
  trains: TrainType[];
}

/* Las imágenes .webp tienen fondo transparente y el mismo tamaño (1438x160, el largo de Regional),
   recortadas desde el morro: todos los trenes miden lo mismo. */
const FAMILIES: TrainFamily[] = [
  {
    ...TRAIN_FAMILIES.ALTA_VELOCIDAD,
    tagline: 'Los trayectos más rápidos entre ciudades.',
    trains: [
      {
        logo: 'AVE',
        name: 'AVE',
        image: '/new_trains/librea-ave-v2.webp',
        description: 'Alta velocidad y la oferta de servicios más completa.',
      },
      {
        logo: 'AVLO',
        name: 'AVLO',
        image: '/new_trains/librea-avlo.webp',
        description: 'La alta velocidad con la oferta de precios más asequibles.',
      },
      {
        logo: 'AVANT',
        name: 'Avant',
        image: '/new_trains/librea-avant.webp',
        description: 'Alta velocidad para conectar distancias medias.',
      },
    ],
  },
  {
    ...TRAIN_FAMILIES.MEDIA_LARGA,
    tagline: 'Los trenes que conectan ciudades y territorios',
    trains: [
      {
        logo: 'INTERCITY',
        name: 'Intercity',
        image: '/new_trains/librea-intercity-v2.webp',
        description: 'Largas distancias, con pocas paradas y buen tiempo de viaje.',
      },
      {
        logo: 'REGIONAL',
        name: 'Regional',
        image: '/new_trains/librea-regional.webp',
        description: 'Más paradas y más lugares conectados.',
      },
    ],
  },
  {
    ...TRAIN_FAMILIES.METROPOLITANA,
    tagline: 'Cerca, frecuente y todos los días.',
    trains: [
      {
        logo: 'CERCANIAS',
        name: 'Cercanías',
        image: '/new_trains/librea-cercanias.webp',
        description: 'Movilidad cotidiana de alta frecuencia.',
      },
    ],
  },
];

/**
 * Un tren que "llega al andén" al entrar en pantalla (.train-arrive en index.css: transform en
 * GPU con curva de frenada). El difuminado izquierdo es un degradado del color del fondo encima
 * de la imagen, no un `mask-image`: la máscara obligaría a repintar la imagen en cada frame.
 */
const TrainRow: React.FC<{ train: TrainType; compact?: boolean }> = ({ train, compact }) => {
  const logo = getTrainLogo(train.logo);
  const [ref, visible] = useReveal<HTMLLIElement>();

  return (
    <li
      ref={ref}
      className={`grid grid-cols-1 items-center ${
        compact
          ? 'gap-2.5' // compacto: imagen arriba y logo + descripción en una línea debajo
          : 'gap-6 md:grid-cols-[1fr_15rem] md:gap-16 lg:grid-cols-[1fr_17rem] lg:gap-24'
      } ${visible ? 'is-visible' : ''}`}
    >
      {/* Tren: ocupa todo el ancho de la columna, difuminado a la izquierda */}
      <div className="relative overflow-hidden">
        <img
          src={train.image}
          alt={`Tren ${train.name}`}
          loading="lazy"
          decoding="async"
          width={1438}
          height={160}
          className="train-arrive block h-auto w-full"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[30%] bg-gradient-to-r from-[var(--page-bg)] to-transparent"
        />
      </div>

      {/* Logo + descripción */}
      <div className={`train-caption flex ${compact ? 'items-start gap-3' : 'flex-col gap-2.5'}`}>
        <img
          src={logo.src}
          alt={train.name}
          className={`w-auto shrink-0 self-start ${compact ? 'mt-0.5 h-4' : 'h-5'} ${logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
        />
        <p className={`leading-relaxed text-slate-500 dark:text-slate-400 ${compact ? 'text-[13px]' : 'text-sm'}`}>{train.description}</p>
      </div>
    </li>
  );
};

/**
 * Las tres familias de trenes. `compact` (home): cabecera más contenida y las familias en tres
 * columnas en escritorio, para que la sección quepa en la pantalla de un portátil. Sin `compact`
 * (página /trenes): una familia debajo de otra con los trenes a todo el ancho.
 */
const TrainFamilies: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <section className={compact ? 'space-y-8 compact:space-y-6' : 'space-y-16'}>
    {/* Cabecera */}
    <div className={`max-w-2xl ${compact ? 'space-y-3' : 'space-y-4'}`}>
      <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
        <TrainFront size={14} /> Nuestros trenes
      </div>
      <h2
        className={`text-3xl font-black leading-none tracking-tighter text-slate-900 dark:text-white lg:leading-[1.1] ${
          compact ? 'md:text-4xl' : 'md:text-5xl'
        }`}
      >
        ¿Cómo funcionan los trenes?
      </h2>
      <p className={`text-base leading-relaxed text-slate-500 dark:text-slate-400 ${compact ? 'md:text-lg' : 'md:text-xl'}`}>
        Tres familias de servicios, cada una pensada para un tipo de viaje.
      </p>
    </div>

    {/* Familias */}
    <div className={compact ? 'grid gap-12 lg:grid-cols-3 lg:gap-10' : 'space-y-20'}>
      {FAMILIES.map((family, i) => (
        <div key={family.name} className={compact ? 'min-w-0 space-y-5' : 'space-y-10'}>
          {compact ? (
            // Cabecera de columna: número, nombre y filete del color de la familia
            <div className="space-y-1.5 border-t-2 pt-3" style={{ borderColor: family.color }}>
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-sm font-bold" style={{ color: family.color }}>
                  0{i + 1}
                </span>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{family.name}</h3>
              </div>
              <p className="text-[13px] text-slate-500 dark:text-slate-400">{family.tagline}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm font-bold" style={{ color: family.color }}>
                  0{i + 1}
                </span>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white md:text-3xl">
                  {family.name}
                </h3>
              </div>
              <span className="hidden h-px flex-1 bg-slate-200 dark:bg-white/10 md:block" />
              <p className="text-sm leading-none text-slate-500 dark:text-slate-400">{family.tagline}</p>
            </div>
          )}

          <ul className={compact ? 'space-y-5' : 'space-y-10 md:space-y-12'}>
            {family.trains.map((train) => (
              <TrainRow key={train.name} train={train} compact={compact} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default TrainFamilies;
