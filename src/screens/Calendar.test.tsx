/**
 * Calendar — §6.7.
 *
 * Two things are worth testing hard: that it really is *one* axis (a task
 * deadline and a payment due date sit on the same list), and that the role cut
 * holds — §3.2 gives Team no money, so a team member's calendar must contain no
 * payment at all, not payments with the figures blanked.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { calendarItems } from '@/domain/selectors/calendar';
import { buildState } from '@/fixtures/scenarios';
import { Calendar } from '@/screens/Calendar';

const live = buildState('live');
const stateFor = (userId: string | null) => ({ entities: live.entities, currentUserId: userId });

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
      <Calendar stateOverride={stateFor(userId)} />
    </MemoryRouter>,
  );

describe('one axis for every deadline — §6.7', () => {
  const items = calendarItems(stateFor('person-anil'));

  it('carries tasks and payments on the same list', () => {
    const kinds = new Set(items.map((item) => item.kind));
    expect(kinds.has('task')).toBe(true);
    expect(kinds.has('payment')).toBe(true);
  });

  it('is sorted earliest first', () => {
    const dates = items.map((item) => item.date);
    expect([...dates].sort((a, b) => a.localeCompare(b))).toEqual(dates);
  });

  it('keeps an undated task off the axis rather than guessing a position', () => {
    // "Finishing" on Iyer has a missing deadline.
    expect(items.some((item) => item.title === 'Finishing')).toBe(false);
  });

  it('names a firm-level payment by its label, not "to someone"', () => {
    const salaries = items.find((item) => item.title === 'Team salaries');
    expect(salaries).toBeDefined();
    expect(items.every((item) => !item.title.includes('someone'))).toBe(true);
  });

  it('marks an inferred date uncertain so it is never shown as fact', () => {
    const boards = items.find((item) => item.title === 'Boards');
    expect(boards?.uncertain).toBe(true);
  });
});

describe('the role cut — §3.2', () => {
  it('builds no payment at all for Team', () => {
    const items = calendarItems(stateFor('person-ravi'));
    expect(items.every((item) => item.kind !== 'payment')).toBe(true);
  });

  it('leaks not one rupee figure into the Team render', () => {
    expect(render('person-ravi')).not.toMatch(/₹/);
  });

  it('still shows Team the task deadlines', () => {
    expect(text(render('person-ravi'))).toContain('Wiring');
  });

  it('drops the Payment filter for Team rather than offering an empty one', () => {
    const team = text(render('person-ravi'));
    expect(team).not.toContain('Payment');
    expect(team).toContain('Task');
    expect(text(render())).toContain('Payment');
  });
});

describe('Calendar — the screen', () => {
  it('renders the axis with both kinds on it', () => {
    const html = text(render());
    expect(html).toContain('Every deadline in the firm on one axis');
    expect(html).toContain('Wiring');
    expect(html).toContain('Sharma Electricals');
  });

  it('says items are created where they live — it is read-mostly', () => {
    expect(text(render())).toContain('items are created where they live');
  });
});
