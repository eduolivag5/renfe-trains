const TRAIN_BRAND_MAP: Record<string, { logo: string; color: string }> = {
  // Alta Velocidad y Larga Distancia
  'AVE': { logo: 'AVE', color: '#002147' },
  'AVE INT': { logo: 'AVE', color: '#002147' },
  'AVLO': { logo: 'AVLO', color: '#4d148c' },
  'ALVIA': { logo: 'ALVIA', color: '#002147' },
  'EUROMED': { logo: 'EUROMED', color: '#002147' },
  'INTERCITY': { logo: 'INTERCITY', color: '#002147' },

  // Media Distancia
  'AVANT': { logo: 'AVANT', color: '#ee7b10' },
  'AVANT EXP': { logo: 'AVANT', color: '#ee7b10' },
  'MD': { logo: 'MD', color: '#ee7b10' },
  'REGIONAL': { logo: 'REGIONAL', color: '#ee7b10' },
  'REG.EXP.': { logo: 'REGIONAL', color: '#ee7b10' },

  // Otros
  'BUS': { logo: 'BUS', color: '#333333' },
  'TRENCELTA': { logo: 'TRENCELTA', color: '#002147' },
};

// Función para determinar el logo de Cercanías/Rodalies dinámicamente
export const getTrainIdentity = (type: string) => {
  // Si está en el mapa estático, lo devolvemos
  if (TRAIN_BRAND_MAP[type]) return TRAIN_BRAND_MAP[type];

  // Lógica para códigos dinámicos (C1, R4, etc.)
  if (type.startsWith('C')) {
    return { logo: 'CERCANIAS', color: '#e30613' }; // Rojo Cercanías
  }
  if (type.startsWith('R') || type.startsWith('RT') || type.startsWith('RG') || type.startsWith('RL')) {
    return { logo: 'RODALIES', color: '#ee7b10' }; // Naranja Rodalies
  }

  // Fallback
  return { logo: 'GENERIC', color: '#002147' };
};