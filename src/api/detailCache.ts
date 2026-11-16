import { trainsService, type TrainDetail } from './trainsService';

/**
 * Caché del detalle (paradas) de cada viaje, compartida por toda la app:
 * un recorrido ya consultado se abre al instante y nunca se duplica una petición en curso.
 */
const cache = new Map<string, TrainDetail>();
const inflight = new Map<string, Promise<TrainDetail>>();

export const getCachedDetail = (tripId: string) => cache.get(tripId) ?? null;

export function fetchDetail(tripId: string): Promise<TrainDetail> {
  const cached = cache.get(tripId);
  if (cached) return Promise.resolve(cached);
  let p = inflight.get(tripId);
  if (!p) {
    p = trainsService
      .getDetail(tripId)
      .then((d) => {
        cache.set(tripId, d);
        return d;
      })
      .finally(() => inflight.delete(tripId));
    inflight.set(tripId, p);
  }
  return p;
}

/** Precarga silenciosa (al pasar el ratón o empezar a tocar una tarjeta) */
export const prefetchDetail = (tripId: string) => {
  if (!cache.has(tripId)) fetchDetail(tripId).catch(() => {});
};
