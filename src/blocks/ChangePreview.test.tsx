/**
 * Block 09's requirements are enumerated in spec §8.3, so the tests are too.
 *
 * The load-bearing ones are the guarantees: the block hands back a confirmed
 * ChangeSet and touches nothing itself, a low-confidence row is visible rather
 * than hidden, and there is no way to express a delete.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChangePreview, changeTag } from '@/blocks/ChangePreview';
import { NOW_ISO } from '@/lib/dates';
import { rupees } from '@/lib/money';
import { applyChange, type ChangeSet, type ProposedChange, proposeChangeSet } from '@/store/change';

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = (node: React.ReactElement) => renderToStaticMarkup(node);

const row = (over: Partial<ProposedChange> = {}): ProposedChange => ({
  change: { op: 'update', id: 'payment-godrej-iyer', patch: { amount: rupees(200000) } },
  before: '₹1,70,000',
  after: '₹2,00,000',
  label: 'Godrej dealer amount',
  confidence: 'high',
  ...over,
});

const set = (changes: ProposedChange[], source: ChangeSet['source'] = null): ChangeSet =>
  proposeChangeSet({ proposedBy: 'ai', source, changes });

describe('the w14 anatomy', () => {
  const html = render(
    <ChangePreview
      changeSet={set(
        [
          row({
            change: {
              op: 'create',
              entity: {
                kind: 'payment',
                id: 'new-bill',
                direction: 'out',
                projectId: 'project-iyer',
                counterpartyId: 'vendor-sharma',
                amount: {
                  state: 'confirmed',
                  value: rupees(80000),
                  source: { kind: 'human', id: 'h', label: 't' },
                  confirmedBy: 'a',
                  confirmedAt: NOW_ISO,
                },
                due: {
                  state: 'confirmed',
                  value: '2026-08-14',
                  source: { kind: 'human', id: 'h', label: 't' },
                  confirmedBy: 'a',
                  confirmedAt: NOW_ISO,
                },
                status: 'due',
                gatedOn: null,
                archivedAt: null,
              },
            },
            before: null,
            after: 'Sharma Electricals · ₹80,000 · out · due 14 Aug',
            label: 'Payment record',
          }),
          row({ label: 'Vendor balance', before: '₹2,00,000', after: '₹2,80,000' }),
          row({
            change: { op: 'link', from: 'task-wiring', to: 'new-bill', relation: 'gated-on' },
            before: null,
            after: 'linked to this payment · I guessed this one',
            label: 'Task "Wiring"',
            confidence: 'low',
          }),
        ],
        { kind: 'document', id: 'd', label: 'photo of a bill', locator: 'Sharma ka bill aa gaya' },
      )}
      onConfirm={() => {}}
    />,
  );

  it('counts the objects before any of them change', () => {
    expect(text(html)).toContain('3 changes proposed');
  });

  it('names the source that produced it', () => {
    expect(text(html)).toContain('from: photo of a bill');
    expect(text(html)).toContain('Sharma ka bill aa gaya');
  });

  it('tags each object by what will happen to it', () => {
    expect(text(html)).toContain('NEW');
    expect(text(html)).toContain('EDIT');
    expect(text(html)).toContain('LINK');
  });

  it('renders a before → after diff, not prose', () => {
    expect(text(html)).toContain('₹2,00,000 → ₹2,80,000');
  });

  it('marks the low-confidence row rather than hiding it', () => {
    expect(text(html)).toContain('unsure — check me');
    expect(text(html)).toContain('Task "Wiring"');
    expect(text(html)).toContain('confident');
  });

  it('states reversibility on the block itself', () => {
    expect(text(html)).toContain('Nothing is written until you confirm');
    expect(text(html)).toContain('Undo stays available for 24 hours');
  });

  it('offers the three actions and the keyboard hint', () => {
    expect(text(html)).toContain('Confirm all');
    expect(text(html)).toContain('⌘↵ to confirm');
  });
});

describe('write-gating — the block never writes', () => {
  it('a freshly proposed set is inert until confirmed', () => {
    const changeSet = set([row()]);
    expect(changeSet.confirmedAt).toBeNull();
    expect(changeSet.confirmedBy).toBeNull();
  });

  it('applyChange refuses an unconfirmed set — the guarantee behind the block', () => {
    const store = {} as Parameters<typeof applyChange>[0];
    expect(() => applyChange(store, set([row()]), 'person-anil')).toThrow(/not confirmed/);
  });

  it('confirming stamps the set with a human and the fixed clock', () => {
    // What the block's confirm handler builds, asserted on its own so the
    // shape is pinned without needing a DOM to click in.
    const changeSet = set([row()]);
    const confirmed: ChangeSet = { ...changeSet, confirmedAt: NOW_ISO, confirmedBy: 'person-anil' };

    expect(confirmed.confirmedAt).toBe(NOW_ISO);
    expect(confirmed.confirmedBy).toBe('person-anil');
    // Same set, not a rebuilt one — the audit trail depends on the id.
    expect(confirmed.id).toBe(changeSet.id);
    expect(confirmed.changes).toBe(changeSet.changes);
  });
});

describe('no-AI rule #4 — never delete', () => {
  it('has no tag for a delete, because there is no delete op', () => {
    // Every op in the union, and what it shows as.
    expect(
      changeTag({
        op: 'create',
        entity: { kind: 'client', id: 'c', name: 'x', contact: null, archivedAt: null },
      }),
    ).toBe('NEW');
    expect(changeTag({ op: 'update', id: 'a', patch: {} })).toBe('EDIT');
    expect(changeTag({ op: 'confirm', id: 'a', field: 'amount' })).toBe('EDIT');
    expect(changeTag({ op: 'settle', id: 'a', amount: rupees(1), on: '2026-08-12' })).toBe('EDIT');
    expect(changeTag({ op: 'link', from: 'a', to: 'b', relation: 'gated-on' })).toBe('LINK');
    expect(changeTag({ op: 'unlink', from: 'a', to: 'b' })).toBe('UNLINK');
    expect(changeTag({ op: 'archive', id: 'a', reason: 'lost' })).toBe('ARCHIVE');
  });

  it('shows ARCHIVE, never DELETE', () => {
    const html = render(
      <ChangePreview
        changeSet={set([
          row({
            change: { op: 'archive', id: 'project-x', reason: 'lost' },
            before: 'in pipeline',
            after: 'archived · lost',
            label: 'HSR duplex',
          }),
        ])}
        onConfirm={() => {}}
      />,
    );
    expect(text(html)).toContain('ARCHIVE');
    expect(text(html)).not.toContain('DELETE');
  });
});

describe('states', () => {
  it('says nothing is pending rather than showing an empty frame', () => {
    const html = render(<ChangePreview changeSet={set([])} onConfirm={() => {}} />);
    expect(text(html)).toContain('Nothing to confirm');
    expect(text(html)).not.toContain('Confirm all');
  });

  it('uses the singular for one change', () => {
    const html = render(<ChangePreview changeSet={set([row()])} onConfirm={() => {}} />);
    expect(text(html)).toContain('1 change proposed');
  });

  it('hides Discard and Edit when the caller offers no handler', () => {
    const html = render(<ChangePreview changeSet={set([row()])} onConfirm={() => {}} />);
    expect(text(html)).toContain('Confirm all');
    expect(text(html)).not.toContain('Discard');
  });

  it('renders a creation with no before as a single line', () => {
    const html = render(
      <ChangePreview
        changeSet={set([row({ before: null, after: 'Sharma · ₹80,000 · out' })])}
        onConfirm={() => {}}
      />,
    );
    expect(text(html)).toContain('Sharma · ₹80,000 · out');
    expect(text(html)).not.toContain('→');
  });
});
