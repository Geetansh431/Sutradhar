/**
 * The question panel — spec §5.3, §5.4.
 *
 * "Maximum five questions visible. Each has tappable answers and a skip. Never
 * a text field where a choice would do."
 *
 * That last rule is why every question here is options-only. A free-text box
 * would be faster to build and would quietly move the work back onto the user,
 * which is the thing §1.3 says loses the buyer.
 */

import type { InterviewQuestion } from '@/fixtures/ingestion';

export function InterviewPanel({
  questions,
  answered,
  total,
  onAnswer,
  onSkip,
  /** Firm Memory heads the same panel "Fill a gap" (§6.8). */
  title,
  subtitle,
}: {
  questions: InterviewQuestion[];
  answered: Record<string, string>;
  total: number;
  onAnswer: (question: InterviewQuestion, option: string) => void;
  onSkip: (question: InterviewQuestion) => void;
  title?: string;
  subtitle?: string;
}) {
  const answeredCount = Object.keys(answered).length;

  return (
    <section className="rounded-md border border-brand">
      <header className="bg-brand-soft px-4 py-3">
        <h2 className="font-medium text-brand text-sm uppercase tracking-wide">
          {title ?? 'What I still need from you'} ·{' '}
          {subtitle ?? `${questions.length} of ${total - answeredCount}`}
        </h2>
      </header>

      <div className="space-y-3 p-4">
        <p className="text-mute text-sm">
          {subtitle
            ? 'Only you can answer these. Each one unblocks something concrete.'
            : `Only you know these. ${questions.length} at a time, 40 seconds.`}
        </p>

        {questions.length === 0 ? (
          <p className="py-6 text-center text-mute text-sm">
            Nothing left to ask right now. More surface as the firm changes.
          </p>
        ) : (
          <ul className="space-y-2">
            {questions.map((question) => (
              <li key={question.id} className="rounded-md border border-line bg-panel px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{question.text}</p>
                  <button
                    type="button"
                    onClick={() => onSkip(question)}
                    className="shrink-0 cursor-pointer text-faint text-sm hover:text-ink"
                  >
                    skip
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onAnswer(question, option)}
                      className="cursor-pointer rounded-full border border-line px-3 py-1 text-ink text-sm hover:border-brand hover:text-brand"
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* "Each question states what it unblocks — motivation is the
                    point" (§6.8). */}
                <p className="mt-2 text-faint text-xs">blocks: {question.unblocks.join(', ')}</p>
              </li>
            ))}
          </ul>
        )}

        <p className="text-faint text-sm">
          Questions are generated from what the documents could not answer.
        </p>
      </div>
    </section>
  );
}
