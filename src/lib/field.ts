/**
 * The five field states from spec §5.5, as a discriminated union.
 *
 * The point of this file: `sumMoney` accepts `Confirmed<Paise>[]` and nothing else,
 * so totalling an unconfirmed figure is a compile error rather than a review catch.
 */

import { addPaise, type Paise, ZERO } from './money';

export type SourceRef = {
  kind: 'document' | 'message' | 'human' | 'derived';
  id: string;
  label: string;
  locator?: string; // 'p.2 clause 4', 'row 118', '2026-08-09'
};

export type Confirmed<T> = {
  state: 'confirmed';
  value: T;
  source: SourceRef;
  confirmedBy: string;
  confirmedAt: string;
};
export type Extracted<T> = {
  state: 'extracted';
  value: T;
  source: SourceRef;
  confidence: number; // 0..1
};
export type Inferred<T> = {
  state: 'inferred';
  value: T;
  derivedFrom: SourceRef[];
  workings: string; // shown in the UI, always
};
export type Conflicting<T> = {
  state: 'conflicting';
  candidates: ReadonlyArray<{ value: T; source: SourceRef }>;
};
export type Missing = {
  state: 'missing';
  blocks: string[]; // what this gap prevents, e.g. ['vendor ledger']
};

export type FieldValue<T> = Confirmed<T> | Extracted<T> | Inferred<T> | Conflicting<T> | Missing;

export const isConfirmed = <T>(f: FieldValue<T>): f is Confirmed<T> => f.state === 'confirmed';
export const hasValue = <T>(f: FieldValue<T>): f is Confirmed<T> | Extracted<T> | Inferred<T> =>
  f.state === 'confirmed' || f.state === 'extracted' || f.state === 'inferred';

/** Display value where one exists. Never use this to compute a total. */
export const peek = <T>(f: FieldValue<T>): T | undefined => (hasValue(f) ? f.value : undefined);

/**
 * Split a set of fields into what counts and what is excluded, so a total can
 * always state its own exclusions (spec §5.5, P4).
 */
export function partition<T>(fields: ReadonlyArray<FieldValue<T>>): {
  counted: Confirmed<T>[];
  excluded: Exclude<FieldValue<T>, Confirmed<T>>[];
} {
  const counted: Confirmed<T>[] = [];
  const excluded: Exclude<FieldValue<T>, Confirmed<T>>[] = [];
  for (const f of fields) {
    if (isConfirmed(f)) counted.push(f);
    else excluded.push(f);
  }
  return { counted, excluded };
}

/** The only way to total money. Confirmed values only — by type. */
export const sumMoney = (fields: ReadonlyArray<Confirmed<Paise>>): Paise =>
  fields.reduce((acc, f) => addPaise(acc, f.value), ZERO);

export type Total = {
  value: Paise;
  countedCount: number;
  excludedCount: number;
  /** e.g. "excludes 2 unconfirmed figures" — render this next to every total. */
  caveat: string | null;
};

export function totalMoney(fields: ReadonlyArray<FieldValue<Paise>>): Total {
  const { counted, excluded } = partition(fields);
  return {
    value: sumMoney(counted),
    countedCount: counted.length,
    excludedCount: excluded.length,
    caveat:
      excluded.length === 0
        ? null
        : `excludes ${excluded.length} unconfirmed ${excluded.length === 1 ? 'figure' : 'figures'}`,
  };
}
