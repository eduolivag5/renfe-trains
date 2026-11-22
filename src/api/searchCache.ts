import { trainsService, type TrainSearchResult } from './trainsService';

/**
 * Caché en memoria de las búsquedas (origen + destino + día), compartida por toda la visita.
 * Los horarios son estáticos (GTFS), así que un día ya consultado se vuelve a mostrar al
 * instante, y el día siguiente se precarga en segundo plano: pasar de día no espera a la red.
 * Nunca se duplica una petición en curso y los errores no se guardan.
 */
const MAX_ENTRIES = 40;
const cache = new Map<string, TrainSearchResult[]>();
const inflight = new Map<string, Promise<TrainSearchResult[]>>();

export const searchKey = (origin: string, destination: string, date: string) => `${origin}|${destination}|${date}`;

/** La API devuelve como mucho esta cantidad de trenes por petición (los primeros desde startTime) */
const API_PAGE = 15;
const MAX_PAGES = 12;

/** "7:20:00" → "07:20:00" (la API mezcla horas con y sin cero delante) */
const padTime = (t: string) => (t.length === 7 ? `0${t}` : t);

/**
 * Todos los trenes del día. La API corta en 15 resultados, así que se pide por tandas: cada una
 * desde la última hora recibida (startTime incluye esa hora, los repetidos se quitan por tripId)
 * hasta que llega una tanda incompleta. Sin esto, en trayectos con muchos trenes la tarde no
 * aparecía nunca.
 */
async function searchAllTrains(origin: string, destination: string, date: string): Promise<TrainSearchResult[]> {
  const byId = new Map<string, TrainSearchResult>();
  let start: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await trainsService.searchTrains(origin, destination, date, start);
    for (const t of batch) byId.set(t.tripId, t);
    if (batch.length < API_PAGE) break;
    const last = batch.map((t) => padTime(t.departureTime)).sort().at(-1)!;
    if (start && last <= start) {
      // Más de 15 trenes a la misma hora: se avanza un minuto para no repetir la tanda
      const [h, m] = last.split(':').map(Number);
      const next = h * 60 + m + 1;
      start = `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}:00`;
    } else {
      start = last;
    }
  }
  return [...byId.values()];
}

export const getCachedSearch = (key: string) => cache.get(key);

export function fetchSearch(origin: string, destination: string, date: string): Promise<TrainSearchResult[]> {
  const key = searchKey(origin, destination, date);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  let p = inflight.get(key);
  if (!p) {
    p = searchAllTrains(origin, destination, date)
      .then((trains) => {
        cache.set(key, trains);
        // Tope de entradas: se va la más antigua (un Map conserva el orden de inserción)
        if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
        return trains;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, p);
  }
  return p;
}

/** Precarga silenciosa (p. ej. el día siguiente) */
export const prefetchSearch = (origin: string, destination: string, date: string) => {
  if (!cache.has(searchKey(origin, destination, date))) fetchSearch(origin, destination, date).catch(() => {});
};
