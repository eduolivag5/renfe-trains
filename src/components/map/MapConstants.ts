// components/map/MapConstants.ts
export const COLORS = {
  cercanias: '#6d28d9',
  other: '#1e3a8a',
  clusterSm: '#3b82f6',
  clusterMd: '#6d28d9',
  clusterLg: '#1e1b4b',
} as const;

export const clusterHaloStyle: any = {
  id: 'clusters-halo',
  type: 'circle',
  source: 'trains-data',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': 'transparent',
    'circle-radius': ['step', ['get', 'point_count'], 28, 15, 38, 60, 48],
    'circle-stroke-width': 1.5,
    'circle-stroke-color': [
      'step', ['get', 'point_count'],
      'rgba(59,130,246,0.3)', 15,
      'rgba(109,40,217,0.3)', 60,
      'rgba(30,27,75,0.4)',
    ],
  },
};

export const clusterLayerStyle: any = {
  id: 'clusters',
  type: 'circle',
  source: 'trains-data',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': [
      'step', ['get', 'point_count'],
      COLORS.clusterSm, 15,
      COLORS.clusterMd, 60,
      COLORS.clusterLg,
    ],
    'circle-radius': ['step', ['get', 'point_count'], 20, 15, 28, 60, 36],
    'circle-opacity': 0.93,
    'circle-stroke-width': 2,
    'circle-stroke-color': 'rgba(255,255,255,0.18)',
  },
};

export const clusterCountStyle: any = {
  id: 'cluster-count',
  type: 'symbol',
  source: 'trains-data',
  filter: ['has', 'point_count'],
  layout: {
    'text-field': '{point_count_abbreviated}',
    'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
    'text-size': 13,
  },
  paint: { 'text-color': '#ffffff' },
};

export const getPointStyle = (isDarkMode: boolean): any => ({
  id: 'unclustered-point',
  type: 'symbol',
  source: 'trains-data',
  filter: ['!', ['has', 'point_count']],
  layout: {
    'icon-image': ['match', ['get', 'tipo'], 'CERCANIAS', 'train-icon-cercanias', 'train-icon-other'],
    'icon-size': ['interpolate', ['linear'], ['zoom'], 8, 0.55, 12, 0.8, 16, 1.1],
    'icon-allow-overlap': true,
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
    'icon-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 1],
  },
});