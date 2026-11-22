import { parse, differenceInMinutes } from 'date-fns';

/**
 * Iconos de línea (public/new_icons). Agrupaciones:
 *  - AVE ← AVE, AVE INT, Euromed
 *  - Intercity ← Intercity, Alvia
 *  - Regional ← Media Distancia, Proximidad, Regional, Regional Exprés
 *  - Avlo, Avant y Cercanías mantienen su propio icono
 * `monoDark`: el logo es azul marino y se pasa a blanco en modo oscuro.
 */
export const TRAIN_LOGOS: Record<string, { src: string; monoDark?: boolean }> = {
  AVE: { src: '/new_icons/ave.svg', monoDark: true },
  AVLO: { src: '/new_icons/avlo.svg', monoDark: true },
  AVANT: { src: '/new_icons/avant-transparent.png', monoDark: true },
  INTERCITY: { src: '/new_icons/intercity.svg' },
  REGIONAL: { src: '/new_icons/regional.svg' },
  CERCANIAS: { src: '/new_icons/cercanias.svg' },
};

export const FALLBACK_LOGO = '/icons/Renfe.svg';

export const getTrainLogo = (logo: string) => TRAIN_LOGOS[logo] ?? { src: FALLBACK_LOGO };

export const TRAIN_BRAND_MAP: Record<string, { logo: string; color: string }> = {
  'AVE': { logo: 'AVE', color: '#002147' },
  'AVE INT': { logo: 'AVE', color: '#002147' },
  'EUROMED': { logo: 'AVE', color: '#002147' },
  'AVLO': { logo: 'AVLO', color: '#4d148c' },
  'AVANT': { logo: 'AVANT', color: '#ee7b10' },
  'AVANT EXP': { logo: 'AVANT', color: '#ee7b10' },
  'ALVIA': { logo: 'INTERCITY', color: '#002147' },
  'INTERCITY': { logo: 'INTERCITY', color: '#002147' },
  'MD': { logo: 'REGIONAL', color: '#ee7b10' },
  'REGIONAL': { logo: 'REGIONAL', color: '#ee7b10' },
  'REG.EXP.': { logo: 'REGIONAL', color: '#ee7b10' },
  'PROXIMIDAD': { logo: 'REGIONAL', color: '#ee7b10' },
  'BUS': { logo: 'BUS', color: '#333333' },
  'TRENCELTA': { logo: 'TRENCELTA', color: '#002147' },
};

export const getTrainIdentity = (type: string) => {
  if (TRAIN_BRAND_MAP[type]) return TRAIN_BRAND_MAP[type];
  if (type.toUpperCase().includes('EUROMED')) return TRAIN_BRAND_MAP['EUROMED'];
  if (type.startsWith('C')) return { logo: 'CERCANIAS', color: '#e30613' };
  if (/^(R|RT|RG|RL)/.test(type)) return { logo: 'CERCANIAS', color: '#ee7b10' };
  return { logo: 'GENERIC', color: '#002147' };
};

/* ------------------------------------------------------------------ */
/* Familias de trenes                                                  */
/* ------------------------------------------------------------------ */

export type TrainFamilyKey = 'ALTA_VELOCIDAD' | 'MEDIA_LARGA' | 'METROPOLITANA';

export const TRAIN_FAMILIES: Record<TrainFamilyKey, { name: string; color: string }> = {
  ALTA_VELOCIDAD: { name: 'Alta velocidad', color: '#0b3a6e' },
  MEDIA_LARGA: { name: 'Media y larga distancia', color: '#5B064B' },
  METROPOLITANA: { name: 'Movilidad metropolitana', color: '#F4323F' },
};

const LOGO_FAMILY: Record<string, TrainFamilyKey> = {
  AVE: 'ALTA_VELOCIDAD',
  AVLO: 'ALTA_VELOCIDAD',
  AVANT: 'ALTA_VELOCIDAD',
  INTERCITY: 'MEDIA_LARGA',
  REGIONAL: 'MEDIA_LARGA',
  TRENCELTA: 'MEDIA_LARGA',
  CERCANIAS: 'METROPOLITANA',
};

/** Líneas de Rodalies (R1, R2N, RG1, RL3, RT1, T1…). "REGIONAL" y "REG.EXP." no coinciden. */
export const isRodalies = (tipo: string) => /^(R\d|RG\d|RL\d|RT\d|T\d)/i.test(tipo.trim());

/**
 * Identidad de un tren del mapa a partir de su `tipo` GTFS (C4, AVE, Intercity, MD…):
 * logo nuevo, familia a la que pertenece y si hay que mostrar el código (línea o subtipo).
 */
