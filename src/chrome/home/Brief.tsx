/**
 * The morning brief — spec §6.1.
 *
 * "Written as prose, not bullets, and never as a chat message — it is a report,
 * not a conversation." Hence a paragraph rather than a list, and the visible
 * "generated 07:40 · not a chat" so it is never mistaken for live chat.
 */

import type { Brief as BriefData } from '@/domain/selectors/home';
import { formatLongDate, TODAY } from '@/lib/dates';

export function Brief({ brief }: { brief: BriefData }) {
  return (
    <section className="rounded-md border border-brand bg-brand-soft/40 px-5 py-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-medium text-brand text-xs uppercase tracking-wide">The brief</h2>
        <span className="text-faint text-xs">generated {brief.generatedAt} · not a chat</span>
      </div>

      <p className="text-base text-ink leading-relaxed">{brief.sentences.join(' ')}</p>

      {brief.caveat ? <p className="mt-2 text-mute text-sm italic">{brief.caveat}</p> : null}
    </section>
  );
}

/** "Tuesday, 12 August · Good morning, Anil" — the page's own header. */
export function BriefHeader({ name }: { name: string }) {
  return (
    <div>
      <h1 className="font-display text-ink text-xl">{formatLongDate(TODAY)}</h1>
      <p className="text-mute text-sm">Good morning, {name}</p>
    </div>
  );
}
