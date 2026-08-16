/**
 * Today — spec §6.1. "Deadlines, site visits and due payments for the current
 * day only. Links into Calendar."
 *
 * Deliberately today-only. A panel that quietly showed tomorrow too would make
 * "your day is done" untrue.
 */

import { Link } from 'react-router';
import type { TodayItem } from '@/domain/selectors/home';

export function TodayPanel({ items }: { items: TodayItem[] }) {
  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <h2 className="mb-3 font-medium text-ink text-xs uppercase tracking-wide">Today</h2>

      {items.length === 0 ? (
        <p className="text-mute text-sm">Nothing scheduled today.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm">
              <span className="w-14 shrink-0 font-medium text-brand">{item.when}</span>
              <span className="text-ink">{item.what}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        to="/calendar"
        className="mt-3 inline-block border-line border-t pt-3 text-brand text-sm hover:underline"
      >
        Open full calendar →
      </Link>
    </section>
  );
}
