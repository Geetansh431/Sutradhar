/**
 * The pulse cards — spec §6.1.
 *
 * "Four figures maximum ... Each is a link into a pre-filtered view. Numbers
 * only — no sparklines, no deltas, no decoration." The restraint is the
 * specification, so this component deliberately offers nowhere to add one.
 */

import { Link } from 'react-router';
import type { Pulse } from '@/domain/selectors/home';
import { cn } from '@/lib/cn';
import { formatShortINR } from '@/lib/money';
import { useScenarioPath } from '@/lib/scenarioLink';

type Tone = 'ok' | 'plain' | 'alert';

type Card = { figure: string; label: string; to: string; tone: Tone };

const toneClass = (tone: Tone): string =>
  tone === 'ok' ? 'text-ok' : tone === 'alert' ? 'text-brand' : 'text-ink';

export function PulseCards({ pulse }: { pulse: Pulse }) {
  const link = useScenarioPath();
  const cards: Card[] = [
    {
      figure: formatShortINR(pulse.collectibleThisWeek),
      label: 'collectible this week',
      to: '/money',
      tone: 'ok',
    },
    {
      figure: formatShortINR(pulse.payableIn14Days),
      label: 'payable in 14 days',
      to: '/money',
      tone: 'plain',
    },
    {
      figure: String(pulse.coverageGapsAhead),
      label: pulse.coverageGapsAhead === 1 ? 'coverage gap ahead' : 'coverage gaps ahead',
      to: '/money',
      tone: pulse.coverageGapsAhead > 0 ? 'alert' : 'plain',
    },
    {
      figure: String(pulse.liveSites),
      label: pulse.liveSites === 1 ? 'site live' : 'sites live',
      to: '/projects',
      tone: 'plain',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          to={link(card.to)}
          className="rounded-md border border-line bg-paper px-4 py-3 transition-colors hover:border-line-strong"
        >
          <p className={cn('tabular font-display text-2xl', toneClass(card.tone))}>{card.figure}</p>
          <p className="mt-0.5 text-mute text-sm">{card.label}</p>
        </Link>
      ))}
    </div>
  );
}