export const getMapTrainInfo = (tipo: string) => {
  const key = tipo.trim().toUpperCase();
  const logoKey = key === 'PROXIMDAD' ? 'REGIONAL' : getTrainIdentity(key).logo;
  const familyKey = LOGO_FAMILY[logoKey];

  return {
    logo: getTrainLogo(logoKey),
    family: familyKey ? TRAIN_FAMILIES[familyKey] : null,
    /** Código extra cuando el logo no lo dice todo (p. ej. "C4", "ALVIA", "MD") */
    code: key === logoKey ? null : tipo.trim(),
  };
};

/**
 * Quita trenes repetidos. El GTFS de larga distancia trae a veces el mismo tren dos veces con
 * calendarios distintos ("0312312026-11-20" y "0312322026-11-20": mismo nº de tren 03123, otro
 * sufijo): mismo tipo, misma salida y misma llegada. Se queda el primero.
 */
export const dedupeTrains = <T extends { trainType: string; departureTime: string; arrivalTime: string }>(trains: T[]): T[] => {
  const seen = new Set<string>();
  return trains.filter((t) => {
    const key = `${t.trainType.trim().toUpperCase()}|${t.departureTime}|${t.arrivalTime}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** tripId de larga distancia: nº de tren (5) + sufijo (1) + fecha de inicio del calendario */
const LONG_DISTANCE_ID = /^\d{6}\d{4}-\d{2}-\d{2}$/;

/**
 * ¿Es el mismo tren un resultado de búsqueda y uno del mapa en directo?
 * - Cercanías/Rodalies: el tripId es idéntico en los dos sitios.
 * - Larga distancia: el tripId cambia (sufijo y fecha), pero empieza por el nº de tren, que es
 *   también el vehicleId del mapa.
 */
export const isSameTrip = (searchTripId: string, live: { tripId: string; vehicleId: string }) =>
  searchTripId === live.tripId ||
  (LONG_DISTANCE_ID.test(searchTripId) && LONG_DISTANCE_ID.test(live.tripId) && searchTripId.slice(0, 5) === live.vehicleId);

export const processTrainData =(trains: any[]) => {
  if (trains.length === 0) return [];
  const withDuration = trains.map(train => {
    const start = parse(train.departureTime, 'HH:mm:ss', new Date());
    const end = parse(train.arrivalTime, 'HH:mm:ss', new Date());
    let diff = differenceInMinutes(end, start);
    if (diff < 0) diff += 1440;
    return { ...train, durationMin: diff };
  });
  const minDur = Math.min(...withDuration.map(t => t.durationMin));
  return withDuration.map(t => ({
    ...t,
    isFastest: t.durationMin === minDur && withDuration.length > 1
  }));
};
/** "HH:mm[:ss]" → minutos desde medianoche (GTFS admite horas ≥ 24) */
export const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** Cuenta atrás: 12 → "12 min", 75 → "1 h 15 min" */
export const formatCountdown = (min: number) => (min < 60 ? `${Math.max(0, min)} min` : formatDuration(min));

/** Retraso legible: 0 → "Puntual", 4 → "+4 min", -1 → "-1 min" */
export const formatDelay = (delay: number) => (delay === 0 ? 'Puntual' : `${delay > 0 ? '+' : ''}${delay} min`);

/** 197 → "3 h 17 min" */
export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
};

/**
 * Hora legible "HH:MM" a partir de cualquier formato que devuelva la API:
 * "7:20", "7:20:00", "07:20:", "25:10:00" (GTFS, día siguiente → 01:10). Nunca termina en ":".
 */
export const formatClock = (t?: string | null) => {
  const match = t?.match(/(\d{1,2}):(\d{1,2})/);
  if (!match) return '--:--';
  const h = Number(match[1]) % 24;
  return `${String(h).padStart(2, '0')}:${match[2].padStart(2, '0')}`;
};

/**
 * Paradas intermedias: no cuentan ni la estación de origen ni la de destino.
 * Recibe el nº total de estaciones del recorrido.
 */
export const intermediateStops = (totalStations: number) => Math.max(0, totalStations - 2);

/** "Sin paradas", "1 parada", "5 paradas" */
export const stopsLabel = (n: number) => (n === 0 ? 'Sin paradas' : n === 1 ? '1 parada' : `${n} paradas`);

/**
 * Texto del tipo de tren solo cuando el logo no lo dice ya: Alvia (logo Intercity),
 * MD (logo Regional), Avant Exprés, líneas de Cercanías (C4…). Para AVE, AVLO, Avant,
 * Intercity o Regional devuelve null porque el logo basta.
 */
export const trainTypeHint = (trainType: string) => {
  const key = trainType.trim().toUpperCase();
  return getTrainIdentity(key).logo === key ? null : trainType.trim();
};
