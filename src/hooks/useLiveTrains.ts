import { useEffect, useState } from 'react';
import { trainsService } from '../api/trainsService';
import { isSameTrip } from '../utils/trainUtils';

export interface LiveInfo {
  /** tripId del tren en el mapa en directo (para abrirlo en /mapa) */
  liveTripId: string;
  /** Retraso en minutos (null si la API no lo da todavía) */
  delay: number | null;
}

const POLL_MS = 60_000;
/** Como mucho se pide el retraso de estos trenes por vuelta (en un trayecto rara vez hay más) */
const MAX_DETAILS = 8;

/**
 * Trenes de la búsqueda que están circulando ahora mismo, con su retraso.
 * Solo con `enabled` (la fecha consultada es hoy): pide el mapa en directo, lo cruza con los
 * resultados (ver isSameTrip) y, de los que circulan, pide el detalle para saber el retraso.
 * Se repite cada minuto, y nunca con la pestaña en segundo plano.
 */
export function useLiveTrains(tripIds: string[], enabled: boolean) {
  const [live, setLive] = useState<Map<string, LiveInfo>>(() => new Map());
  const key = enabled ? tripIds.join(',') : '';

  useEffect(() => {
    if (!key) return;
    const ids = key.split(',');
    let cancelled = false;

    const run = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const map = await trainsService.getLiveMap();
        const matches: [string, string][] = [];
        for (const id of ids) {
          const t = map.find((m) => isSameTrip(id, m));
          if (t) matches.push([id, t.tripId]);
        }
        const details = await Promise.all(
          matches.slice(0, MAX_DETAILS).map(([, liveId]) => trainsService.getDetail(liveId).catch(() => null)),
        );
        if (cancelled) return;
        const next = new Map<string, LiveInfo>();
        matches.forEach(([id, liveTripId], i) => {
          const d = details[i];
          next.set(id, { liveTripId, delay: typeof d?.delayMinutes === 'number' ? d.delayMinutes : null });
        });
        setLive(next);
      } catch {
        /* sin datos en directo: las tarjetas se quedan como están */
      }
    };

    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key]);

  return key ? live : EMPTY;
}

const EMPTY = new Map<string, LiveInfo>();
