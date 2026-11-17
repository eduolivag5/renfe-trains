import { useEffect, useState } from 'react';

/**
 * Devuelve `value` solo cuando lleva `delay` ms sin cambiar.
 * Útil para que el input responda al instante mientras el trabajo caro (filtrar, renderizar
 * la lista, animarla) se hace una sola vez cuando el usuario deja de escribir.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
