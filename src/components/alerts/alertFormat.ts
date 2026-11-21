import type { ServiceAlert } from '../../api/alertsService';

/**
 * Núcleos de Cercanías/Rodalies según el prefijo del route_id GTFS ("10T0110C9" → 10).
 * Lista completa sacada de routes.txt del GTFS de Cercanías de Renfe (fomento_transit.zip).
 * 45, 46 y 47 son las antiguas líneas de ancho métrico (ex-FEVE).
 */
const NETWORK_NAMES: Record<string, string> = {
  '10': 'Madrid',
  '20': 'Asturias',
  '30': 'Sevilla',
  '31': 'Cádiz',
  '32': 'Málaga',
  '40': 'Valencia',
  '41': 'Murcia / Alicante',
  '45': 'Cartagena',
  '46': 'Ferrol',
  '47': 'León',
  '51': 'Rodalies Catalunya',
  '60': 'Bilbao',
  '61': 'San Sebastián',
  '62': 'Santander',
  '70': 'Zaragoza',
};

/** Todos los núcleos [código, nombre], por orden alfabético (índice estático de la home) */
export const NETWORK_LIST = Object.entries(NETWORK_NAMES).sort(([, a], [, b]) => a.localeCompare(b, 'es'));

export const GENERAL_KEY = 'general';

/** ¿Afecta el aviso al núcleo? (por los route_id de sus líneas) */
export const alertInNetwork = (alert: ServiceAlert, code: string) =>
  (alert.routeIds ?? []).some((rid) => rid.match(GTFS_ROUTE)?.[1] === code);

export const networkName = (code: string) =>
  code === GENERAL_KEY ? 'Generales' : (NETWORK_NAMES[code] ?? `Núcleo ${code}`);

const GTFS_ROUTE = /^(\d{2})T\d{4}(.+)$/i;

/** Núcleo de Rodalies de Catalunya: el resto de núcleos son Cercanías */
export const RODALIES_NETWORK = '51';

export type AlertService = 'CERCANIAS' | 'RODALIES';

/** Servicios a los que afecta el aviso según sus núcleos (vacío si es un aviso general) */
const servicesOf = (networks: string[]): AlertService[] => {
  const s: AlertService[] = [];
  if (networks.some((n) => n !== GENERAL_KEY && n !== RODALIES_NETWORK)) s.push('CERCANIAS');
  if (networks.includes(RODALIES_NETWORK)) s.push('RODALIES');
  return s;
};

export interface AlertView {
  alert: ServiceAlert;
  /** Núcleos afectados (o [GENERAL_KEY] si el aviso no indica líneas) */
  networks: string[];
  /** Cercanías y/o Rodalies, para mostrar su logo */
  services: AlertService[];
  /** Líneas únicas y ordenadas: "C1", "R2N"… */
  lines: string[];
  /** Líneas afectadas en cada núcleo ({"10": ["C1", "C10"]}): "C1" de Madrid ≠ "C1" de Sevilla */
  linesByNetwork: Record<string, string[]>;
  start: Date | null;
  /** Empieza más adelante (p. ej. una huelga anunciada para mañana) */
  upcoming: boolean;
  isWarning: boolean;
}

export const lineSort = (a: string, b: string) => a.localeCompare(b, 'es', { numeric: true });

export function toAlertView(alert: ServiceAlert, now = Date.now()): AlertView {
  const networks = new Set<string>();
  const lines = new Set<string>();
  const byNetwork = new Map<string, Set<string>>();
  for (const rid of alert.routeIds ?? []) {
    const m = rid.match(GTFS_ROUTE);
    if (!m) continue;
    const line = m[2].toUpperCase();
    networks.add(m[1]);
    lines.add(line);
    if (!byNetwork.has(m[1])) byNetwork.set(m[1], new Set());
    byNetwork.get(m[1])!.add(line);
  }
  const d = new Date(alert.fechaInicio);
  const start = Number.isNaN(d.getTime()) ? null : d;
  const networkList = networks.size ? [...networks].sort() : [GENERAL_KEY];
  return {
    alert,
    networks: networkList,
    services: servicesOf(networkList),
    lines: [...lines].sort(lineSort),
    linesByNetwork: Object.fromEntries([...byNetwork].map(([n, ls]) => [n, [...ls].sort(lineSort)])),
    start,
    upcoming: !!start && start.getTime() > now,
    isWarning: alert.alertId.startsWith('AVISO'),
  };
}

/** Más recientes primero; las programadas (futuras) encabezan la lista */
export const sortAlertViews = (views: AlertView[]) =>
  [...views].sort((a, b) => (b.start?.getTime() ?? 0) - (a.start?.getTime() ?? 0));

export const formatAlertDate = (iso: string | Date) => {
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        // el año solo si no es el actual
        ...(d.getFullYear() !== new Date().getFullYear() && { year: 'numeric' }),
        hour: '2-digit',
        minute: '2-digit',
      });
};

/** "hace 5 min", "hace 3 h", "en 12 h"… para la fecha de inicio */
export function relativeTime(d: Date, now = Date.now()): string {
  const diff = d.getTime() - now;
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  const fmt = (v: string) => (diff > 0 ? `en ${v}` : `hace ${v}`);
  if (min < 1) return 'ahora';
  if (min < 60) return fmt(`${min} min`);
  const h = Math.round(min / 60);
  if (h < 24) return fmt(`${h} h`);
  const days = Math.round(h / 24);
  if (days < 30) return fmt(`${days} ${days === 1 ? 'día' : 'días'}`);
  return formatAlertDate(d);
}
