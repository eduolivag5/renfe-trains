import { useSyncExternalStore } from 'react';
import { getPref, PREFS_EVENT, type Preferences } from '../utils/preferences';

const subscribe = (onChange: () => void) => {
  window.addEventListener(PREFS_EVENT, onChange);
  window.addEventListener('storage', onChange); // cambios hechos en otra pestaña
  return () => {
    window.removeEventListener(PREFS_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
};

/** Valor actual de una preferencia; se actualiza al cambiarla desde cualquier parte de la web */
export function usePref<K extends keyof Preferences>(key: K): Preferences[K] | null {
  return useSyncExternalStore(subscribe, () => getPref(key));
}
