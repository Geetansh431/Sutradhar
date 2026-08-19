/**
 * The schema boundary — §6.9.
 *
 * These lists are the spec's own table. A future session tempted to move an
 * item from the right column to the left should have to delete a test that
 * says why it is there — moving "the audit log" to editable is not a feature
 * decision, it is the end of the product's central claim.
 */

import { describe, expect, it } from 'vitest';
import { EDITABLE, NOT_EDITABLE } from '@/fixtures/schema';

describe('§6.9 — what the firm may shape', () => {
  it('lists the six editable things the spec names', () => {
    expect(EDITABLE.map((rule) => rule.label)).toEqual([
      'Stage names and order',
      'Vendor and cost categories',
      'Custom fields on any entity',
      'Folder tree conventions',
      'Users and roles',
      'Notification and quiet hours',
    ]);
  });

  it('lists the five fixed things, and they stay fixed', () => {
    expect(NOT_EDITABLE.map((rule) => rule.label)).toEqual([
      'Entity types themselves',
      'What a payment means',
      'The direction model (in / out)',
      'The field-state model',
      'The audit log',
    ]);
  });

  it('keeps the audit log and the field-state model out of reach', () => {
    // The two the product's own guarantees rest on: rule 3 needs the field
    // states to mean something, and audit needs a log nobody can rewrite.
    const fixed = NOT_EDITABLE.map((rule) => rule.id);
    expect(fixed).toContain('audit');
    expect(fixed).toContain('field-states');
    expect(EDITABLE.map((rule) => rule.id)).not.toContain('audit');
  });

  it('gives every rule a reason, on both sides', () => {
    for (const rule of [...EDITABLE, ...NOT_EDITABLE]) {
      expect(rule.because.length, rule.label).toBeGreaterThan(20);
    }
  });

  it('does not put the same thing on both sides', () => {
    const ids = [...EDITABLE, ...NOT_EDITABLE].map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
