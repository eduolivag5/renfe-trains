import { useEffect, type RefObject } from 'react';

/** Duración de cada desplazamiento (misma sensación que el zoom con rueda del mapa) */
const DURATION_MS = 420;
/** Golpes de rueda por debajo de este delta se consideran trackpad (ya es suave): scroll nativo */
const MIN_WHEEL_DELTA = 40;

/** ¿Hay, entre el destino del evento y el contenedor, otro elemento que pueda desplazarse en esa dirección? */
function innerScrollable(target: EventTarget | null, root: HTMLElement, dy: number): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== root) {
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll') {
        const canScroll = dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0;
        if (canScroll) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Desplazamiento suave con la rueda del ratón en un contenedor con scroll propio (<main>).
 * Cada golpe de rueda fija un destino y un bucle rAF interpola hasta él con easeOutCubic; los
 * golpes que llegan durante la animación se suman al destino, así girar rápido da un único
 * movimiento continuo en lugar de saltos.
 *
 * No interviene (scroll nativo) con: trackpad (deltas pequeños, ya suaves), Ctrl+rueda (zoom),
 * desplazamiento horizontal, listas internas con scroll propio ni "reducir movimiento".
 * Solo escribe `scrollTop`: el navegador compone el desplazamiento sin repintar en exceso.
 */
export function useSmoothWheelScroll(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let from = 0;
    let target = 0;
    let start = 0;
    let raf = 0;

    const maxScroll = () => el.scrollHeight - el.clientHeight;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3; // easeOutCubic: arranca rápido y frena suave
      el.scrollTop = from + (target - from) * eased;
      raf = t < 1 ? requestAnimationFrame(step) : 0;
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? el.clientHeight : 1; // líneas/páginas → px
      const dy = e.deltaY * unit;
      if (Math.abs(dy) < MIN_WHEEL_DELTA) return; // trackpad
      if (innerScrollable(e.target, el, dy)) return;

      e.preventDefault();
      // Si no había animación, partimos de la posición real (pudo moverse con teclado, barra…)
      const base = raf ? target : el.scrollTop;
      target = Math.max(0, Math.min(maxScroll(), base + dy));
      from = el.scrollTop;
      start = performance.now();
      if (!raf) raf = requestAnimationFrame(step);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    // Arrastrar la barra o tocar cancela la animación: manda el usuario
    el.addEventListener('pointerdown', stop);
    el.addEventListener('keydown', stop);
    return () => {
      stop();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('keydown', stop);
    };
  }, [ref, enabled]);
}
