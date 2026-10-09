import { describe, expect, it } from 'vitest';

import { addMonths, diffDays, formatInterval, formatLong, relativeDays, startOfWeek, todayInZone } from './dates';

describe('kalendarski datumi', () => {
  it('dodaje kalendarske mjesece, ne 30-dnevne blokove', () => {
    expect(addMonths('2026-03-15', 6)).toBe('2026-09-15');
    expect(addMonths('2026-08-31', 6)).toBe('2027-02-28');
    expect(addMonths('2028-08-31', 6)).toBe('2029-02-28');
    expect(addMonths('2027-08-31', 6)).toBe('2028-02-29');
    expect(addMonths('2026-10-09', -12)).toBe('2025-10-09');
  });

  it('šest mjeseci nije uvijek 180 dana', () => {
    expect(diffDays(addMonths('2026-01-01', 6), '2026-01-01')).toBe(181);
  });

  it('formatira bosanske datume i intervale', () => {
    expect(formatLong('2026-10-09')).toBe('9. oktobar 2026.');
    expect(formatInterval(6)).toBe('6 mjeseci');
    expect(formatInterval(12)).toBe('12 mjeseci (1 godina)');
    expect(relativeDays('2026-10-21', '2026-10-09')).toBe('za 12 dana');
    expect(relativeDays('2026-10-08', '2026-10-09')).toBe('jučer');
    expect(relativeDays('2026-09-08', '2026-10-09')).toBe('prije 31 dan');
  });

  it('računa ponedjeljak i današnji dan u Sarajevu', () => {
    expect(startOfWeek('2026-10-09')).toBe('2026-10-05');
    expect(startOfWeek('2026-10-11')).toBe('2026-10-05');
    // 23:30 UTC 9. oktobra je već 10. oktobar u Sarajevu (UTC+2).
    expect(todayInZone(new Date('2026-10-09T23:30:00Z'))).toBe('2026-10-10');
  });
});
