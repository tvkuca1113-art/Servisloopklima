import { diffDays, timeToMinutes, type CivilDate } from './dates';
import type { DemoState, Device, WorkOrder } from './types';

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

export function kpis(state: DemoState) {
  const today = state.anchor;
  const overdue = state.devices.filter((d) => dueStatus(d, today) === 'zakasnio');
  const next7 = state.devices.filter((d) => dueStatus(d, today) === 'sedam');
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
