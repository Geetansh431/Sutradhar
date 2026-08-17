/**
 * The pipeline board — spec §6.2, wireframe w07.
 *
 * "Board columns: Enquiry → Feasibility → Quoted → Negotiating. Card: name,
 * estimated value, likelihood, and one line of state. Ageing is shown in accent
 * when it exceeds the firm's own historical pattern."
 *
 * The heading above it is the point of the whole screen: every field on these
 * cards currently lives only in the founder's memory.
 */

import { PIPELINE_STAGES, type PipelineCard, STAGE_LABEL } from '@/domain/selectors/projects';
import type { PipelineStage } from '@/domain/types';
import { cn } from '@/lib/cn';
import { hasValue } from '@/lib/field';
import { formatShortINR } from '@/lib/money';

function Card({ card, onOpen }: { card: PipelineCard; onOpen?: (id: string) => void }) {
  const value = hasValue(card.value) ? formatShortINR(card.value.value) : '—';
  const likelihood =
    card.likelihood && hasValue(card.likelihood)
      ? `${Math.round(card.likelihood.value * 100)}% likely`
      : 'unassessed';

  return (
    <button
      type="button"
      onClick={onOpen ? () => onOpen(card.id) : undefined}
      className={cn(
        'w-full rounded-md border border-line bg-paper px-3 py-2.5 text-left',
        onOpen && 'cursor-pointer hover:border-line-strong',
      )}
    >
      <p className="font-medium text-ink">{card.name}</p>
      <p className="mt-0.5 text-mute text-sm">
        <span className="tabular">{value}</span>
        {card.likelihood?.state === 'missing' ? ' est · ' : ' est · '}
        <span className={card.likelihood?.state === 'missing' ? 'fv-missing' : ''}>
          {likelihood}
        </span>
      </p>

      {/* One line of state. Ageing and a missing follow-up read in accent — the
          two things §6.2 wants visible without being opened. */}
      <p
        className={cn(
          'mt-0.5 text-sm',
          card.ageing || !card.hasFollowUp ? 'text-brand' : 'text-faint',
        )}
      >
        {card.note ?? (card.hasFollowUp ? 'follow-up booked' : 'no follow-up set')}
      </p>
    </button>
  );
}

export function PipelineBoard({
  board,
  onOpen,
}: {
  board: Record<PipelineStage, PipelineCard[]>;
  onOpen?: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-medium text-faint text-xs uppercase tracking-wide">
        Pipeline — stage 1, before conversion ·{' '}
        <span className="normal-case">every field here lives only in memory today</span>
      </p>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PIPELINE_STAGES.map((stage) => (
          <section key={stage} className="rounded-md border border-line bg-panel p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <h3
                className={cn(
                  'font-medium text-xs uppercase tracking-wide',
                  stage === 'quoted'
                    ? 'text-warn'
                    : stage === 'negotiating'
                      ? 'text-brand'
                      : 'text-faint',
                )}
              >
                {STAGE_LABEL[stage]}
              </h3>
              <span className="tabular text-faint text-sm">{board[stage].length}</span>
            </div>

            <div className="space-y-2">
              {board[stage].map((card) => (
                <Card key={card.id} card={card} {...(onOpen ? { onOpen } : {})} />
              ))}
              {board[stage].length === 0 ? (
                <p className="py-4 text-center text-faint text-xs">Nothing here</p>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
