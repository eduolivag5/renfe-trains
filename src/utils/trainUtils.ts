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