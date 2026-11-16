import type { ServiceAlert } from '../../api/alertsService';

/** Núcleos de Cercanías/Rodalies según el prefijo del route_id GTFS ("10T0110C9" → 10) */
const NETWORK_NAMES: Record<string, string> = {
  '10': 'Madrid',
  '20': 'Asturias',
  '30': 'Sevilla',
  '31': 'Cádiz',
  '32': 'Málaga',
  '40': 'Valencia',
  '41': 'Murcia / Alicante',
  '51': 'Rodalies Catalunya',
  '60': 'Bilbao',
  '61': 'San Sebastián',
  '62': 'Santander',
};

export const GENERAL_KEY = 'general';

export const networkName = (code: string) =>
  code === GENERAL_KEY ? 'Generales' : (NETWORK_NAMES[code] ?? `Núcleo ${code}`);

const GTFS_ROUTE = /^(\d{2})T\d{4}(.+)$/i;

export interface AlertView {
  alert: ServiceAlert;
  /** Núcleos afectados (o [GENERAL_KEY] si la alerta no indica líneas) */
  networks: string[];
  /** Líneas únicas y ordenadas: "C1", "R2N"… */
  lines: string[];
  start: Date | null;
  /** Empieza más adelante (p. ej. una huelga anunciada para mañana) */
  upcoming: boolean;
  isWarning: boolean;
}

const lineSort = (a: string, b: string) => a.localeCompare(b, 'es', { numeric: true });

export function toAlertView(alert: ServiceAlert, now = Date.now()): AlertView {
  const networks = new Set<string>();
  const lines = new Set<string>();
  for (const rid of alert.routeIds ?? []) {
    const m = rid.match(GTFS_ROUTE);
    if (!m) continue;
    networks.add(m[1]);
    lines.add(m[2].toUpperCase());
  }
  const d = new Date(alert.fechaInicio);
  const start = Number.isNaN(d.getTime()) ? null : d;
  return {
    alert,
    networks: networks.size ? [...networks].sort() : [GENERAL_KEY],
    lines: [...lines].sort(lineSort),
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
