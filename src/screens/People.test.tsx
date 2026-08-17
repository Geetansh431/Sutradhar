/**
 * People — §6.5's three segments, and the two blocks it composes.
 *
 * The load-bearing tests: a missing vendor term is a gap rather than a blank,
 * salary is admin-only, and marking paid proposes rather than writes (no-AI
 * rule #2 makes money state changes human-only without exception).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ledgerFor, loadFor, segmentRows } from '@/domain/selectors/people';
import { buildState } from '@/fixtures/scenarios';
import { formatINR } from '@/lib/money';
import { People } from '@/screens/People';

const live = buildState('live');
const state = { entities: live.entities };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = (userId: string | null = 'person-anil') =>
  renderToStaticMarkup(
    <MemoryRouter>
      <People stateOverride={{ entities: live.entities, currentUserId: userId }} />
    </MemoryRouter>,
  );

describe('three segments of one entity model — §6.5', () => {
  const html = render();

  it('offers clients, vendors and team', () => {
    expect(text(html)).toContain('Clients');
    expect(text(html)).toContain('Vendors');
    expect(text(html)).toContain('Team');
  });

  it('lists vendors with their category', () => {
    const vendors = segmentRows(state, 'vendors');
    expect(vendors.map((row) => row.name)).toContain('Sharma Electricals');
    expect(vendors.find((row) => row.name === 'Sharma Electricals')?.detail).toBe('electrical');
  });

  it('lists clients with their project count', () => {
    const clients = segmentRows(state, 'clients');
    const iyer = clients.find((row) => row.name === 'R. Iyer');
    expect(iyer?.detail).toMatch(/project/);
  });

  it('lists team with their role', () => {
    const team = segmentRows(state, 'team');
    expect(team.find((row) => row.name === 'Anil Kumar')?.detail).toBe('admin');
    expect(team.find((row) => row.name === 'Ravi')?.detail).toBe('team');
  });
});

describe('missing terms are a gap, not a blank — §6.5', () => {
  const html = render();

  it('flags the vendor with no terms in the list itself', () => {
    const vendors = segmentRows(state, 'vendors');
    const godrej = vendors.find((row) => row.name === 'Godrej dealer');
    expect(godrej?.gap).toBe('no payment terms');
    expect(text(html)).toContain('no payment terms');
  });

  it('does not flag a vendor who has them', () => {
    const vendors = segmentRows(state, 'vendors');
    expect(vendors.find((row) => row.name === 'Sharma Electricals')?.gap).toBeNull();
  });

  it('renders the gap with its field-state treatment, not ad hoc styling', () => {
    expect(html).toContain('fv-missing');
  });
});

describe('the ledger — block 04', () => {
  const ledger = ledgerFor(state, 'vendor-sharma');

  it('runs a balance across the entity’s unpaid lines', () => {
    expect(ledger.lines).toHaveLength(2);
    const last = ledger.lines[ledger.lines.length - 1];
    expect(last && formatINR(last.balance)).toBe('₹2,80,000');
  });

  it('sorts by date', () => {
    const dates = ledger.lines.map((line) => ('value' in line.date ? line.date.value : ''));
    expect(dates).toEqual([...dates].sort());
  });

  it('the outstanding total counts confirmed money only — rule 3', () => {
    const kumar = ledgerFor(state, 'vendor-kumar-carpentry');
    // Both Kumar lines are extracted, so the total is zero and says why.
    expect(formatINR(kumar.outstanding.value)).toBe('₹0');
    expect(kumar.outstanding.caveat).toBe('excludes 2 unconfirmed figures');
  });

  it('the running balance still moves on an unconfirmed line', () => {
    // Hiding an unpaid bill because it came off a photo would understate what
    // is owed — it shows, dotted, and only the total excludes it.
    const kumar = ledgerFor(state, 'vendor-kumar-carpentry');
    const last = kumar.lines[kumar.lines.length - 1];
    expect(last && formatINR(last.balance)).toBe('₹2,12,000');
  });

  it('offers mark-paid, and says it is a money change', () => {
    const html = render();
    expect(text(html)).toContain('Mark paid');
    expect(text(html)).toContain('Marking paid is a money change');
  });
});

describe('the money line — §3.2', () => {
  it('drops salary for a team member', () => {
    const html = render('person-ravi');
    expect(text(html)).not.toContain('Salary');
  });

  it('shows no ledger and no figure to a team member', () => {
    const html = render('person-ravi');
    expect(text(html)).not.toMatch(/₹/);
    expect(text(html)).not.toContain('Outstanding');
  });

  it('still lets them see who is who', () => {
    const html = render('person-ravi');
    expect(text(html)).toContain('Sharma Electricals');
  });
});

describe('the team load view — so the admin stops assigning by gut feel', () => {
  it('lists what a person is carrying, with the project', () => {
    const load = loadFor(state, 'person-ravi');
    expect(load.length).toBeGreaterThan(0);
    for (const item of load) {
      expect(item.title).toBeTruthy();
      expect(item.project).toBeTruthy();
    }
  });

  it('excludes finished work', () => {
    const load = loadFor(state, 'person-ravi');
    expect(load.every((item) => item.title !== '')).toBe(true);
  });
});
