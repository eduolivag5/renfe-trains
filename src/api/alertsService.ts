const API_BASE_URL = import.meta.env.VITE_API_URL;

/** Aviso de servicio tal como lo devuelve la API (endpoints del backend /alertas y /alertas/linea/{route_id}) */
export interface ServiceAlert {
  id: number;
  alertId: string; // "INFO_526465", "AVISO_526197"…
  descripcion: string;
  fechaInicio: string; // ISO local
  ultimaActualizacion: string;
  /** route_id GTFS de las líneas afectadas: "10T0110C9" (núcleo 10, línea C9) */
  routeIds: string[];
}

/** Lo mínimo que necesitamos del tren para encontrar sus avisos */
export interface AlertLookup {
  tripId: string;
  /** Tipo / línea: "C5", "R4", "AVE"… */
  tipo: string;
  /** route_id del detalle del viaje, si lo hay */
  routeId?: string | null;
}

const CACHE_MS = 2 * 60_000;
let allCache: { at: number; promise: Promise<ServiceAlert[]> } | null = null;

/**
 * Todos los avisos actuales (una sola petición compartida y cacheada 2 min).
 * `force` ignora la caché (botón "Actualizar") y la renueva para el resto de componentes.
 */
export function getAllAlerts(force = false): Promise<ServiceAlert[]> {
  if (!force && allCache && Date.now() - allCache.at < CACHE_MS) return allCache.promise;
  const promise = fetch(`${API_BASE_URL}/alertas`)
    .then((r) => {
      if (!r.ok) throw new Error('Error al obtener los avisos');
      return r.json() as Promise<ServiceAlert[]>;
    })
    .catch((e) => {
      allCache = null; // no cachear errores
      throw e;
    });
  allCache = { at: Date.now(), promise };
  return promise;
}

/** Avisos de una línea concreta por su route_id GTFS */
export async function getAlertsByLine(routeId: string): Promise<ServiceAlert[]> {
  const r = await fetch(`${API_BASE_URL}/alertas/linea/${encodeURIComponent(routeId)}`);
  if (!r.ok) throw new Error('Error al obtener los avisos de la línea');
  return r.json();
}

/** route_id GTFS de Cercanías/Rodalies: núcleo (2 dígitos) + "T" + variante (4) + línea */
const GTFS_ROUTE = /^(\d{2})T\d{4}(.+)$/i;
/** Líneas locales: C1, C4a, R2N, RG1, T1… */
const LOCAL_LINE = /^(C|R|T)[A-Z]*\d/i;

/**
 * Avisos que afectan al tren.
 * - Si su routeId ya viene en formato GTFS, se consulta /alertas/linea/{routeId}.
 * - Si no (hoy el detalle devuelve el nº de tren o null), se cruza núcleo + línea con /alertas:
 *   el tripId de Cercanías/Rodalies empieza por el código de núcleo ("1019L20869C5" → 10)
 *   y el tipo es la línea ("C5"), igual que en el route_id del aviso ("10T0110C5").
 */
export async function getAlertsForTrain(lookup: AlertLookup): Promise<ServiceAlert[]> {
  if (lookup.routeId && GTFS_ROUTE.test(lookup.routeId)) return getAlertsByLine(lookup.routeId);
  const all = await getAllAlerts();
  return all.filter(alertMatcher(lookup));
}

/**
 * Comprobador "¿este aviso afecta a este tren?" sin pedir nada a la API (para cruzar muchos
 * trenes con /alertas de una vez, p. ej. en los resultados de búsqueda): mismo núcleo + línea,
 * o el mismo route_id si se conoce.
 */
export function alertMatcher({ tripId, tipo, routeId }: AlertLookup): (a: ServiceAlert) => boolean {
  const line = tipo.trim().toUpperCase();
  const nucleus = /^\d{2}/.test(tripId) ? tripId.slice(0, 2) : null;
  const local = LOCAL_LINE.test(line) && nucleus;
  if (!local && !routeId) return () => false;

  return (a) =>
    (a.routeIds ?? []).some((rid) => {
      if (routeId && rid === routeId) return true;
      if (!local) return false;
      const m = rid.match(GTFS_ROUTE);
      return !!m && m[1] === nucleus && m[2].toUpperCase() === line;
    });
}

/** Aviso (incidencia) frente a información */
export const isWarningAlert = (a: ServiceAlert) => a.alertId.startsWith('AVISO');

/** Texto limpio: sin saltos de línea finales ni el "(-)" que añade la fuente */
export const cleanAlertText = (s: string) => s.replace(/\s*\(-\)\s*$/, '').trim();
