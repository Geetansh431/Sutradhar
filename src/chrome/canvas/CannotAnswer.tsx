/**
 * When the Canvas cannot answer — spec §7.7.
 *
 * "Three distinct failures, three distinct responses. Never a generic apology,
 * and never a fabricated answer."
 *
 *   no-data      — say so, name what is missing, offer the gap question inline.
 *                  "The failure becomes a data-entry moment."
 *   ambiguous    — offer the readings as buttons. Never an open-ended question.
 *   out-of-scope — state plainly that it is admin-only. Never hint at the
 *                  figure, never say "approximately".
 *
 * A fourth case is local: a question with no plan at all. It is the honest
 * boundary of a canned prototype, and it says that rather than pretending.
 */

import { Link } from 'react-router';
import { QUESTIONS } from '@/canvas/questions';

export type FailureKind = 'no-data' | 'ambiguous' | 'out-of-scope' | 'capture' | 'unknown';

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-display text-ink text-xl">{title}</h1>
      <div className="mt-3 space-y-3 text-mute text-sm">{children}</div>
    </main>
  );
}

export function CannotAnswer({
  kind,
  questionId,
  question,
}: {
  kind: FailureKind;
  questionId: string;
  question?: string;
}) {
  if (kind === 'out-of-scope') {
    // Plainly, and without hinting at the figure.
    return (
      <Frame title="This one is admin-only">
        <p>Firm money is not part of your view. Your sites and today's work are on Home.</p>
        <Link to="/" className="inline-block text-brand hover:underline">
          Back to Home →
        </Link>
      </Frame>
    );
  }

  if (kind === 'capture') {
    return (
      <Frame title="That is a capture, not a question">
        <p>
          “Sharma ka bill aa gaya, 80 hazaar, Iyer site” records something rather than asking
          something. It produces a change preview, which you confirm — there is no prose answer to
          give.
        </p>
        <p className="text-faint">
          The capture flow is not wired up yet, so this is where it would open.
        </p>
      </Frame>
    );
  }

  if (kind === 'no-data') {
    return (
      <Frame title="I cannot answer that one yet">
        {question ? <p className="text-ink">“{question}”</p> : null}
        <p>
          The question is one I take, but the blocks its answer needs are not built yet. Nothing is
          guessed in the meantime.
        </p>
        <Link to="/lab" className="inline-block text-brand hover:underline">
          See which blocks exist →
        </Link>
      </Frame>
    );
  }

  // No such question. Say what can be asked, rather than apologising.
  return (
    <Frame title="Nothing canned matches that">
      <p>
        This prototype answers a fixed set of questions
        {questionId ? ` — “${questionId}” is not one of them` : ''}. Nothing here improvises an
        answer.
      </p>
      <ul className="mt-2 space-y-1">
        {QUESTIONS.slice(0, 4).map((canned) => (
          <li key={canned.id}>
            <Link to={`/canvas/${canned.id}`} className="text-brand hover:underline">
              {canned.text}
            </Link>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
