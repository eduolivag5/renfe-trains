import { addDays, format, parseISO } from 'date-fns';
import { timeToMinutes } from './trainUtils';

interface IcsTrip {
  /** "AVE", "C6"… */
  trainType: string;
  /** yyyy-MM-dd */
  date: string;
  /** "HH:mm:ss" de GTFS (puede pasar de 24:00) */
  departureTime: string;
  arrivalTime: string;
  fromCity?: string;
  toCity?: string;
  fromStation?: string;
  toStation?: string;
  url: string;
}

/** Fecha + "HH:mm:ss" de GTFS → "yyyyMMddTHHmmss" (las horas ≥ 24 pasan al día siguiente) */
const icsLocal = (date: string, time: string, extraDays = 0) => {
  const min = timeToMinutes(time);
  const day = addDays(parseISO(date), Math.floor(min / 1440) + extraDays);
  const hh = String(Math.floor((min % 1440) / 60)).padStart(2, '0');
  const mm = String(min % 60).padStart(2, '0');
  return `${format(day, 'yyyyMMdd')}T${hh}${mm}00`;
};

/** Texto de iCalendar: escapa \ ; , y saltos de línea */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/**
 * Evento de calendario (.ics) de un tren: salida, llegada, estaciones y enlace al horario.
 * Hora local de España (TZID=Europe/Madrid). Si llega "antes" de salir, llega al día siguiente.
 */
export function buildTrainIcs(t: IcsTrip): string {
  const overnight = timeToMinutes(t.arrivalTime) < timeToMinutes(t.departureTime);
  const route = t.fromCity && t.toCity ? ` ${t.fromCity} → ${t.toCity}` : '';
  const desc = [
    t.fromStation && `Salida: ${t.fromStation}`,
    t.toStation && `Llegada: ${t.toStation}`,
    t.url,
  ]
    .filter(Boolean)
    .join('\n');
  const stamp = format(new Date(), "yyyyMMdd'T'HHmmss");
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trenes//Horario//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${t.date}-${t.departureTime.replace(/:/g, '')}-${t.trainType.trim()}@trenes`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Madrid:${icsLocal(t.date, t.departureTime)}`,
    `DTEND;TZID=Europe/Madrid:${icsLocal(t.date, t.arrivalTime, overnight ? 1 : 0)}`,
    `SUMMARY:${esc(`${t.trainType.trim()}${route}`)}`,
    t.fromStation ? `LOCATION:${esc(t.fromStation)}` : '',
    `DESCRIPTION:${esc(desc)}`,
    `URL:${t.url}`,
    // Aviso 30 minutos antes
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(`Tu tren${route} sale en 30 minutos`)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Descarga el .ics: en iPhone y Android se abre directamente "Añadir al calendario" */
export function downloadIcs(ics: string, filename: string) {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
