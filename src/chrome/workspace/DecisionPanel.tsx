/**
 * Needs a decision — spec §6.3, w08.
 *
 * "A persistent accent panel for anything unpriced or unapproved on this
 * project. In the demo this holds the unpriced change order — the margin-leak
 * story made visible."
 *
 * Persistent is the operative word: this panel does not dismiss. An unpriced
 * change order stops being shown when it is priced, not when it is acknowledged.
 * Pricing it is a write, so it proposes rather than acts (§8.2).
 */

import type { Decision } from '@/domain/selectors/workspace';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

export type DecisionPanelProps = {
  decisions: Decision[];
  subject: string;
  onPropose?: (changeSet: ChangeSet) => void;
};

export function DecisionPanel({ decisions, subject, onPropose }: DecisionPanelProps) {
  if (decisions.length === 0) return null;

  return (
    <section className="rounded-lg border border-brand bg-brand-soft">
      <h2 className="px-4 pt-3 font-medium text-brand text-xs uppercase tracking-wide">
        Needs a decision
      </h2>

      <ul className="divide-y divide-brand/15">
        {decisions.map((decision) => (
          <li key={decision.id} className="px-4 py-3">
            <p className="font-medium text-ink text-sm">{decision.title}</p>
            <p className="mt-0.5 text-mute text-sm">{decision.detail}</p>

            {onPropose ? (
              <button
                type="button"
                onClick={() =>
                  onPropose(
                    proposeChangeSet({
                      proposedBy: 'user',
                      source: null,
                      changes: [
                        {
                          // Pricing is the admin's judgement, so the proposal
                          // opens the question rather than answering it.
                          change: {
                            op: 'update',
                            id: decision.id,
                            patch: { status: 'on-track' },
                          },
                          before: 'unpriced',
                          after: 'priced — enter the amount before confirming',
                          label: `${subject} — ${decision.title}`,
                          confidence: 'low',
                        },
                      ],
                    }),
                  )
                }
                className="mt-2 cursor-pointer rounded border border-brand px-3 py-1 font-medium text-brand text-xs hover:bg-brand hover:text-white"
              >
                {decision.action}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
