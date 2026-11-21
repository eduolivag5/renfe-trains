/* Estilos de los campos de búsqueda (Origen, Destino, Fecha). También los usa el selector de
   núcleo de Ajustes, para que se vea exactamente igual. */

export const FIELD = 'flex w-full flex-col items-start rounded-2xl px-4 py-3 text-left transition-colors';

export const fieldState = (active: boolean) =>
  active ? 'bg-slate-100 dark:bg-white/[0.06]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]';

export const LABEL = 'text-[12px] font-semibold text-slate-400 dark:text-slate-500';

/** Popover de escritorio anclado bajo el campo */
export const POPOVER =
  'absolute top-full z-50 mt-2 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_24px_60px_-20px_rgba(2,33,71,0.35)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]';
