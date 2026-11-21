import { useEffect } from 'react';

/**
 * Mientras `active`, la página no admite "tirar para recargar" ni el rebote del scroll: un gesto
 * hacia abajo sobre un panel o una hoja abiertos encima de la web ya no recarga la página.
 */
export function useNoPullToRefresh(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const prev = root.style.overscrollBehavior;
    root.style.overscrollBehavior = 'none';
    return () => {
      root.style.overscrollBehavior = prev;
    };
  }, [active]);
}
