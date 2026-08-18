/**
 * Firm Memory — spec §6.8, wireframe w10.
 *
 * "Where onboarding goes to live permanently, and the screen that most directly
 * expresses the product's honesty."
 *
 * §5.1's second rule says onboarding never finishes — it dissolves into this
 * screen. That is why `CoveragePanel` and the interview here are the same
 * components onboarding uses, not lookalikes: the surface genuinely continues
 * rather than being rebuilt.
 *
 * Every number is derived. Hardcoding "58%" would put the one lie in the
 * product on its most honest screen.
 */

import { useMemo, useState } from 'react';
import { Gap } from '@/blocks/Gap';
import { CoveragePanel } from '@/chrome/CoveragePanel';
import { InterviewPanel } from '@/chrome/onboarding/InterviewPanel';
import {
  coverageHeader,
  openGaps,
  shortfallReasons,
  sourceCounts,
  whatChanged,
} from '@/domain/selectors/memory';
import { type CoverageArea, gapsInArea } from '@/domain/selectors/gaps';
import type { InterviewQuestion } from '@/fixtures/ingestion';
import { cn } from '@/lib/cn';
import { type AppState, useStore } from '@/store/store';

export type FirmMemoryProps = {
  /** See `MoneyProps` — a static render never sees a store reset. */
  stateOverride?: AppState;
};

const percent = (value: number): string => `${Math.round(value * 100)}%`;

export function FirmMemory({ stateOverride }: FirmMemoryProps = {}) {
  const storeState = useStore((s) => s);
  const answerQuestion = useStore((s) => s.answerQuestion);
  const skipQuestion = useStore((s) => s.skipQuestion);

  const state = stateOverride ?? storeState;

  // §6.8's "clicking an area opens the gaps behind it" — one area at a time,
  // and clicking the open one closes it.
  const [area, setArea] = useState<CoverageArea | null>(null);

  const view = useMemo(
    () => ({
      header: coverageHeader(state),
      reasons: shortfallReasons(state),
      sources: sourceCounts(state),
      gaps: openGaps(state),
      changed: whatChanged(state),
    }),
    [state],
  );

  const onAnswer = (question: InterviewQuestion, option: string) =>
    answerQuestion(question.id, option, question.area);

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">Firm Memory</h1>
        <p className="text-mute text-sm">
          What Sutradhar knows, what it doesn't, and where it came from
        </p>
      </header>

      {/* Coverage header — framed as progress, never as failure (§6.8). */}
      <section className="rounded-md border border-ok/50 bg-ok-soft/40 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-ok">
              Firm coverage {percent(view.header.percent)}
            </h2>
            <p className="mt-1 text-mute text-sm">
              Up from {percent(view.header.fromOnboarding)} at onboarding.{' '}
              {view.header.confirmedThisMonth} facts confirmed this month.{' '}
              {view.header.onlyInYourHead} still only in your head.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <span className="block h-2.5 overflow-hidden rounded-full bg-fill-2">
              <span
                className="block h-full rounded-full bg-ok"
                style={{ width: percent(view.header.percent) }}
              />
            </span>
            <p className="mt-1 text-right text-mute text-xs">
              target for a confident month-end: {percent(view.header.target)}
            </p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Coverage by area, with a reason under each shortfall. */}
        <div className="space-y-4">
          <CoveragePanel
            coverage={state.coverageByArea}
            title="Coverage by area"
            reasons={view.reasons}
            onSelectArea={(area) => setArea((current) => (current === area ? null : area))}
            selectedArea={area}
          />

          {/* §6.8: "Clicking an area opens the gaps behind it." Read-only —
              "Fill a gap" below owns answering, because it also owns skipping,
              and §5.3's "asked twice, skipped twice" needs somewhere to happen. */}
          {area ? (
            <section className="rounded-md border border-line bg-panel p-4">
              <Gap
                view={gapsInArea(
                  {
                    entities: state.entities,
                    coverageByArea: state.coverageByArea,
                    onboarding: state.onboarding,
                  },
                  area,
                )}
              />
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          {/* The interview, permanently available (§6.8). */}
          <InterviewPanel
            questions={view.gaps}
            answered={state.onboarding.answered}
            total={view.gaps.length}
            onAnswer={onAnswer}
            onSkip={(question) => skipQuestion(question.id)}
            title="Fill a gap"
            subtitle={`${view.gaps.length} questions, 30 seconds`}
          />

          {/* Sources — including what could not be read, and why. */}
          <section className="rounded-md border border-line bg-panel p-4">
            <h2 className="mb-2 font-medium text-faint text-xs uppercase tracking-wide">Sources</h2>
            <p className="text-ink text-sm">
              {view.sources.documents} documents · {view.sources.exports} WhatsApp export ·{' '}
              {view.sources.humanAnswers} answers from you
            </p>
            {view.sources.unreadable > 0 ? (
              <p className="mt-1 text-brand text-sm">
                {view.sources.unreadable} file{view.sources.unreadable === 1 ? '' : 's'} unreadable
                {view.sources.unreadableReason ? ` — ${view.sources.unreadableReason}` : ''}
              </p>
            ) : null}
          </section>
        </div>
      </div>

      {/* What changed — including the uncomfortable line. */}
      <section className="rounded-md border border-line bg-panel p-4">
        <h2 className="mb-3 font-medium text-faint text-xs uppercase tracking-wide">
          What changed this week
        </h2>
        <ul className="space-y-2">
          {view.changed.map((entry) => (
            <li key={`${entry.day}-${entry.what}`} className="flex items-baseline gap-4 text-sm">
              <span className="w-10 shrink-0 font-medium text-brand">{entry.day}</span>
              <span className="min-w-0 flex-1 text-ink">{entry.what}</span>
              <span
                className={cn(
                  'tabular shrink-0 font-medium',
                  entry.delta > 0 ? 'text-ok' : 'text-faint',
                )}
              >
                {entry.delta > 0 ? `+${entry.delta}%` : '0%'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
