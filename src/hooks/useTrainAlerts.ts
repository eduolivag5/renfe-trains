import { useEffect, useState } from 'react';
import { getAlertsForTrain, type AlertLookup, type ServiceAlert } from '../api/alertsService';

/**
 * Alertas de servicio que afectan a un tren. Devuelve [] mientras carga o si no hay ninguna,
 * así el icono solo aparece cuando de verdad existen alertas.
 */
export function useTrainAlerts({ tripId, tipo, routeId }: AlertLookup): ServiceAlert[] {
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);

  useEffect(() => {
    let alive = true;
    getAlertsForTrain({ tripId, tipo, routeId })
      .then((a) => alive && setAlerts(a))
      .catch(() => alive && setAlerts([]));
    return () => {
      alive = false;
    };
  }, [tripId, tipo, routeId]);

  return alerts;
}
