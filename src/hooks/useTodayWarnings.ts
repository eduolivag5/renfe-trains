import { useMemo } from 'react';
import { useAllAlerts } from './useAllAlerts';
import { usePref } from './usePref';
import { isWarningAlert } from '../api/alertsService';
import { alertInNetwork } from '../components/alerts/alertFormat';

/**
 * Contador de avisos que muestran el botón flotante (móvil) y el rail (escritorio):
 * incidencias (tipo "AVISO", no información) con fecha de inicio hoy, en hora local; si el
 * usuario eligió su núcleo en Ajustes, solo las de ese núcleo.
 * `enabled` evita pedir los avisos desde el componente que no se ve (cada uno en su tamaño de
 * pantalla). La petición es la misma, cacheada, que usa el resto de la web.
 */
export function useTodayWarnings(enabled = true) {
  const { alerts } = useAllAlerts(enabled);
  const nucleo = usePref('nucleo');

  const count = useMemo(() => {
    const today = new Date().toDateString();
    return (alerts ?? []).filter(
      (a) =>
        isWarningAlert(a) &&
        new Date(a.fechaInicio).toDateString() === today &&
        (!nucleo || alertInNetwork(a, nucleo)),
    ).length;
  }, [alerts, nucleo]);

  return { count, nucleo };
}
