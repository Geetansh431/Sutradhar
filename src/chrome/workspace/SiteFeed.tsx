/**
 * The site feed — spec §6.3, w08.
 *
 * "Latest photos and supervisor notes, newest first, with author and time."
 *
 * The photo tiles are placeholders on purpose: the prototype holds no images,
 * and a stock photograph of someone else's site would be the one dishonest
 * thing on the screen. The count is real; the tiles say only that there are
 * that many.
 */

import type { FeedItem } from '@/domain/selectors/workspace';
import { formatShortDate, formatTime } from '@/lib/dates';

export function SiteFeed({ items }: { items: FeedItem[] }) {
  return (
    <section className="rounded-lg border border-line">
      <h2 className="border-line border-b px-4 py-2 font-medium text-ink text-xs uppercase tracking-wide">
        Site feed
      </h2>

      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-mute text-sm">
          Nothing from site yet. A supervisor's photo or note appears here.
        </p>
      ) : (
        <ul className="divide-y divide-line/60">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3">
              <span aria-hidden className="flex shrink-0 gap-1">
                {Array.from({ length: Math.min(item.photoCount, 3) }, (_, index) => (
                  <span
                    // biome-ignore lint/suspicious/noArrayIndexKey: placeholder tiles carry no identity
                    key={index}
                    className="block size-9 rounded bg-fill-2"
                  />
                ))}
              </span>

              <div className="min-w-0">
                <p className="font-medium text-ink text-sm">
                  {item.author}, {formatTime(item.at)}
                </p>
                <p className="truncate text-mute text-sm">{item.text}</p>
                <p className="text-faint text-xs">
                  {formatShortDate(item.at.slice(0, 10))} ·{' '}
                  {item.photoCount === 1 ? '1 photo' : `${item.photoCount} photos`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
