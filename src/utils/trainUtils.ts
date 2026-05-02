import { parse, differenceInMinutes } from 'date-fns';

export const TRAIN_BRAND_MAP: Record<string, { logo: string; color: string }> = {
  'AVE': { logo: 'AVE', color: '#002147' },
  'AVE INT': { logo: 'AVE', color: '#002147' },
  'AVLO': { logo: 'AVLO', color: '#4d148c' },
  'ALVIA': { logo: 'ALVIA', color: '#002147' },
  'EUROMED': { logo: 'EUROMED', color: '#002147' },
  'INTERCITY': { logo: 'INTERCITY', color: '#002147' },
  'AVANT': { logo: 'AVANT', color: '#ee7b10' },
  'AVANT EXP': { logo: 'AVANT', color: '#ee7b10' },
  'MD': { logo: 'MD', color: '#ee7b10' },
  'REGIONAL': { logo: 'REGIONAL', color: '#ee7b10' },
  'REG.EXP.': { logo: 'REGIONAL', color: '#ee7b10' },
  'BUS': { logo: 'BUS', color: '#333333' },
  'TRENCELTA': { logo: 'TRENCELTA', color: '#002147' },
  'PROXIMIDAD': { logo: 'MD', color: '#ee7b10' },
};

export const getTrainIdentity = (type: string) => {
  if (TRAIN_BRAND_MAP[type]) return TRAIN_BRAND_MAP[type];
  if (type.startsWith('C')) return { logo: 'CERCANIAS', color: '#e30613' };
  if (/^(R|RT|RG|RL)/.test(type)) return { logo: 'RODALIES', color: '#ee7b10' };
  return { logo: 'GENERIC', color: '#002147' };
};

export const processTrainData = (trains: any[]) => {
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