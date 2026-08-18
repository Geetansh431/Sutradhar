/**
 * Canvas — spec §7, wireframes w11 and w12.
 *
 * "The screen the product is bought for." AI panel left, co-panel right, and
 * inside the co-panel the layout law (§7.3): answer top-left, evidence right
 * column full height, working area centre-left, actions bottom strip.
 *
 * The zones are fixed here, in the grid. Composition varies by plan; position
 * cannot vary at all, because that is the whole mitigation against losing
 * spatial memory on a composed surface.
 */

import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { isCapture, planFor } from '@/canvas/planner';
import { questionById } from '@/canvas/questions';
import { resolve } from '@/canvas/resolver';
import { AiPanel } from '@/chrome/canvas/AiPanel';
import { CannotAnswer } from '@/chrome/canvas/CannotAnswer';
import { CoPanel } from '@/chrome/canvas/CoPanel';
import { canSeeMoney } from '@/domain/selectors/role';
import type { Document, EntityId } from '@/domain/types';
import { nowISO } from '@/lib/dates';
import { applyChange, type ChangeSet } from '@/store/change';
import { type CoverageByArea, type EntityTable, useStore } from '@/store/store';

export type CanvasProps = {
  /** See `MoneyProps` — a static render never sees a store reset. */
  stateOverride?: {
    entities: EntityTable;
    documents: Document[];
    currentUserId: EntityId | null;
    /** Only the gap block reads these; omitted, they come from the store. */
    coverageByArea?: CoverageByArea;
    onboarding?: { answered: Record<string, string>; skipped: Record<string, number> };
  };
  questionId?: string;
};

export function Canvas({ stateOverride, questionId: questionProp }: CanvasProps = {}) {
  const { questionId: routeQuestionId } = useParams();
  const storeEntities = useStore((s) => s.entities);
  const storeDocuments = useStore((s) => s.documents);
  const storeUserId = useStore((s) => s.currentUserId);
  const storeCoverage = useStore((s) => s.coverageByArea);
  const storeOnboarding = useStore((s) => s.onboarding);
  const pin = useStore((s) => s.pin);

  const entities = stateOverride?.entities ?? storeEntities;
  const documents = stateOverride?.documents ?? storeDocuments;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  // The gap block needs what the firm knows it does not know. Read here rather
  // than resolved, because a gap is not a figure — it is the absence of one.
  const gapState = {
    coverageByArea: stateOverride?.coverageByArea ?? storeCoverage,
    onboarding: stateOverride?.onboarding ?? {
      answered: storeOnboarding.answered,
      skipped: storeOnboarding.skipped,
    },
  };

  const [pending, setPending] = useState<ChangeSet | null>(null);
  const [pinned, setPinned] = useState(false);

  const questionId = questionProp ?? routeQuestionId ?? '';
  const question = questionById(questionId);
  const seesMoney = canSeeMoney({ entities, currentUserId });

  const answer = useMemo(() => {
    const plan = planFor(questionId);
    if (!plan) return null;
    return resolve({ entities, documents }, plan);
  }, [questionId, entities, documents]);

  // §7.7's three failures, each with its own response.
  if (!question) {
    return <CannotAnswer kind="unknown" questionId={questionId} />;
  }
  if (isCapture(questionId)) {
    return <CannotAnswer kind="capture" questionId={questionId} />;
  }
  if (!seesMoney) {
    return <CannotAnswer kind="out-of-scope" questionId={questionId} />;
  }
  if (!answer) {
    return <CannotAnswer kind="no-data" questionId={questionId} question={question.text} />;
  }

  const confirm = (confirmed: ChangeSet) => {
    applyChange(useStore.getState(), confirmed, currentUserId ?? 'person-anil');
    setPending(null);
  };

  const onPin = () => {
    setPinned(true);
    pin({
      id: `pin-${questionId}`,
      name: question.text.replace(/\?$/, ''),
      questionId,
      ownerId: currentUserId ?? 'person-anil',
      containsMoney: question.group === 'money',
      pinnedAt: nowISO(),
    });
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-4 px-6 py-6 lg:grid-cols-[22rem_1fr]">
      <AiPanel question={question.text} answer={answer} />
      <CoPanel
        answer={answer}
        entities={entities}
        gapState={gapState}
        pending={pending}
        pinned={pinned}
        onPropose={setPending}
        onConfirm={confirm}
        onDiscard={() => setPending(null)}
        onPin={onPin}
      />
    </main>
  );
}
