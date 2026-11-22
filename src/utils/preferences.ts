/**
 * Preferencias del visitante guardadas solo en este navegador (no hay cuentas de usuario).
 * Todo va en try/catch: en modo privado o con el almacenamiento bloqueado, la web funciona igual
 * con los valores por defecto.
 * Cada cambio emite PREFS_EVENT para que los componentes abiertos (p. ej. el contador de avisos)
 * se actualicen al momento sin recargar (ver usePref).
 */

export interface Preferences {
  /** Tema elegido; si no hay, se sigue el del sistema */
  theme: 'light' | 'dark';
  /** Panel "en directo" del mapa */
  mapLegend: 'visible' | 'hidden';
  /** Núcleo de Cercanías/Rodalies del usuario ("10" = Madrid…): personaliza los avisos */
  nucleo: string;
}

const PREFIX = 'pref:';
const KEYS: (keyof Preferences)[] = ['theme', 'mapLegend', 'nucleo'];

/** Trayectos recientes y favoritos (JSON, ver savedTrips.ts); se borran con el resto */
export const TRIP_KEYS = { recent: `${PREFIX}recentTrips`, favorites: `${PREFIX}favoriteTrips` } as const;

export const PREFS_EVENT = 'prefs-change';
const notify = () => {
  try {
    window.dispatchEvent(new Event(PREFS_EVENT));
  } catch {
    /* sin window (no debería pasar en el navegador) */
  }
};

export function getPref<K extends keyof Preferences>(key: K): Preferences[K] | null {
  try {
    return (localStorage.getItem(PREFIX + key) as Preferences[K] | null) ?? null;
  } catch {
    return null;
  }
}

export function setPref<K extends keyof Preferences>(key: K, value: Preferences[K]) {
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    /* sin almacenamiento: la preferencia dura solo esta visita */
  }
  notify();
}

export function removePref(key: keyof Preferences) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* nada que borrar */
  }
  notify();
}

/** Borra todas las preferencias guardadas */
export function clearPrefs() {
  try {
    for (const k of KEYS) localStorage.removeItem(PREFIX + k);
    for (const k of Object.values(TRIP_KEYS)) localStorage.removeItem(k);
    localStorage.removeItem(SORT_KEY);
    for (const k of Object.keys(localStorage)) if (k.startsWith(FILTERS_PREFIX)) localStorage.removeItem(k);
  } catch {
    /* nada que borrar */
  }
  notify();
}

/* ------------------------------------------------------------------ */
/* Orden y filtros de los resultados                                   */
/* ------------------------------------------------------------------ */

export type ResultsSort = 'departure' | 'duration';

/** Filtros que se recuerdan por trayecto ("Ya han salido" no: depende de la hora) */
export interface RouteFilters {
  types: string[];
  periods: string[];
  families: string[];
  maxDuration: number | null;
}

/** Orden preferido: uno para todos los trayectos */
const SORT_KEY = `${PREFIX}resultsSort`;
/** Filtros de cada trayecto: pref:filters:<origen>|<destino> */
const FILTERS_PREFIX = `${PREFIX}filters:`;

export function getResultsSort(): ResultsSort {
  try {
    return localStorage.getItem(SORT_KEY) === 'duration' ? 'duration' : 'departure';
  } catch {
    return 'departure';
  }
}

export function setResultsSort(sort: ResultsSort) {
  try {
    localStorage.setItem(SORT_KEY, sort);
  } catch {
    /* sin almacenamiento */
  }
}

export function getRouteFilters(route: string): RouteFilters | null {
  try {
    const raw = localStorage.getItem(FILTERS_PREFIX + route);
    if (!raw) return null;
    const f = JSON.parse(raw);
    return {
      types: Array.isArray(f.types) ? f.types : [],
      periods: Array.isArray(f.periods) ? f.periods : [],
      families: Array.isArray(f.families) ? f.families : [],
      maxDuration: typeof f.maxDuration === 'number' ? f.maxDuration : null,
    };
  } catch {
    return null;
  }
}

/** Guarda los filtros del trayecto; sin ninguno activo, se borra la entrada */
export function setRouteFilters(route: string, f: RouteFilters) {
  try {
    const empty = !f.types.length && !f.periods.length && !f.families.length && f.maxDuration === null;
    if (empty) localStorage.removeItem(FILTERS_PREFIX + route);
    else localStorage.setItem(FILTERS_PREFIX + route, JSON.stringify(f));
  } catch {
    /* sin almacenamiento */
  }
}

export const systemPrefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
