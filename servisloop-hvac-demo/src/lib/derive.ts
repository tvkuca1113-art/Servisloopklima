import { diffDays, timeToMinutes, type CivilDate } from './dates';
import { addDays, weekday } from './dates';
import type { DemoState, Device, ProposalSlot, WorkOrder } from './types';

export type DueStatus = 'zakasnio' | 'sedam' | 'uskoro' | 'uredu';

export const DUE_LABEL: Record<DueStatus, string> = {
  zakasnio: 'Servis kasni',
  sedam: 'Servis u narednih 7 dana',
  uskoro: 'Servis uskoro',
  uredu: 'Servis u planu',
};

/** Rok servisa u odnosu na „danas” primjera. „Uskoro” = u narednih 30 dana. */
export function dueStatus(device: Device, today: CivilDate): DueStatus {
  const n = diffDays(device.nextServiceOn, today);
  if (n < 0) return 'zakasnio';
  if (n <= 7) return 'sedam';
  if (n <= 30) return 'uskoro';
  return 'uredu';
}

export const OPEN_STATUSES: WorkOrder['status'][] = ['planiran', 'u_radu'];

export function isOpen(w: WorkOrder): boolean {
  return OPEN_STATUSES.includes(w.status);
}

export function lookup(state: DemoState) {
  const device = (id: string) => state.devices.find((d) => d.id === id);
  const location = (id: string) => state.locations.find((l) => l.id === id);
  const customer = (id: string) => state.customers.find((c) => c.id === id);
  const technician = (id: string | null) => (id ? state.technicians.find((t) => t.id === id) : undefined);
  const workOrder = (id: string) => state.workOrders.find((w) => w.id === id);
  const request = (id: string) => state.requests.find((r) => r.id === id);
  const deviceLocation = (d: Device) => location(d.locationId);
  const deviceCustomer = (d: Device) => {
    const l = location(d.locationId);
    return l ? customer(l.customerId) : undefined;
  };
  return { device, location, customer, technician, workOrder, request, deviceLocation, deviceCustomer };
}

export function deviceTitle(state: DemoState, d: Device): string {
  const l = state.locations.find((x) => x.id === d.locationId);
  return `${d.id} · ${l?.name ?? 'Lokacija'}`;
}

export function isActive(d: Device): boolean {
  return d.status !== 'ugradnja';
}

export function kpis(state: DemoState) {
  const today = state.anchor;
  const active = state.devices.filter(isActive);
  const overdue = active.filter((d) => dueStatus(d, today) === 'zakasnio');
  const next7 = active.filter((d) => dueStatus(d, today) === 'sedam');
  const newRequests = state.requests.filter((r) => r.status === 'na_cekanju');
  const openOrders = state.workOrders.filter(isOpen);
  return { overdue, next7, newRequests, openOrders };
}

export interface Collision {
  order: WorkOrder;
}

/** Da li serviser u primjeru već ima otvoren nalog koji se preklapa s terminom. */
export function findCollision(
  state: DemoState,
  technicianId: string,
  date: CivilDate,
  start: string,
  durationMin: number,
  ignoreOrderId?: string,
): Collision | null {
  const s = timeToMinutes(start);
  const e = s + durationMin;
  for (const w of state.workOrders) {
    if (w.id === ignoreOrderId || w.technicianId !== technicianId || w.date !== date || !isOpen(w)) continue;
    const ws = timeToMinutes(w.start);
    const we = ws + w.durationMin;
    if (s < we && ws < e) return { order: w };
  }
  return null;
}

/** Prvi slobodan termin istog dana (korak 30 min, 08:00–17:00). */
export function suggestFreeSlot(
  state: DemoState,
  technicianId: string,
  date: CivilDate,
  durationMin: number,
  ignoreOrderId?: string,
): string | null {
  for (let m = 8 * 60; m + durationMin <= 17 * 60; m += 30) {
    const t = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    if (!findCollision(state, technicianId, date, t, durationMin, ignoreOrderId)) return t;
  }
  return null;
}

export function endTime(w: Pick<WorkOrder, 'start' | 'durationMin'>): string {
  const m = timeToMinutes(w.start) + w.durationMin;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function sortOrders(a: WorkOrder, b: WorkOrder): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  return timeToMinutes(a.start) - timeToMinutes(b.start);
}

/** „TP-001 + 2 uređaja” — kratka oznaka uređaja u posjeti. */
export function orderDevicesLabel(w: Pick<WorkOrder, 'deviceId' | 'items'>): string {
  const extra = w.items.length - 1;
  return extra > 0 ? `${w.deviceId} + ${extra} ${extra === 1 ? 'uređaj' : 'uređaja'}` : w.deviceId;
}

/** „TP-001 + 2 uređaja · Demo kuća Tuzla” */
export function orderTitle(state: DemoState, w: WorkOrder): string {
  const l = state.locations.find((x) => x.id === w.locationId);
  return `${orderDevicesLabel(w)} · ${l?.name ?? 'Lokacija'}`;
}

/** Kod iz QR-a: uređaj (TP-001) ili prazna naljepnica iz kompleta (N-0001). */
export type Resolved = { kind: 'device'; deviceId: string } | { kind: 'label'; code: string; deviceId: string | null };

export function resolveCode(state: DemoState, code: string): Resolved {
  if (code.startsWith('N-')) {
    const label = state.labels.find((l) => l.code === code);
    return { kind: 'label', code, deviceId: label?.deviceId ?? null };
  }
  return { kind: 'device', deviceId: code };
}

/**
 * Prijedlog slobodnih termina za kupca: radni dani od `from`, 09:00 ili 13:00,
 * prvi serviser koji je slobodan. Jedan termin po danu.
 */
export function suggestSlots(state: DemoState, from: CivilDate, count: number, durationMin: number): ProposalSlot[] {
  const out: ProposalSlot[] = [];
  let day = from;
  for (let i = 0; i < 30 && out.length < count; i++, day = addDays(day, 1)) {
    const wd = weekday(day);
    if (wd === 0 || wd === 6) continue;
    const start = out.length % 2 === 0 ? ['09:00', '13:00'] : ['13:00', '09:00'];
    let found: ProposalSlot | null = null;
    for (const t of start) {
      for (const tech of state.technicians) {
        if (!findCollision(state, tech.id, day, t, durationMin)) {
          found = { date: day, start: t, technicianId: tech.id };
          break;
        }
      }
      if (found) break;
    }
    if (found) out.push(found);
  }
  return out;
}

/** Aktivni uređaji kojima rok ističe u narednih `days` dana ili je prošao. */
export function dueSoon(state: DemoState, days = 30): Device[] {
  const limit = addDays(state.anchor, days);
  return state.devices.filter((d) => isActive(d) && d.nextServiceOn <= limit).sort((a, b) => (a.nextServiceOn < b.nextServiceOn ? -1 : 1));
}

/** Da li uređaj već ima otvoren nalog (servis je ugovoren). */
export function hasOpenOrder(state: DemoState, deviceId: string): WorkOrder | undefined {
  return state.workOrders.find((w) => isOpen(w) && w.items.some((i) => i.deviceId === deviceId));
}
