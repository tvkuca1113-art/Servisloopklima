import { describe, expect, it } from 'vitest';

import { createInitialState } from './demo-data';
import { dueStatus, findCollision, kpis } from './derive';

describe('demo podaci', () => {
  const s = createInitialState('2026-10-09', Date.UTC(2026, 9, 9, 8));

  it('ima traženi obim izmišljenih podataka', () => {
    expect(s.customers).toHaveLength(6);
    expect(s.locations).toHaveLength(8);
    expect(s.technicians).toHaveLength(2);
    expect(s.devices).toHaveLength(24);
    expect(s.devices.filter((d) => d.kind === 'klima')).toHaveLength(16);
    expect(s.devices.filter((d) => d.kind === 'pumpa')).toHaveLength(8);
    expect(s.workOrders.filter((w) => w.status === 'zavrsen')).toHaveLength(3);
    expect(s.customers.every((c) => c.email.endsWith('@example.test'))).toBe(true);
  });

  it('sadrži zakasneli servis, servis uskoro, današnji nalog i završeni servis', () => {
    expect(s.devices.some((d) => dueStatus(d, s.anchor) === 'zakasnio')).toBe(true);
    expect(s.devices.some((d) => dueStatus(d, s.anchor) === 'uskoro')).toBe(true);
    expect(s.workOrders.some((w) => w.date === s.anchor)).toBe(true);
    const tp1 = s.devices.find((d) => d.id === 'TP-001')!;
    expect(tp1.typeLabel).toBe('Toplotna pumpa zrak–voda');
    expect(s.locations.find((l) => l.id === tp1.locationId)?.name).toBe('Demo kuća Tuzla');
  });

  it('KPI brojke se računaju iz podataka', () => {
    const k = kpis(s);
    expect(k.overdue).toHaveLength(4);
    expect(k.newRequests).toHaveLength(2);
    expect(k.openOrders).toHaveLength(7);
  });

  it('prepoznaje demo koliziju termina servisera', () => {
    expect(findCollision(s, 't2', s.anchor, '09:30', 60)?.order.id).toBe('NAL-0110');
    expect(findCollision(s, 't1', s.anchor, '09:00', 90)).toBeNull();
  });
});
