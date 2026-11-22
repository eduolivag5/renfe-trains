import { useEffect, useState } from 'react';

/**
 * Hora actual que se renueva sola cada `intervalMs` (por defecto, 30 s): mantiene al día la
 * cuenta atrás del próximo tren y qué trenes "han salido". Con `enabled` a false no hay
 * temporizador (p. ej. si la fecha consultada no es hoy).
 */
export function useNow(enabled = true, intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);
  return now;
}
