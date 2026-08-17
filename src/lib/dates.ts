/**
 * The demo runs on a fixed date. Nothing in the product may read the wall clock.
 *
 * Why: every figure in the fixtures is dated relative to this day — the Iyer
 * instalment is "due today", Sharma's ₹80,000 falls two days later, the coverage
 * gap opens on 26 August. If the app read the real date, the demo would drift
 * out of shape the day after it was built and every date-sensitive block would
 * quietly say something different from the wireframes.
 *
 * `TODAY` is 12 August 2026, matching the Home wireframe's brief and the "due
 * today" row in w09_money. (The wireframe's own "Tuesday" is a slip — 12 Aug
 * 2026 is a Wednesday. The date and the figures are what the demo depends on,
 * so the date wins and the weekday is rendered from it.)
 *
 * Use `now()` and `todayISO()` instead of `new Date()` everywhere in `src/`.
 */

/** The demo's fixed today, as a date-only ISO string. */
export const TODAY = '2026-08-12';

/** The demo's fixed now, at 07:40 — the timestamp the morning brief carries. */
export const NOW_ISO = '2026-08-12T07:40:00.000Z';

/** The only clock the product reads. */
export const now = (): Date => new Date(NOW_ISO);

/** Today as `YYYY-MM-DD`, for comparing against a fixture's date field. */
export const todayISO = (): string => TODAY;

/** An ISO timestamp for anything written during the demo. */
export const nowISO = (): string => NOW_ISO;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses a `YYYY-MM-DD` date field into a Date at UTC midnight. */
export const parseDate = (iso: string): Date => new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);

/** Whole days from today to `iso`. Negative is in the past. */
export const daysFromToday = (iso: string): number =>
  Math.round((parseDate(iso).getTime() - parseDate(TODAY).getTime()) / DAY_MS);

/** `iso` shifted by `days`, as `YYYY-MM-DD`. */
export const addDays = (iso: string, days: number): string => {
  const d = new Date(parseDate(iso).getTime() + days * DAY_MS);
  return d.toISOString().slice(0, 10);
};

/** An ISO timestamp `hours` after the demo's now — for undo expiry. */
export const hoursFromNow = (hours: number): string =>
  new Date(now().getTime() + hours * 60 * 60 * 1000).toISOString();

export const isToday = (iso: string): boolean => iso.slice(0, 10) === TODAY;
export const isPast = (iso: string): boolean => daysFromToday(iso) < 0;
export const isWithinDays = (iso: string, days: number): boolean => {
  const d = daysFromToday(iso);
  return d >= 0 && d <= days;
};

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** "Wednesday, 12 August" — the Home brief's header. */
export const formatLongDate = (iso: string): string => {
  const d = parseDate(iso);
  return `${DAY_NAMES[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;
};

/** "14 Aug" — the payment grid's due column. */
export const formatShortDate = (iso: string): string => {
  const d = parseDate(iso);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]?.slice(0, 3)}`;
};

/** "08:10" — the site feed's timestamp (§6.3). Read in UTC, like every other date here. */
export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

/** "due today", "in 2 days", "4 days ago" — always relative to the fixed today. */
export const formatRelative = (iso: string): string => {
  const days = daysFromToday(iso);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
};
