/**
 * Preferencias del visitante guardadas solo en este navegador (no hay cuentas de usuario).
 * Todo va en try/catch: en modo privado o con el almacenamiento bloqueado, la web funciona igual
 * con los valores por defecto.
 */

export interface Preferences {
  /** Tema elegido; si no hay, se sigue el del sistema */
  theme: 'light' | 'dark';
  /** Panel "en directo" del mapa */
  mapLegend: 'visible' | 'hidden';
}

const PREFIX = 'pref:';
const KEYS: (keyof Preferences)[] = ['theme', 'mapLegend'];

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
}

/** Borra todas las preferencias guardadas */
export function clearPrefs() {
  try {
    for (const k of KEYS) localStorage.removeItem(PREFIX + k);
  } catch {
    /* nada que borrar */
  }
}

export const systemPrefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
