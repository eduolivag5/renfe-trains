/**
 * Utilidades de presentación de estaciones.
 *
 * La API devuelve los nombres en mayúsculas y con los caracteres acentuados corruptos
 * (llegan como U+FFFD "�"). Mientras se corrige en el backend, reparamos aquí las
 * palabras más habituales y damos formato legible (Title Case).
 */

export interface Estacion {
  codigo: string;
  nombre: string;
  poblacion?: string;
  provincia?: string;
}

const BAD = '�';

/** Palabras frecuentes con tilde/ñ, en mayúsculas sin el carácter corrupto → forma correcta */
const ACCENT_FIXES: Record<string, string> = {
  'CERCAN?AS': 'CERCANÍAS',
  'CHAMART?N': 'CHAMARTÍN',
  'PR?NCIPE': 'PRÍNCIPE',
  'P?O': 'PÍO',
  'VAL?NCIA': 'VALÈNCIA',
  'JOAQU?N': 'JOAQUÍN',
  'M?LAGA': 'MÁLAGA',
  'MAR?A': 'MARÍA',
  'LE?N': 'LEÓN',
  'C?DIZ': 'CÁDIZ',
  'C?RDOBA': 'CÓRDOBA',
  'ALMER?A': 'ALMERÍA',
  'JA?N': 'JAÉN',
  '?VILA': 'ÁVILA',
  'CORU?A': 'CORUÑA',
  'LOGRO?O': 'LOGROÑO',
  'ESTACI?N': 'ESTACIÓN',
  'AVIACI?N': 'AVIACIÓN',
  'C?CERES': 'CÁCERES',
  'M?RIDA': 'MÉRIDA',
  'CASTELL?': 'CASTELLÓ',
  'CASTELL?N': 'CASTELLÓN',
  'GIJ?N': 'GIJÓN',
  'SAN SEBASTI?N': 'SAN SEBASTIÁN',
  'SEBASTI?N': 'SEBASTIÁN',
  'LA CORU?A': 'LA CORUÑA',
  'ESPA?A': 'ESPAÑA',
  'VALEN?A': 'VALENÇA',
  'ALC?NTARA': 'ALCÁNTARA',
  'ARAG?N': 'ARAGÓN',
  'ALCAL?': 'ALCALÁ',
  'HU?RCAL': 'HUÉRCAL',
  'M?STOLES': 'MÓSTOLES',
  'LEGAN?S': 'LEGANÉS',
  'POL?GONO': 'POLÍGONO',
  'PE?A': 'PEÑA',
  'MU?OZ': 'MUÑOZ',
};

const fixWord = (word: string) => ACCENT_FIXES[word.split(BAD).join('?')] ?? word;

/** Repara palabra a palabra los caracteres corruptos conocidos */
export const fixEncoding = (text: string) =>
  text.includes(BAD) ? text.replace(/[^\s\-/,.()]+/g, (w) => (w.includes(BAD) ? fixWord(w) : w)) : text;

const LOWER_WORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'i', 'a', 'en', 'les', "d'"]);
const UPPER_WORDS = new Set(['ave', 'renfe', 'ii', 'iii', 'iv', 'uab', 'uam']);

/** "MADRID-PUERTA DE ATOCHA" → "Madrid-Puerta de Atocha" */
export const prettyName = (raw?: string) => {
  if (!raw) return '';
  const text = fixEncoding(raw.trim()).toLocaleLowerCase('es');
  let first = true;
  return text.replace(/[^\s\-/(),.]+/g, (word) => {
    const isFirst = first;
    first = false;
    if (UPPER_WORDS.has(word)) return word.toLocaleUpperCase('es');
    if (!isFirst && LOWER_WORDS.has(word)) return word;
    return word.charAt(0).toLocaleUpperCase('es') + word.slice(1);
  });
};

/** Población · Provincia, sin repetir cuando coinciden */
export const stationPlace = (e: Pick<Estacion, 'poblacion' | 'provincia'>) => {
  const pob = prettyName(e.poblacion);
  const prov = prettyName(e.provincia);
  if (!pob) return prov;
  if (!prov || pob.toLowerCase() === prov.toLowerCase().split('/')[0]) return pob;
  return `${pob} · ${prov}`;
};

/** Estaciones principales (códigos reales de la API) para elegir sin escribir */
export const POPULAR_STATIONS: Estacion[] = [
  { codigo: '60000', nombre: 'Madrid-Puerta de Atocha', poblacion: 'Madrid', provincia: 'Madrid' },
  { codigo: '17000', nombre: 'Madrid-Chamartín-Clara Campoamor', poblacion: 'Madrid', provincia: 'Madrid' },
  { codigo: '71801', nombre: 'Barcelona-Sants', poblacion: 'Barcelona', provincia: 'Barcelona' },
  { codigo: '03216', nombre: 'València-Joaquín Sorolla', poblacion: 'Valencia', provincia: 'Valencia' },
  { codigo: '51003', nombre: 'Sevilla-Santa Justa', poblacion: 'Sevilla', provincia: 'Sevilla' },
  { codigo: '54413', nombre: 'Málaga María Zambrano', poblacion: 'Málaga', provincia: 'Málaga' },
  { codigo: '04040', nombre: 'Zaragoza Delicias', poblacion: 'Zaragoza', provincia: 'Zaragoza' },
  { codigo: '13200', nombre: 'Bilbao-Abando Indalecio Prieto', poblacion: 'Bilbao', provincia: 'Bizkaia' },
];

const byCode = (c: string) => POPULAR_STATIONS.find((s) => s.codigo === c)!;

/** Rutas frecuentes para lanzar una búsqueda con un toque */
export const POPULAR_ROUTES: { from: Estacion; to: Estacion; city: [string, string] }[] = [
  { from: byCode('60000'), to: byCode('71801'), city: ['Madrid', 'Barcelona'] },
  { from: byCode('60000'), to: byCode('51003'), city: ['Madrid', 'Sevilla'] },
  { from: byCode('60000'), to: byCode('03216'), city: ['Madrid', 'Valencia'] },
  { from: byCode('60000'), to: byCode('54413'), city: ['Madrid', 'Málaga'] },
  { from: byCode('71801'), to: byCode('04040'), city: ['Barcelona', 'Zaragoza'] },
  { from: byCode('17000'), to: byCode('13200'), city: ['Madrid', 'Bilbao'] },
];
