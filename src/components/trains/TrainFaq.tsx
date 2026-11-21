import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Plus } from 'lucide-react';
import { Eyebrow } from '../../ui/heading';
import { HEADING, LEAD } from '../../ui/headingStyles';

const FAQS: { q: string; a: string }[] = [
  {
    q: '¿Qué diferencia hay entre AVE, AVLO y Avant?',
    a: 'Los tres circulan por líneas de alta velocidad. AVE es el servicio con la oferta más completa entre grandes ciudades; AVLO es la alta velocidad con precios más asequibles y servicios a bordo más básicos; Avant conecta distancias medias (por ejemplo, Madrid–Toledo o Madrid–Segovia) con viajes cortos y frecuentes.',
  },
  {
    q: '¿Y Alvia, Intercity y Regional?',
    a: 'Forman la familia de media y larga distancia. Alvia e Intercity hacen recorridos largos con pocas paradas; los Regionales hacen más paradas y conectan más localidades. En la búsqueda verás cada tren con su logo y la familia a la que pertenece.',
  },
  {
    q: '¿Qué son Cercanías y Rodalies?',
    a: 'Son los trenes de movilidad metropolitana: alta frecuencia y muchas paradas dentro de un área urbana. Rodalies es el nombre que reciben en Cataluña. En el mapa aparecen con colores distintos (rojo Cercanías, naranja Rodalies).',
  },
  {
    q: '¿De dónde salen los datos?',
    a: 'Los horarios proceden de los datos abiertos GTFS que publica Renfe, y las posiciones del mapa de su servicio de información en tiempo real. Esta web solo los presenta de forma más clara.',
  },
  {
    q: '¿Cada cuánto se actualiza el mapa en vivo?',
    a: 'Las posiciones de los trenes se refrescan automáticamente cada 30 segundos mientras tienes la página abierta. Si la pestaña está en segundo plano, se pausa para no consumir datos.',
  },
  {
    q: '¿Por qué un tren aparece como «Ha salido»?',
    a: 'Cuando buscas trenes para hoy, los que ya han pasado su hora de salida se marcan así y se ocultan por defecto. Puedes mostrarlos desde el panel de filtros.',
  },
  {
    q: '¿Puedo comprar billetes aquí?',
    a: 'No. Esta web es informativa: te ayuda a consultar horarios, recorridos y la posición de los trenes. Para comprar billetes usa los canales oficiales de Renfe.',
  },
  {
    q: '¿Necesito crear una cuenta?',
    a: 'No. No hay registro ni inicio de sesión. Tus preferencias (como el tema o la leyenda del mapa) se guardan solo en tu navegador y puedes restablecerlas desde Ajustes.',
  },
];

/** Preguntas frecuentes en acordeón abierto (sin tarjetas): solo una respuesta abierta a la vez */
const TrainFaq = () => {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20">
      {/* Cabecera (fija al hacer scroll en escritorio) */}
      <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <Eyebrow icon={HelpCircle}>Ayuda</Eyebrow>
        <h2 className={HEADING.page}>Preguntas frecuentes</h2>
        <p className={LEAD}>
          Lo que más se pregunta sobre los tipos de tren y sobre cómo funciona esta web.
        </p>
      </div>

      {/* Acordeón */}
      <ul className="border-b border-slate-200 dark:border-white/10">
        {FAQS.map(({ q, a }, i) => {
          const isOpen = open === i;
          return (
            <li key={q} className="border-t border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${i}`}
                className="group flex w-full items-center gap-5 py-6 text-left"
              >
                <span className="font-mono text-[13px] font-bold text-slate-300 transition-colors group-hover:text-accent-600 dark:text-slate-600 dark:group-hover:text-accent-400">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`flex-1 text-lg font-bold tracking-tight transition-colors md:text-xl ${
                    isOpen ? 'text-accent-600 dark:text-accent-400' : 'text-slate-900 group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-400'
                  }`}
                >
                  {q}
                </span>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition duration-300 ${
                    isOpen
                      ? 'rotate-45 border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
                      : 'border-slate-200 text-slate-400 group-hover:border-accent-600 group-hover:text-accent-600 dark:border-white/10 dark:text-slate-500'
                  }`}
                >
                  <Plus size={17} strokeWidth={2.5} />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-7 pl-10 pr-14 text-[15px] leading-relaxed text-slate-500 md:text-base dark:text-slate-400">
                      {a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default TrainFaq;
