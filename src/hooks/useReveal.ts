import { useEffect, useRef, useState } from 'react';

/**
 * `true` en cuanto el elemento entra en pantalla (una sola vez). Se combina con las clases CSS
 * `.reveal` / `.is-visible` de index.css: la animación la hace el navegador en la GPU, sin
 * JavaScript por frame. `margin` negativo = esperar a que asome un poco más.
 */
export function useReveal<T extends Element>(margin = '0px 0px -60px 0px') {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        io.disconnect();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);

  return [ref, visible] as const;
}

/** Ejecuta `cb` cuando el navegador está libre (o tras `timeout` ms). Devuelve la cancelación. */
export function onIdle(cb: () => void, timeout = 1200): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(cb, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(cb, 200);
  return () => clearTimeout(id);
}
