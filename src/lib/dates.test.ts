import { describe, expect, it } from 'vitest';
import {
  addDays,
  daysFromToday,
  formatLongDate,
  formatRelative,
  formatShortDate,
  hoursFromNow,
  isPast,
  isToday,
  isWithinDays,
  NOW_ISO,
  nowISO,
  TODAY,
  todayISO,
} from './dates';

describe('the demo clock is fixed', () => {
  it('does not move between calls', () => {
    expect(nowISO()).toBe(NOW_ISO);
    expect(todayISO()).toBe(TODAY);
    expect(nowISO()).toBe(nowISO());
  });

  it('is 12 August 2026, the date on the Home wireframe', () => {
    expect(TODAY).toBe('2026-08-12');
    expect(formatLongDate(TODAY)).toBe('Wednesday, 12 August');
  });

  it('carries 07:40 — the brief is timestamped "generated 07:40"', () => {
    expect(NOW_ISO).toContain('T07:40');
  });
});

describe('date arithmetic', () => {
  it('counts whole days in both directions', () => {
    expect(daysFromToday('2026-08-12')).toBe(0);
    expect(daysFromToday('2026-08-14')).toBe(2);
    expect(daysFromToday('2026-08-26')).toBe(14);
    expect(daysFromToday('2026-08-08')).toBe(-4);
  });

  it('shifts a date without drifting across month ends', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-09-01', -1)).toBe('2026-08-31');
    expect(addDays('2026-08-12', 21)).toBe('2026-09-02');
  });

  it('answers today / past / within-window', () => {
    expect(isToday('2026-08-12')).toBe(true);
    expect(isToday('2026-08-13')).toBe(false);
    expect(isPast('2026-08-11')).toBe(true);
    expect(isPast('2026-08-12')).toBe(false);
    expect(isWithinDays('2026-08-26', 14)).toBe(true);
    expect(isWithinDays('2026-08-27', 14)).toBe(false);
    expect(isWithinDays('2026-08-11', 14)).toBe(false);
  });

  it('gives undo a 24h expiry from the fixed now — spec §8.3', () => {
    expect(hoursFromNow(24)).toBe('2026-08-13T07:40:00.000Z');
  });
});

describe('formatting', () => {
  it('renders the payment grid due column', () => {
    expect(formatShortDate('2026-08-14')).toBe('14 Aug');
    expect(formatShortDate('2026-09-02')).toBe('2 Sep');
  });

  it('renders relative phrasing the queue and brief use', () => {
    expect(formatRelative('2026-08-12')).toBe('today');
    expect(formatRelative('2026-08-13')).toBe('tomorrow');
    expect(formatRelative('2026-08-11')).toBe('yesterday');
    expect(formatRelative('2026-08-14')).toBe('in 2 days');
    expect(formatRelative('2026-08-08')).toBe('4 days ago');
  });
});
