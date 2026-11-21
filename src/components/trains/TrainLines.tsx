import { Route } from 'lucide-react';
import { Eyebrow } from '../../ui/heading';
import { HEADING, LEAD } from '../../ui/headingStyles';

/**
 * Mapa esquemático de las líneas de AVE (morado) y larga distancia (gris).
 * PNG con fondo transparente; sus textos son gris oscuro, así que en modo oscuro se invierte
 * la imagen y se rota el tono 180° para que el morado de las líneas se mantenga.
 */
const TrainLines = () => (
  <section className="space-y-10">
    <div className="max-w-2xl space-y-4">
      <Eyebrow icon={Route}>Red</Eyebrow>
      <h2 className={HEADING.page}>Líneas de AVE y larga distancia</h2>
      <p className={LEAD}>
        Las rutas de AVE y larga distancia: en morado, las líneas de AVE; en gris, las de larga distancia.
      </p>
    </div>

    <figure className="space-y-4">
      <figcaption className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-[#d6006b] dark:bg-[#ff5fa8]" /> AVE
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-slate-400" /> Larga distancia
        </span>
      </figcaption>
      <img
        src="/lines/ave-larga-distancia.png"
        alt="Mapa de las líneas de AVE y larga distancia en España y Francia"
        loading="lazy"
        width={1280}
        height={1073}
        className="mx-auto h-auto w-full max-w-5xl select-none dark:invert dark:hue-rotate-180"
      />
    </figure>
  </section>
);

export default TrainLines;
