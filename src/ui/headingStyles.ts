/**
 * Estilo único de las cabeceras de la web: etiqueta en píldora (Eyebrow, en heading.tsx) +
 * título + descripción. Dos tamaños de título:
 *  - `page`: cabecera de una página (Avisos, Buscar, Ajustes) y secciones de /trenes.
 *  - `section`: secciones de la home, algo más contenidas para que quepan en un portátil.
 */
export const HEADING = {
  page: 'text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-5xl lg:leading-[1.1] dark:text-white',
  section: 'text-3xl font-black leading-none tracking-tighter text-slate-900 md:text-4xl lg:leading-[1.1] dark:text-white',
} as const;

/** Descripción bajo el título */
export const LEAD = 'text-base leading-relaxed text-slate-500 md:text-lg dark:text-slate-400';
