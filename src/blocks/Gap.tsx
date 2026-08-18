/**
 * Block 10 — Gap block.
 *
 * "What is missing in this context, and what it blocks. Editing: answer
 * inline." (§8.1)
 *
 * A gap is not an empty state. An empty state says "nothing here"; a gap says
 * what is absent, what that absence costs, and offers to close it where it is
 * found. That third part is why this is a block rather than a message — §8.2
 * forbids a block that sends the user elsewhere to change something.
 *
 * Answering proposes (§8.2). The onboarding interview writes directly because
 * §5.3 is the user dictating their own facts into an empty firm; here the firm
 * already holds figures that an answer would move, so it goes through a preview
 * like every other write.
 */

import type { Gap as GapItem, GapView } from '@/domain/selectors/gaps';
import { cn } from '@/lib/cn';
import { type ChangeSet, proposeChangeSet } from '@/store/change';

export type GapProps = {
  view: GapView;
  /** Answering is a write, so a block without this is read-only (§8.2). */
  onPropose?: (changeSet: ChangeSet) => void;
  loading?: boolean;
  restricted?: boolean;
};

const answerChange = (gap: GapItem, option: string): ChangeSet['changes'][number] => ({
  // The answer lands on the entity the question was about. Where it targets
  // nothing, it is still recorded — a fact with no home is still a fact.
  change: gap.target
    ? { op: 'update', id: gap.target, patch: { [gap.id]: option } }
    : { op: 'confirm', id: gap.id, field: gap.id },
  before: 'not on file',
  after: option,
  label: gap.question,
  confidence: 'high',
});

function LoadingState() {
  const rows = ['a', 'b'];
  return (
    <output aria-label="Loading gaps" className="block space-y-2 py-2">
      {rows.map((row) => (
        <div key={row} className="h-14 animate-pulse rounded bg-fill-2" />
      ))}
    </output>
  );
}

export function Gap({ view, onPropose, loading = false, restricted = false }: GapProps) {
  if (restricted) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-mute text-sm">What is missing here is admin-only.</p>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium text-ink text-xs uppercase tracking-wide">
          What is missing · {view.subject}
        </span>
        {view.coverage !== null ? (
          <span className="text-faint text-xs">{Math.round(view.coverage * 100)}% covered</span>
        ) : null}
      </figcaption>

      {view.gaps.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-mute text-sm">Nothing missing here.</p>
          <p className="mt-1 text-faint text-xs">
            More surfaces as the firm changes — this is not a finished state.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {view.gaps.map((gap) => (
            <li key={gap.id} className="rounded-md border border-line bg-panel px-3 py-2.5">
              <p className="font-medium text-ink text-sm">{gap.question}</p>

              {/* The consequence, not the absence (§9.3). */}
              <p className="mt-0.5 text-faint text-xs">Blocks {gap.unblocks.join(' and ')}</p>

              {onPropose ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {gap.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        onPropose(
                          proposeChangeSet({
                            proposedBy: 'user',
                            source: null,
                            changes: [answerChange(gap, option)],
                          }),
                        )
                      }
                      className="cursor-pointer rounded-full border border-line px-3 py-1 text-ink text-xs hover:border-brand hover:text-brand"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <p className={cn('mt-1 text-faint text-xs')}>
                  {gap.options.length} tapped answers, on the screen that owns this.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* §5.3: skipped twice is retired, not re-asked. Counted so the firm can
          see what it has chosen not to close — a log that only showed progress
          would be marketing (§6.8). */}
      {view.declined > 0 ? (
        <p className="mt-2 text-faint text-xs">
          {view.declined} {view.declined === 1 ? 'question was' : 'questions were'} asked twice and
          skipped twice. Not asked again.
        </p>
      ) : null}

      {onPropose ? (
        <p className="mt-2 text-faint text-xs">
          Answering opens a preview — nothing is written until you confirm.
        </p>
      ) : null}
    </figure>
  );
}

export { LoadingState as GapLoading };
