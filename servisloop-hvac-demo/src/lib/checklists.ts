import type { ChecklistEntry, DeviceKind } from './types';

/**
 * Pokazni obrazac kontrolne liste. Nije službeni tehnički protokol:
 * stvarne stavke, redoslijed i intervale potvrđuje firma.
 * Namjerno nema tlakova, temperatura, punjenja rashladnog sredstva ili pragova.
 */
const COMMON_START = [
  { id: 'identifikacija', label: 'Identifikacija uređaja', hint: 'Oznaka, model i lokacija odgovaraju nalogu.' },
  { id: 'vizuelni', label: 'Vizuelni pregled', hint: 'Unutrašnja i vanjska jedinica, pristup i okolina.' },
];

const KLIMA = [
  { id: 'filter', label: 'Stanje filtera (evidentirano)', hint: 'Primjer evidentiranja: zabilježite zatečeno stanje.' },
  { id: 'odvod', label: 'Odvod kondenzata (evidentirano)', hint: 'Primjer evidentiranja: zabilježite zatečeno stanje.' },
];

const PUMPA = [
  { id: 'alarmi', label: 'Prikaz stanja i alarma na upravljaču', hint: 'Primjer evidentiranja: prepišite prikazane poruke, ako postoje.' },
];

const COMMON_END = [
  { id: 'opazanja', label: 'Zabilježena opažanja', hint: 'Šta je primijećeno tokom posjete.' },
  { id: 'rezultat', label: 'Rezultat i preporuka', hint: 'Kratak zaključak za kupca.' },
];

/**
 * Pokazni obrazac za ugradnju: bilježi da je posao predat i da je naljepnica na mjestu.
 * Tehnički postupak ugradnje određuju uputstvo proizvođača i firma — nije dio ovog obrasca.
 */
const INSTALL = [
  { id: 'ugradjen', label: 'Uređaj ugrađen i pušten u rad', hint: 'Prema uputstvu proizvođača i internom postupku firme.' },
  { id: 'naljepnica', label: 'QR naljepnica zalijepljena i skenirana', hint: 'Na vidljivo mjesto koje kupac lako pronađe.' },
  { id: 'kupac', label: 'Kupac upoznat s osnovnim radom uređaja', hint: 'Uključivanje, upravljač i kome se javiti.' },
  { id: 'dokumentacija', label: 'Dokumentacija proizvođača predata kupcu', hint: 'Uputstvo i garantni list.' },
];

export function installChecklist(): ChecklistEntry[] {
  return INSTALL.map((i) => ({ ...i, answer: null, note: '' }));
}

export function checklistFor(kind: DeviceKind): ChecklistEntry[] {
  const items = [...COMMON_START, ...(kind === 'klima' ? KLIMA : PUMPA), ...COMMON_END];
  return items.map((i) => ({ ...i, answer: null, note: '' }));
}

export const ANSWER_LABEL = {
  uredno: 'Uredno',
  paznja: 'Potrebna pažnja',
  np: 'Nije primjenjivo',
} as const;

export interface ChecklistGaps {
  unanswered: string[];
  attentionWithoutNote: string[];
  missingRecommendation: boolean;
}

export function checklistGaps(items: ChecklistEntry[], recommendation: string): ChecklistGaps {
  return {
    unanswered: items.filter((i) => i.answer === null).map((i) => i.label),
    attentionWithoutNote: items
      .filter((i) => i.answer === 'paznja' && i.note.trim() === '')
      .map((i) => i.label),
    missingRecommendation: recommendation.trim() === '',
  };
}

export function hasGaps(g: ChecklistGaps): boolean {
  return g.unanswered.length > 0 || g.attentionWithoutNote.length > 0 || g.missingRecommendation;
}

/** „Sve uredno”: popuni sve neodgovorene stavke odgovorom „Uredno”. */
export function markAllOk(items: ChecklistEntry[]): ChecklistEntry[] {
  return items.map((i) => (i.answer === null ? { ...i, answer: 'uredno' } : i));
}

/** Iz sadržaja QR-a (URL kartice ili sama oznaka) izdvaja oznaku uređaja. */
export function deviceIdFromQr(text: string): string | null {
  const t = text.trim();
  const m = t.match(/\/demo\/kupac\/([^/?#\s]+)/i);
  const raw = m ? decodeURIComponent(m[1]!) : t;
  const id = raw.toUpperCase().replace(/\s+/g, '');
  if (/^N-?\d{4}$/.test(id)) return id.includes('-') ? id : `N-${id.slice(1)}`;
  return /^(TP|KL)-?\d{3}$/.test(id) ? (id.includes('-') ? id : `${id.slice(0, 2)}-${id.slice(2)}`) : null;
}
