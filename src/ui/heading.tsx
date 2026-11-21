import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Etiqueta en píldora sobre el título de cada cabecera (estilos del título en headingStyles.ts) */
export const Eyebrow = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-accent-600 dark:text-accent-400">
    <Icon size={14} /> {children}
  </div>
);
