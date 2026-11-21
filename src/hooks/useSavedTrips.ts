import { useSyncExternalStore } from 'react';
import { PREFS_EVENT } from '../utils/preferences';
import { getFavoriteTrips, getRecentTrips } from '../utils/savedTrips';

const subscribe = (onChange: () => void) => {
  window.addEventListener(PREFS_EVENT, onChange);
  window.addEventListener('storage', onChange); // cambios hechos en otra pestaña
  return () => {
    window.removeEventListener(PREFS_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
};

/** Trayectos recientes y favoritos; se actualizan al cambiar desde cualquier parte de la web */
export function useSavedTrips() {
  const recent = useSyncExternalStore(subscribe, getRecentTrips);
  const favorites = useSyncExternalStore(subscribe, getFavoriteTrips);
  return { recent, favorites };
}
