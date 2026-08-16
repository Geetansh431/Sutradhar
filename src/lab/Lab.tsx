/**
 * `/lab` — every block, in every state, on one page.
 *
 * This is the review surface, not a screen: no layout law, no chrome, no role
 * cut. A block is not finished until it renders here in all seven states, and
 * a screen may not compose a block that does not (`.claude/commands/block.md`).
 */

import { Link, useParams } from 'react-router';
import { readScenarioFromUrl } from '@/fixtures/scenarios';
import { LabTypeSpecimen } from '@/lab/LabType';
import { BLOCKS, type BlockId, builtCount, casesFor, STATES } from '@/lab/registry';
import { cn } from '@/lib/cn';
import { formatLongDate, TODAY } from '@/lib/dates';

function Header({ section }: { section: string | undefined }) {
  const scenario = readScenarioFromUrl();
  const built = builtCount();

  return (
    <header className="border-line border-b bg-panel px-6 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-ink text-xl">Lab</h1>
          <p className="text-mute text-sm">
            Every block, every state. {built} of {BLOCKS.length} blocks built.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="rounded border border-line bg-fill px-2 py-1 text-mute text-xs">
            Prototype · canned responses
          </span>
          <span className="text-faint">
            {formatLongDate(TODAY)} · scenario <span className="text-ink">{scenario}</span>
          </span>
        </div>
      </div>

      <nav className="mt-3 flex gap-1 text-sm">
        <LabTab to="/lab" label="Blocks" active={section === undefined} />
        <LabTab to="/lab/type" label="Type" active={section === 'type'} />
      </nav>
    </header>
  );
}

function LabTab({ to, label, active }: { to: string; label: string; active?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'rounded px-3 py-1.5 transition-colors',
        active ? 'bg-brand-soft text-brand' : 'text-mute hover:bg-fill hover:text-ink',
      )}
    >
      {label}
    </Link>
  );
}

function StateCell({ block, state }: { block: BlockId; state: (typeof STATES)[number] }) {
  const found = casesFor(block).get(state.id);

  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="font-medium text-faint text-xs uppercase tracking-wide">
          {state.label}
        </span>
        {found?.note ? <span className="truncate text-faint text-xs">{found.note}</span> : null}
      </div>

      <div
        className={cn(
          'rounded-md border p-3',
          found ? 'border-line bg-paper' : 'border-line border-dashed bg-fill/40',
        )}
      >
        {found ? (
          found.render()
        ) : (
          <p className="py-6 text-center text-faint text-xs italic">not built</p>
        )}
      </div>
    </div>
  );
}

function BlockSection({ block }: { block: (typeof BLOCKS)[number] }) {
  const built = casesFor(block.id).size;

  return (
    <section id={block.id} className="scroll-mt-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-ink text-lg">
          <span className="tabular mr-2 text-faint">{block.id.slice(0, 2)}</span>
          {block.name}
        </h2>
        <span className="text-faint text-xs">
          {block.holds} · {built} of {STATES.length} states
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STATES.map((state) => (
          <StateCell key={state.id} block={block.id} state={state} />
        ))}
      </div>
    </section>
  );
}

function BlocksIndex() {
  return (
    <div className="space-y-10 px-6 py-6">
      {BLOCKS.map((block) => (
        <BlockSection key={block.id} block={block} />
      ))}
    </div>
  );
}

export function Lab() {
  const { section } = useParams();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header section={section} />
      {section === 'type' ? <LabTypeSpecimen /> : <BlocksIndex />}
    </div>
  );
}
