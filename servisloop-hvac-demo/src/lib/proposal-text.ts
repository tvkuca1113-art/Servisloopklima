import { brand } from '@/config/brand';

import { formatLong, relativeDays, weekdayName } from './dates';
import { endTime } from './derive';
import type { DemoState, Proposal, ProposalSlot } from './types';

export function slotLabel(slot: ProposalSlot, durationMin: number): string {
  const day = weekdayName(slot.date);
  return `${day.charAt(0).toUpperCase()}${day.slice(1)}, ${formatLong(slot.date)} u ${slot.start}–${endTime({ start: slot.start, durationMin })}`;
}

/** Tekst poruke s prijedlogom termina — profesionalan, bez obećanja i izmišljenih tvrdnji. */
export function proposalMessage(state: DemoState, p: Pick<Proposal, 'deviceIds' | 'dueOn' | 'slots' | 'channel' | 'durationMin' | 'locationId'>, link: string) {
  const loc = state.locations.find((l) => l.id === p.locationId);
  const devices = p.deviceIds.map((id) => state.devices.find((d) => d.id === id)).filter(Boolean);
  const names = devices.map((d) => `${d!.name} (${d!.id})`).join(', ');
  const overdue = p.dueOn < state.anchor;
  const due = `${formatLong(p.dueOn)} (${relativeDays(p.dueOn, state.anchor)})`;
  if (p.channel === 'sms') {
    return {
      subject: '',
      body: `${brand.companyName}: redovni servis — ${devices.map((d) => d!.id).join(', ')} — ${overdue ? `rok je bio ${formatLong(p.dueOn)}` : `do ${formatLong(p.dueOn)}`}. Odaberite jedan od ${p.slots.length} predložena termina ili predložite drugi: ${link}`,
    };
  }
  const slots = p.slots.map((s) => `• ${slotLabel(s, p.durationMin)}`).join('\n');
  return {
    subject: `Redovni servis — prijedlog termina (${loc?.name ?? ''})`,
    body: `Poštovani,

prema našoj evidenciji, ${
      overdue
        ? `rok za redovni servis uređaja ${names} na objektu „${loc?.name ?? ''}” bio je ${formatLong(p.dueOn)}. Preporučujemo da se servis obavi što prije.`
        : `redovni servis za ${devices.length > 1 ? 'uređaje' : 'uređaj'} ${names} na objektu „${loc?.name ?? ''}” treba obaviti do ${due}.`
    }

Predlažemo jedan od sljedećih termina:
${slots}

Termin možete potvrditi ili predložiti drugi putem linka:
${link}

Ako u ovom periodu ne želite servis, to možete označiti na istom linku.

Srdačan pozdrav,
${brand.companyName}`,
  };
}

/**
 * Šta kupac treba znati prije nego odbije servis. Namjerno opšte i provjerljivo:
 * bez brojki, bez tvrdnje da garancija prestaje i bez dijagnoze konkretnog uređaja.
 */
export const DECLINE_INFO = {
  intro:
    'Proizvođači klima uređaja i toplotnih pumpi preporučuju redovno održavanje. Preporučeni interval za vaš uređaj naveden je u uputstvu proizvođača.',
  points: [
    'Zaprljanost ili habanje dijelova mogu ostati neprimijećeni dok ne izazovu smetnje u radu ili kvar.',
    'Uređaj može raditi manje efikasno nego kada se redovno održava.',
    'Kod nekih proizvođača uslovi garancije vezani su za redovno održavanje — provjerite garantni list svog uređaja.',
  ],
  outro: 'Odluka je vaša. Servis možete zakazati i kasnije, skeniranjem QR koda na uređaju.',
};

export const DECLINE_REASONS = [
  { id: 'kasnije', label: 'Podsjetite me za mjesec dana', status: 'odgoden' as const },
  { id: 'drugi', label: 'Uređaj održava druga firma', status: 'odbijen' as const },
  { id: 'nedavno', label: 'Uređaj je nedavno servisiran', status: 'odbijen' as const },
  { id: 'sezona', label: 'Ne želim servis u ovom periodu', status: 'odbijen' as const },
];

export function dueSentence(dueOn: string, today: string): string {
  return dueOn < today ? `Rok je bio ${formatLong(dueOn)} — predlažemo servis što prije.` : `Rok: ${formatLong(dueOn)} (${relativeDays(dueOn, today)}).`;
}
