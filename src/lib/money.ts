/**
 * Money is a branded integer count of paise. Never a float, never a bare number.
 * Every rupee figure in the product passes through here.
 */

declare const PAISE: unique symbol;
export type Paise = number & { readonly [PAISE]: true };

/** From a rupee amount typed by a human or written in a fixture. */
export const rupees = (n: number): Paise => {
  if (!Number.isFinite(n)) throw new Error(`rupees(): not finite: ${n}`);
  return Math.round(n * 100) as Paise;
};

/** From an already-integral paise value (parsing, storage). */
export const paise = (n: number): Paise => {
  if (!Number.isInteger(n)) throw new Error(`paise(): not an integer: ${n}`);
  return n as Paise;
};

export const ZERO = 0 as Paise;

export const addPaise = (a: Paise, b: Paise): Paise => (a + b) as Paise;
export const subPaise = (a: Paise, b: Paise): Paise => (a - b) as Paise;
export const negPaise = (a: Paise): Paise => -a as Paise;
export const absPaise = (a: Paise): Paise => Math.abs(a) as Paise;
export const scalePaise = (a: Paise, factor: number): Paise => Math.round(a * factor) as Paise;
export const comparePaise = (a: Paise, b: Paise): number => a - b;

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** ₹18,40,000 — Indian digit grouping. The only money formatter in the app. */
export const formatINR = (p: Paise): string => inr.format(p / 100);

/** ₹18.4L — for pulse cards and chart axes only, never for a ledger line. */
export const formatShortINR = (p: Paise): string => {
  const r = p / 100;
  const abs = Math.abs(r);
  if (abs >= 1e7) return `₹${(r / 1e7).toFixed(abs >= 1e8 ? 0 : 1)}Cr`;
  if (abs >= 1e5) return `₹${(r / 1e5).toFixed(abs >= 1e6 ? 0 : 1)}L`;
  if (abs >= 1e3) return `₹${Math.round(r / 1e3)}k`;
  return inr.format(r);
};
