// components/map/MapConstants.ts

export const COLORS = {
  // Colores por categoría de tren
  cercanias: '#ef2c30',      // Rojo Cercanías
  rodalies: '#f47216',       // Naranja Rodalies
  altaVelocidad: '#851765',  // Turquesa AVE/AVLO
  mediaDistancia: '#808080', // Naranja oscuro MD
  otros: '#1e3a8a',          // Azul oscuro
} as const;

/**
 * Define el estilo de los puntos individuales de los trenes.
 * Agrupa los 'short_name' del GTFS en categorías visuales (iconos).
 */
export const getPointStyle = (isDarkMode: boolean): any => ({
  id: 'unclustered-point',
  type: 'symbol',
  source: 'trains-data',
  layout: {
    'icon-image': [
      'match',
      ['get', 'tipo'],
      // GRUPO: CERCANÍAS
      ['C1', 'C1a', 'C2', 'C3', 'C4', 'C4a', 'C4A', 'C4b', 'C5', 'C5a', 'C6', 'C7', 'C8', 'C8a', 'C8b', 'C9', 'C10'], 
      'train-icon-cercanias',

      // GRUPO: RODALIES
      ['R1', 'R2', 'R2N', 'R2S', 'R3', 'R3a', 'R4', 'R7', 'R8', 'R11', 'R13', 'R14', 'R15', 'R16', 'R17', 'RG1', 'RL3', 'RL4', 'RT1', 'RT2', 'T1'], 
      'train-icon-rodalies',

      // GRUPO: ALTA VELOCIDAD
      ['AVE', 'AVE INT', 'AVLO', 'ALVIA', 'AVANT', 'AVANT EXP', 'EUROMED'], 
      'train-icon-ave',

      // GRUPO: MEDIA DISTANCIA / REGIONAL
      ['MD', 'REGIONAL', 'REG.EXP.', 'PROXIMDAD', 'Intercity', 'TRENCELTA'], 
      'train-icon-md',

      // DEFAULT (Incluye BUS y cualquier otro)
      'train-icon-other'
    ],
    'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.55, 12, 0.8, 16, 1.1],
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'icon-anchor': 'center',
    'text-field': ['get', 'label'],
    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    'text-size': ['interpolate', ['linear'], ['zoom'], 11, 0, 13, 10, 16, 12],
    'text-offset': [0, 1.6],
    'text-anchor': 'top',
    'text-optional': true,
  },
  paint: {
    'text-color': isDarkMode ? '#c4b5fd' : '#1e1b4b',
    'text-halo-color': isDarkMode ? 'rgba(2,6,23,0.9)' : 'rgba(255,255,255,0.92)',
    'text-halo-width': 1.5,
    'icon-opacity': 1,
  },
});