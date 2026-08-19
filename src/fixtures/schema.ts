/**
 * What the firm may shape, and what it may not — spec §6.9.
 *
 * The two columns are the whole point of the Settings screen. §6.9 calls it
 * "the only place in the product that looks like configuration", existing
 * "because the schema-freedom promise in §7.5 has to be true somewhere".
 *
 * The second column matters as much as the first. A product that let a firm
 * redefine what a payment means, or edit its own audit log, would have no
 * ground left to stand on when it says a figure carries its source. Naming the
 * boundary is what makes the freedom credible rather than boundless.
 *
 * Authored from §6.9's table verbatim. Fixtures, not component literals
 * (CLAUDE.md rule 1).
 */

export type SchemaRule = {
  id: string;
  label: string;
  /** Why it is on this side of the line. Stated, never left to be inferred. */
  because: string;
};

/** §6.9, left column: the firm defines these, and we follow. */
export const EDITABLE: SchemaRule[] = [
  {
    id: 'stages',
    label: 'Stage names and order',
    because: 'Every firm runs its own lifecycle. Ours is a default, not a rule.',
  },
  {
    id: 'categories',
    label: 'Vendor and cost categories',
    because: 'Trades differ by city and by firm.',
  },
  {
    id: 'custom-fields',
    label: 'Custom fields on any entity',
    because: 'What a firm tracks is a fact about that firm.',
  },
  {
    id: 'folders',
    label: 'Folder tree conventions',
    because: 'The hierarchy came from your folder. We did not impose one.',
  },
  {
    id: 'users',
    label: 'Users and roles',
    because: 'Who works here, and what each of them may see.',
  },
  {
    id: 'quiet-hours',
    label: 'Notification and quiet hours',
    because: 'A site runs on different hours from an office.',
  },
];

/** §6.9, right column: fixed, and each one says what it protects. */
export const NOT_EDITABLE: SchemaRule[] = [
  {
    id: 'entity-types',
    label: 'Entity types themselves',
    because:
      'Projects, clients, vendors, people, payments, tasks, documents. Adding a ninth kind would mean nothing else knew how to read it.',
  },
  {
    id: 'payment-meaning',
    label: 'What a payment means',
    because:
      'If a payment could mean something else here than there, no total in the product would be comparable.',
  },
  {
    id: 'direction',
    label: 'The direction model (in / out)',
    because:
      'Money arriving and money leaving are not interchangeable, and coverage depends on telling them apart.',
  },
  {
    id: 'field-states',
    label: 'The field-state model',
    because:
      'Confirmed, extracted, inferred, conflicting, missing. Collapse these and a figure read off a photograph becomes indistinguishable from one you checked.',
  },
  {
    id: 'audit',
    label: 'The audit log',
    because:
      'Append-only, and not ours to edit either. A log that could be rewritten would not be evidence of anything.',
  },
];
