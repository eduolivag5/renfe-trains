import { useReducedMotion } from 'framer-motion';

/** Curva de salida rápida y suave (sin rebote) */
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/**
 * Animación común de todos los paneles de móvil (buscador de estaciones, detalle de un horario,
 * calendario, ficha del mapa): fundido + 16 px de desplazamiento en 220 ms al abrir y fundido en
 * 150 ms al cerrar. Un recorrido corto se percibe mucho más fluido que subir el panel entero
 * desde el borde de la pantalla, y solo anima opacity y transform (los compone la GPU).
 * Al cerrar no se desplaza: si se cerró arrastrando, se desvanece donde se soltó.
 * Con "reducir movimiento" del sistema, solo fundido.
 */
export function useSheetMotion() {
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : 16;
  return {
    initial: { opacity: 0, y: offset },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
  };
}

/** Fondo oscurecido que acompaña al panel, con los mismos tiempos */
export const BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' as const } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' as const } },
};
