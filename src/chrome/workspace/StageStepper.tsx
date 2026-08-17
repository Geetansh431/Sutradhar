/**
 * The stage stepper — spec §6.3, w08.
 *
 * "The firm's own lifecycle, not an abstract kanban." Eight stages, completed
 * in green, current in accent, the rest waiting. The order comes from the
 * selector, so a stage cannot be drawn out of sequence here.
 */

import type { StageStep } from '@/domain/selectors/workspace';
import { cn } from '@/lib/cn';

export function StageStepper({ steps }: { steps: StageStep[] }) {
  return (
    <section className="rounded-lg border border-line bg-fill-1 px-4 py-3">
      <h2 className="mb-3 font-medium text-faint text-xs uppercase tracking-wide">Stage</h2>

      <ol className="flex items-start justify-between gap-1">
        {steps.map((step, index) => (
          <li key={step.stage} className="relative flex flex-1 flex-col items-center gap-2">
            {/* The rail between dots, drawn behind and only between them. */}
            {index > 0 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute top-[7px] right-1/2 left-[-50%] h-px',
                  step.state === 'ahead' ? 'bg-line' : 'bg-ok',
                )}
              />
            ) : null}

            <span
              aria-hidden
              className={cn(
                'relative z-10 size-3.5 rounded-full border-2',
                step.state === 'done' && 'border-ok bg-ok',
                step.state === 'current' && 'border-brand bg-brand',
                step.state === 'ahead' && 'border-line bg-bg',
              )}
            />

            <span
              className={cn(
                'text-center text-xs',
                step.state === 'done' && 'text-ok',
                step.state === 'current' && 'font-medium text-brand',
                step.state === 'ahead' && 'text-faint',
              )}
            >
              {step.label}
              {step.state === 'current' ? <span className="sr-only"> — current stage</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
