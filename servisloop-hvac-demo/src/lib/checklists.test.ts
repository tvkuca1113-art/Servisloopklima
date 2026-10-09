import { describe, expect, it } from 'vitest';

import { checklistFor, deviceIdFromQr, markAllOk } from './checklists';

describe('identifikacija uređaja iz QR-a', () => {
  it('čita oznaku iz URL-a kartice i iz ručnog unosa', () => {
    expect(deviceIdFromQr('https://servisloop-hvac-demo.vercel.app/demo/kupac/TP-001')).toBe('TP-001');
    expect(deviceIdFromQr('http://localhost:3000/demo/kupac/KL-012?x=1')).toBe('KL-012');
    expect(deviceIdFromQr(' kl012 ')).toBe('KL-012');
    expect(deviceIdFromQr('TP-001')).toBe('TP-001');
  });

  it('odbija sadržaj koji nije naljepnica uređaja', () => {
    expect(deviceIdFromQr('https://example.test/nesto')).toBeNull();
    expect(deviceIdFromQr('WIFI:T:WPA;S:mreza;;')).toBeNull();
    expect(deviceIdFromQr('')).toBeNull();
  });
});

describe('„Sve uredno”', () => {
  it('popunjava samo neodgovorene stavke', () => {
    const list = checklistFor('klima');
    list[1]!.answer = 'paznja';
    const out = markAllOk(list);
    expect(out[1]!.answer).toBe('paznja');
    expect(out.filter((i) => i.answer === 'uredno')).toHaveLength(list.length - 1);
  });
});
