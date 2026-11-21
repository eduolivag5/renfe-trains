import { PREFS_EVENT, TRIP_KEYS } from './preferences';

/**
 * Trayectos guardados en este navegador: los últimos buscados y los marcados como favoritos.
 * Solo se guarda el par de estaciones (sin fecha): al pulsarlos se buscan los trenes de hoy.
 * Mismo almacenamiento y mismo evento que las preferencias, así "Borrar preferencias" los
 * limpia y los componentes abiertos se actualizan al momento (ver useSavedTrips).
 */

export interface SavedTrip {
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
}

const MAX_RECENT = 6;
const MAX_FAVORITES = 8;

const sameTrip = (a: Pick<SavedTrip, 'origin' | 'destination'>, b: Pick<SavedTrip, 'origin' | 'destination'>) =>
  a.origin === b.origin && a.destination === b.destination;

/* Lectura cacheada por texto: useSyncExternalStore necesita la misma referencia si nada cambia */
const cache = new Map<string, { raw: string | null; value: SavedTrip[] }>();

function read(key: string): SavedTrip[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    /* sin almacenamiento */
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value;
  let value: SavedTrip[] = [];
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed.filter((t) => t && t.origin && t.destination);
  } catch {
    /* dato corrupto: se ignora */
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, trips: SavedTrip[]) {
  try {
    localStorage.setItem(key, JSON.stringify(trips));
  } catch {
    /* sin almacenamiento: dura solo esta visita */
  }
  window.dispatchEvent(new Event(PREFS_EVENT));
}

export const getRecentTrips = () => read(TRIP_KEYS.recent);
export const getFavoriteTrips = () => read(TRIP_KEYS.favorites);

/** Apunta una búsqueda como la más reciente (sin duplicados) */
export function addRecentTrip(trip: SavedTrip) {
  const current = getRecentTrips();
  if (current[0] && sameTrip(current[0], trip)) return; // ya es la más reciente
  write(TRIP_KEYS.recent, [trip, ...current.filter((t) => !sameTrip(t, trip))].slice(0, MAX_RECENT));
}

export function clearRecentTrips() {
  write(TRIP_KEYS.recent, []);
}

export const isFavoriteTrip = (trip: Pick<SavedTrip, 'origin' | 'destination'>) =>
  getFavoriteTrips().some((t) => sameTrip(t, trip));

/** Añade o quita un favorito; devuelve si queda guardado */
export function toggleFavoriteTrip(trip: SavedTrip): boolean {
  const current = getFavoriteTrips();
  if (current.some((t) => sameTrip(t, trip))) {
    write(TRIP_KEYS.favorites, current.filter((t) => !sameTrip(t, trip)));
    return false;
  }
  write(TRIP_KEYS.favorites, [trip, ...current].slice(0, MAX_FAVORITES));
  return true;
}

export function removeFavoriteTrip(trip: Pick<SavedTrip, 'origin' | 'destination'>) {
  write(TRIP_KEYS.favorites, getFavoriteTrips().filter((t) => !sameTrip(t, trip)));
}
