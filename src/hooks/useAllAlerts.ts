import { useEffect, useState } from 'react';
import { getAllAlerts, type ServiceAlert } from '../api/alertsService';

const POLL_MS = 2 * 60_000;

interface AllAlertsState {
  alerts: ServiceAlert[] | null; // null mientras carga la primera vez
  error: boolean;
  updatedAt: Date | null;
}

/**
 * Todas las alertas actuales. Se refrescan cada 2 minutos solo con la pestaña visible
 * (getAllAlerts comparte una única petición cacheada entre componentes).
 * `enabled` permite esperar a que la sección entre en pantalla antes de pedir nada.
 */
export function useAllAlerts(enabled = true): AllAlertsState {
  const [state, setState] = useState<AllAlertsState>({ alerts: null, error: false, updatedAt: null });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const load = () =>
      getAllAlerts()
        .then((alerts) => alive && setState({ alerts, error: false, updatedAt: new Date() }))
        .catch(() => alive && setState((s) => ({ ...s, alerts: s.alerts ?? [], error: true })));
    load();
    const id = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled]);

  return state;
}
