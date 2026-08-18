/**
 * Onboarding — spec §5, wireframe w04.
 *
 * "Ingestion left, elicitation right, honesty along the bottom."
 *
 * The three rules of §5.1 are the whole design:
 *   never blocks   — the skip route is on screen at all times, phrased as
 *                    reassurance rather than escape
 *   never finishes — this surface dissolves into Firm Memory; the coverage
 *                    panel here is the same component that lives there
 *   never pretends — coverage is a real number from the first minute
 *
 * Extraction is pre-computed (§5.7). Dropping replays a known result at a
 * realistic pace; nothing is parsed, so nothing can fail in front of an
 * advisor.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useScenarioPath } from '@/lib/scenarioLink';
import { CoveragePanel } from '@/chrome/CoveragePanel';
import { DropZone } from '@/chrome/onboarding/DropZone';
import { IngestedList } from '@/chrome/onboarding/IngestedList';
import { InterviewPanel } from '@/chrome/onboarding/InterviewPanel';
import {
  BUNDLE,
  BUNDLE_FILE_COUNT,
  INTERVIEW,
  INTERVIEW_TOTAL,
  INTERVIEW_VISIBLE,
  type InterviewQuestion,
} from '@/fixtures/ingestion';
import { useStore } from '@/store/store';

const STEP_LABEL = {
  seed: 'Seed',
  extract: 'Extracting',
  interview: 'Interview',
  done: 'Complete enough to work',
} as const;

const STEP_NUMBER = { seed: 1, extract: 2, interview: 3, done: 4 } as const;

export function Onboarding() {
  const onboarding = useStore((s) => s.onboarding);
  const coverageByArea = useStore((s) => s.coverageByArea);
  const answerQuestion = useStore((s) => s.answerQuestion);
  const skipQuestion = useStore((s) => s.skipQuestion);
  const link = useScenarioPath();
  const setStep = useStore((s) => s.setOnboardingStep);
  const markIngested = useStore((s) => s.markIngested);

  /** Ids whose replayed ingestion has landed. */
  const [settled, setSettled] = useState<ReadonlySet<string>>(new Set());
  const [dropped, setDropped] = useState(false);

  // The replay. Each row lands at its own pace, so the list fills the way a
  // real parse would rather than appearing at once.
  useEffect(() => {
    if (!dropped) return;
    const timers = BUNDLE.map((file) =>
      globalThis.setTimeout(() => {
        setSettled((current) => new Set(current).add(file.id));
        // The bars move as the rows land — the 1:15 beat, "watch coverage move".
        markIngested(file.id, file.adds);
      }, file.settlesAt),
    );
    const toInterview = globalThis.setTimeout(() => setStep('interview'), 4600);
    return () => {
      for (const timer of timers) globalThis.clearTimeout(timer);
      globalThis.clearTimeout(toInterview);
    };
  }, [dropped, setStep, markIngested]);

  const onDrop = () => {
    setDropped(true);
    setStep('extract');
  };

  /**
   * The next five to ask. A question already answered is gone; one skipped
   * twice is retired rather than nagging (§5.3).
   */
  const questions = useMemo(
    () =>
      INTERVIEW.filter(
        (question) =>
          onboarding.answered[question.id] === undefined &&
          (onboarding.skipped[question.id] ?? 0) < 2,
      ).slice(0, INTERVIEW_VISIBLE),
    [onboarding.answered, onboarding.skipped],
  );

  const onAnswer = (question: InterviewQuestion, option: string) =>
    answerQuestion(question.id, option, question.area);

  const step = dropped ? onboarding.step : 'seed';

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-ink text-xl">Set up your firm</h1>
          <p className="text-mute text-sm">
            Step {STEP_NUMBER[step]} of 4 · {STEP_LABEL[step]} · you can start using Sutradhar now
          </p>
        </div>

        {/* Persistent, and phrased as reassurance rather than escape (§5.3). */}
        <Link to={link('/')} className="font-medium text-ok text-sm hover:underline">
          You can skip all of this — Sutradhar already works →
        </Link>
      </header>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Ingestion, left. */}
        <div className="space-y-4">
          <DropZone onDrop={onDrop} />
          {dropped ? (
            <IngestedList files={BUNDLE} settled={settled} totalFiles={BUNDLE_FILE_COUNT} />
          ) : (
            <p className="text-faint text-sm">
              Nothing ingested yet. Drop a folder in — no sorting, no naming convention, no setup
              call.
            </p>
          )}
        </div>

        {/* Elicitation, right. Honesty along the bottom. */}
        <div className="space-y-4">
          <InterviewPanel
            questions={questions}
            answered={onboarding.answered}
            total={INTERVIEW_TOTAL}
            onAnswer={onAnswer}
            onSkip={(question) => skipQuestion(question.id)}
          />
          <CoveragePanel coverage={coverageByArea} />
        </div>
      </div>
    </main>
  );
}
