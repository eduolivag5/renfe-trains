import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllAlerts, type ServiceAlert } from '../api/alertsService';

const POLL_MS = 2 * 60_000;
/** Duración mínima del estado "actualizando" para que el giro del icono se perciba */
const MIN_REFRESH_MS = 600;

interface AllAlertsState {
  alerts: ServiceAlert[] | null; // null mientras carga la primera vez
  error: boolean;
  updatedAt: Date | null;
}

export interface UseAllAlerts extends AllAlertsState {
  /** Recarga manual: ignora la caché y reinicia el ciclo de refresco automático */
  refresh: () => void;
  refreshing: boolean;
}

/**
 * Todos los avisos actuales. Se refrescan cada 2 minutos solo con la pestaña visible
 * (getAllAlerts comparte una única petición cacheada entre componentes).
 * `enabled` permite esperar a que la sección entre en pantalla antes de pedir nada.
 */
export function useAllAlerts(enabled = true): UseAllAlerts {
  const [state, setState] = useState<AllAlertsState>({ alerts: null, error: false, updatedAt: null });
  const [refreshing, setRefreshing] = useState(false);
  const [cycle, setCycle] = useState(0); // al cambiar, reinicia el intervalo
  const alive = useRef(true);

  const load = useCallback(
    (force = false) =>
      getAllAlerts(force)
        .then((alerts) => alive.current && setState({ alerts, error: false, updatedAt: new Date() }))
        .catch(() => alive.current && setState((s) => ({ ...s, alerts: s.alerts ?? [], error: true }))),
    [],
  );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (cycle === 0) load();
    const id = setInterval(() => document.visibilityState === 'visible' && load(), POLL_MS);
    return () => clearInterval(id);
  }, [enabled, load, cycle]);

  const refresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    const minDelay = new Promise((r) => setTimeout(r, MIN_REFRESH_MS));
    Promise.all([load(true), minDelay]).finally(() => {
      if (!alive.current) return;
      setRefreshing(false);
      setCycle((c) => c + 1);
    });
  }, [load, refreshing]);

  return { ...state, refresh, refreshing };
}
