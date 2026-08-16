/**
 * The AI panel — spec §7.2, left of the Canvas.
 *
 * "The question, the answer in prose, caveats, and suggested follow-ups."
 *
 * Prose is bounded at roughly 120 words: "if the answer needs more, it belongs
 * in a block, not a paragraph". Caveats are mandatory when any figure is
 * unconfirmed and they name which one — the resolver builds them, this only
 * renders them, so the rule cannot be forgotten at the view layer.
 */

import type { ResolvedAnswer } from '@/canvas/resolver';

const WORD_LIMIT = 120;

const wordCount = (sentences: string[]): number =>
  sentences.join(' ').trim().split(/\s+/).filter(Boolean).length;

export function AiPanel({ question, answer }: { question: string; answer: ResolvedAnswer }) {
  const words = wordCount(answer.narrative);

  return (
    <section className="rounded-md border border-line bg-panel p-4">
      <h2 className="mb-3 font-medium text-ink text-xs uppercase tracking-wide">AI panel</h2>

      <p className="rounded-md border border-line bg-paper px-3 py-2 text-ink">{question}</p>

      <p className="mt-4 font-medium text-brand text-xs uppercase tracking-wide">Sutradhar</p>
      <div className="mt-1 space-y-3">
        {answer.narrative.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="text-ink text-sm leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Over the bound means it belonged in a block. Visible in the lab so it
          is caught in review rather than shipped. */}
      {words > WORD_LIMIT ? (
        <p className="mt-2 text-faint text-xs">
          {words} words — over the {WORD_LIMIT}-word bound; this belongs in a block.
        </p>
      ) : null}

      {answer.caveats.length > 0 ? (
        <div className="mt-4 rounded-md border border-warn/60 bg-warn-soft/40 px-3 py-2">
          {answer.caveats.map((caveat) => (
            <p key={caveat.slice(0, 40)} className="font-medium text-sm text-warn">
              {caveat}
            </p>
          ))}
        </div>
      ) : null}

      {/* "Three, generated from the data actually retrieved, never generic." */}
      <p className="mt-4 font-medium text-faint text-xs uppercase tracking-wide">Suggested next</p>
      <ul className="mt-2 space-y-2">
        {answer.followUps.map((followUp) => (
          <li key={followUp}>
            <span className="block rounded-full border border-line px-3 py-1.5 text-ink text-sm">
              {followUp}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 rounded-full border border-brand/50 px-3 py-1.5 text-faint text-sm">
        Ask a follow-up, or capture something…
      </p>
    </section>
  );
}
