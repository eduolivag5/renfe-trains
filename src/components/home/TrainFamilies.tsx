import React from 'react';
import { motion } from 'framer-motion';
import { TrainFront } from 'lucide-react';
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

/** Curva de frenada: entra rápido y se detiene suavemente, como un tren llegando al andén */
const ARRIVAL_EASE = [0.16, 1, 0.3, 1] as const;

const TrainRow: React.FC<{ train: TrainType }> = ({ train }) => {
  const logo = getTrainLogo(train.logo);

  return (
    <li className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_15rem] md:gap-16 lg:grid-cols-[1fr_17rem] lg:gap-24">
      {/* Tren: ocupa todo el ancho de la columna, difuminado a la izquierda */}
      <div
        className="overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 30%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 30%)',
        }}
      >
        <motion.img
          src={train.image}
          alt={`Tren ${train.name}`}
          loading="lazy"
          decoding="async"
          initial={{ x: '-75%' }}
          whileInView={{ x: '0%' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.6, ease: ARRIVAL_EASE }}
          width={1438}
          height={160}
          className="block h-auto w-full"
        />
      </div>

      {/* Logo + descripción */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="flex flex-col gap-2.5"
      >
        <img
          src={logo.src}
          alt={train.name}
          className={`h-5 w-auto self-start ${logo.monoDark ? 'dark:brightness-0 dark:invert' : ''}`}
        />
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{train.description}</p>
      </motion.div>
    </li>
  );
};

const TrainFamilies: React.FC = () => (
  <section className="space-y-16">
    {/* Cabecera */}
    <div className="max-w-2xl space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        <TrainFront size={14} /> Nuestros trenes
      </div>
      <h2 className="text-3xl font-black leading-none tracking-tighter text-slate-900 dark:text-white md:text-5xl lg:leading-[1.1]">
        ¿Cómo funcionan los trenes?
      </h2>
      <p className="text-base leading-relaxed text-slate-500 dark:text-slate-400 md:text-xl">
        Tres familias de servicios, cada una pensada para un tipo de viaje.
      </p>
    </div>

    {/* Familias */}
    <div className="space-y-20">
      {FAMILIES.map((family, i) => (
        <div key={family.name} className="space-y-10">
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

          <ul className="space-y-10 md:space-y-12">
            {family.trains.map((train) => (
              <TrainRow key={train.name} train={train} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  </section>
);

export default TrainFamilies;
