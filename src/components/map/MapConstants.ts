// components/map/MapConstants.ts
import { isRodalies } from '../../utils/trainUtils';

export const COLORS = {
  // Colores por categoría de tren
  cercanias: '#ef2c30',      // Rojo Cercanías
  rodalies: '#f47216',       // Naranja Rodalies
  altaVelocidad: '#0b3a6e',  // Azul marino · AVE / AVLO / Avant / Alvia / Euromed
  mediaDistancia: '#808080', // MD / Regional / Intercity
  otros: '#0d9488',          // Verde azulado · Bus y resto
} as const;

const ALTA_VELOCIDAD = new Set(['AVE', 'AVE INT', 'AVLO', 'ALVIA', 'AVANT', 'AVANT EXP', 'EUROMED']);
const MEDIA_DISTANCIA = new Set(['MEDIA_LARGA_DISTANCIA', 'MD','REGIONAL', 'REG.EXP.', 'PROXIMDAD', 'PROXIMIDAD', 'INTERCITY', 'TRENCELTA']);

/** Color del marcador según el `tipo` GTFS del tren (mismas agrupaciones que la leyenda) */
export const getTrainColor = (tipo: string): string => {
  const key = tipo.trim().toUpperCase();
  if (/^C\d/.test(key)) return COLORS.cercanias;
  if (isRodalies(key)) return COLORS.rodalies;
  if (ALTA_VELOCIDAD.has(key)) return COLORS.altaVelocidad;
  if (MEDIA_DISTANCIA.has(key)) return COLORS.mediaDistancia;
  return COLORS.otros;
};

/** Ciudades de referencia. tier 1 siempre visibles; tier 2 al acercarse. [nombre, lon, lat, tier] */
export const CITIES: [string, number, number, 1 | 2][] = [
  ['Madrid', -3.7038, 40.4168, 1],
  ['Barcelona', 2.1686, 41.3874, 1],
  ['Valencia', -0.3763, 39.4699, 1],
  ['Sevilla', -5.9845, 37.3891, 1],
  ['Zaragoza', -0.8891, 41.6488, 1],
  ['Málaga', -4.4214, 36.7213, 1],
  ['Bilbao', -2.935, 43.263, 1],
  ['A Coruña', -8.4115, 43.3623, 1],
  ['Valladolid', -4.7245, 41.6523, 1],
  ['Murcia', -1.1307, 37.9922, 1],
  ['Alicante', -0.481, 38.3452, 2],
  ['Córdoba', -4.7794, 37.8882, 2],
  ['Granada', -3.5986, 37.1773, 2],
  ['Vigo', -8.7207, 42.2406, 2],
  ['Oviedo', -5.8494, 43.3614, 2],
  ['Gijón', -5.6611, 43.5322, 2],
  ['Santander', -3.81, 43.4623, 2],
  ['San Sebastián', -1.9812, 43.3183, 2],
  ['Pamplona', -1.6458, 42.8125, 2],
  ['Salamanca', -5.6635, 40.9701, 2],
  ['Badajoz', -6.9707, 38.8794, 2],
  ['Cádiz', -6.2886, 36.5271, 2],
  ['Almería', -2.4637, 36.834, 2],
  ['Tarragona', 1.2445, 41.1189, 2],
  ['Girona', 2.8214, 41.9794, 2],
  ['Lleida', 0.62, 41.6176, 2],
  ['León', -5.5671, 42.5987, 2],
  ['Burgos', -3.6969, 42.3439, 2],
  ['Toledo', -4.0273, 39.8628, 2],
  ['Cáceres', -6.3724, 39.4753, 2],
  ['Huelva', -6.9447, 37.2614, 2],
  ['Logroño', -2.445, 42.4627, 2],
  ['Vitoria', -2.6716, 42.8467, 2],
  ['Santiago', -8.5448, 42.8782, 2],
  ['Albacete', -1.8585, 38.9943, 2],
  ['Castellón', -0.0513, 39.9864, 2],
  ['Jaén', -3.7849, 37.7796, 2],
  ['Ciudad Real', -3.9274, 38.9848, 2],
  ['Guadalajara', -3.1667, 40.6333, 2],
  ['Segovia', -4.1088, 40.9429, 2],
  ['Ourense', -7.8639, 42.3358, 2],
  ['Lugo', -7.556, 43.0097, 2],
  ['Huesca', -0.4089, 42.1401, 2],
  ['Teruel', -1.1065, 40.3456, 2],
  ['Cuenca', -2.1374, 40.0704, 2],
  ['Zamora', -5.7468, 41.5034, 2],
  ['Palencia', -4.5288, 42.0095, 2],
  ['Soria', -2.4649, 41.7636, 2],
  ['Ávila', -4.6812, 40.6567, 2],
  ['Pontevedra', -8.6444, 42.431, 2],
];

/** Paleta del mapa por tema */
export const MAP_THEME = {
  light: {
    sea: '#e8eef6',
    neighbor: '#dde4ee',
    land: '#ffffff',
    provinceBorder: '#d6dde8',
    coast: '#c3cddb',
    cityDot: '#64748b',
    cityText: '#475569',
    halo: 'rgba(255,255,255,0.92)',
    trainText: '#1e1b4b',
    clusterFill: '#ffffff',
    clusterText: '#0f172a',
    clusterHalo: 'rgba(15,23,42,0.10)',
    spiderBackdrop: '#f8fafc',
    spiderRing: '#cbd5e1',
    spiderShadow: 'rgba(15,23,42,0.12)',
    tooltipBg: '#0f172a',
    tooltipText: '#ffffff',
  },
  dark: {
    sea: '#020617',
    neighbor: '#0a1122',
    land: '#0f172a',
    provinceBorder: '#253149',
    coast: '#2a3650',
    cityDot: '#94a3b8',
    cityText: '#cbd5e1',
    halo: 'rgba(2,6,23,0.9)',
    trainText: '#c4b5fd',
    clusterFill: '#0f172a',
    clusterText: '#ffffff',
    clusterHalo: 'rgba(255,255,255,0.10)',
    spiderBackdrop: '#0f172a',
    spiderRing: 'rgba(148,163,184,0.35)',
    spiderShadow: 'rgba(0,0,0,0.45)',
    tooltipBg: '#ffffff',
    tooltipText: '#0f172a',
  },
} as const;
