import { DEMO_TIME_ZONE } from '@/config/brand';

/** Kalendarski datum u obliku `YYYY-MM-DD`, bez vremena i zone. */
export type CivilDate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function todayInZone(now: Date = new Date(), timeZone = DEMO_TIME_ZONE): CivilDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function parseCivil(d: CivilDate): { y: number; m: number; day: number } {
  const [y, m, day] = d.split('-').map(Number);
  return { y: y ?? 1970, m: m ?? 1, day: day ?? 1 };
}

function toUtc(d: CivilDate): number {
  const { y, m, day } = parseCivil(d);
  return Date.UTC(y, m - 1, day);
}

function fromUtc(ms: number): CivilDate {
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function addDays(d: CivilDate, days: number): CivilDate {
  return fromUtc(toUtc(d) + days * 86_400_000);
}

/**
 * Dodaje kalendarske mjesece. Ako ciljni mjesec nema taj dan (npr. 31.),
 * uzima se posljednji dan mjeseca — 31. august + 6 mjeseci = 28./29. februar.
 */
export function addMonths(d: CivilDate, months: number): CivilDate {
  const { y, m, day } = parseCivil(d);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = total - ny * 12;
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(day, lastDay))}`;
}

export function diffDays(a: CivilDate, b: CivilDate): number {
  return Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
}

/** Ponedjeljak sedmice u kojoj je datum. */
export function startOfWeek(d: CivilDate): CivilDate {
  const wd = new Date(toUtc(d)).getUTCDay(); // 0 = nedjelja
  return addDays(d, wd === 0 ? -6 : 1 - wd);
}

export function weekday(d: CivilDate): number {
  return new Date(toUtc(d)).getUTCDay();
}

const MONTHS = [
  'januar', 'februar', 'mart', 'april', 'maj', 'juni',
  'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar',
];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const WEEKDAYS = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
const WEEKDAYS_SHORT = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];

/** 9. oktobar 2026. */
export function formatLong(d: CivilDate): string {
  const { y, m, day } = parseCivil(d);
  return `${day}. ${MONTHS[m - 1]} ${y}.`;
}

/** 9. okt 2026. */
export function formatShort(d: CivilDate): string {
  const { y, m, day } = parseCivil(d);
  return `${day}. ${MONTHS_SHORT[m - 1]} ${y}.`;
}

/** 9. okt */
export function formatDayMonth(d: CivilDate): string {
  const { m, day } = parseCivil(d);
  return `${day}. ${MONTHS_SHORT[m - 1]}`;
}

export function weekdayName(d: CivilDate, short = false): string {
  return (short ? WEEKDAYS_SHORT : WEEKDAYS)[weekday(d)] ?? '';
}

/** „danas”, „sutra”, „za 5 dana”, „prije 3 dana”. */
export function relativeDays(target: CivilDate, today: CivilDate): string {
  const n = diffDays(target, today);
  if (n === 0) return 'danas';
  if (n === 1) return 'sutra';
  if (n === -1) return 'jučer';
  if (n > 0) return `za ${n} ${dayWord(n)}`;
  return `prije ${-n} ${dayWord(-n)}`;
}

function dayWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'dan';
  return 'dana';
}

/** „12 mjeseci”, „6 mjeseci”, „1 godina” — interval u kalendarskim jedinicama. */
export function formatInterval(months: number): string {
  if (months % 12 === 0) {
    const y = months / 12;
    return y === 1 ? '12 mjeseci (1 godina)' : `${y} godine`;
  }
  if (months === 1) return '1 mjesec';
  if (months >= 2 && months <= 4) return `${months} mjeseca`;
  return `${months} mjeseci`;
}

export function formatDateTime(ts: number): string {
  const dt = new Date(ts);
  const time = new Intl.DateTimeFormat('bs-BA', {
    timeZone: DEMO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(dt);
  return `${formatShort(todayInZone(dt))} u ${time}`;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}
