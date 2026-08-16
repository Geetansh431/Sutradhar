/**
 * `/lab/type` — the type-pairing decision, made against real content.
 *
 * SETUP.md §5: decide the pairing here, not by taste in the abstract. Each
 * specimen below renders the four things the product actually shows — a dense
 * row of rupee figures, the brief paragraph, the stage stepper, and an answer
 * block — so a candidate that looks fine in a heading and fails at ₹18,40,000
 * is caught before it is adopted.
 *
 * To change the pairing: edit `--font-display` and `--font-ui` in
 * `src/styles/globals.css`. That is the whole change — two variables.
 *
 * The rupee test matters: not every font carries ₹ well. Check any candidate
 * against ₹18,40,000 at small sizes before adopting it.
 */

import { formatLongDate, TODAY } from '@/lib/dates';
import { formatINR, formatShortINR, rupees } from '@/lib/money';

const FIGURES = [
  rupees(1840000),
  rupees(920000),
  rupees(710000),
  rupees(250000),
  rupees(80000),
  rupees(170000),
];

const STAGES = [
  'Enquiry',
  'Feasibility',
  'CAD',
  'Concept',
  'Contract',
  'Vendors',
  'Execution',
  'Handover',
] as const;

const CURRENT_STAGE = 6; // Execution — where Iyer sits.

/** The four things the product shows, rendered in whatever the current pairing is. */
function Specimen() {
  return (
    <div className="space-y-8">
      {/* 1 — the answer block. One figure, as large as it ever gets. */}
      <div>
        <p className="mb-2 text-faint text-xs uppercase tracking-wide">Answer block</p>
        <div className="rounded-md border border-line bg-paper p-5">
          <p className="tabular font-display text-4xl text-ink">{formatINR(rupees(642000))}</p>
          <p className="mt-1 text-mute text-sm">
            total open vendor exposure · 3 vendors · 2 projects
          </p>
        </div>
      </div>

      {/* 2 — the brief. Prose, and the one place the product writes at length. */}
      <div>
        <p className="mb-2 text-faint text-xs uppercase tracking-wide">The brief</p>
        <div className="rounded-md border border-brand/40 bg-brand-soft/40 p-5">
          <div className="mb-2 flex items-baseline justify-between gap-4">
            <span className="font-medium text-brand text-xs uppercase tracking-wide">
              {formatLongDate(TODAY)}
            </span>
            <span className="text-faint text-xs">generated 07:40 · not a chat</span>
          </div>
          <p className="text-base text-ink leading-relaxed">
            Two things need you today. The Iyer instalment ({formatINR(rupees(250000))}) is due and
            covers Thursday's {formatINR(rupees(80000))} to Sharma — if it slips, that payment has
            no cover. Kormangala's false ceiling is 4 days behind since Saturday.
          </p>
        </div>
      </div>

      {/* 3 — the dense figure column. Where tabular numerals earn their place. */}
      <div>
        <p className="mb-2 text-faint text-xs uppercase tracking-wide">
          Dense grid — figures must align
        </p>
        <div className="overflow-x-auto rounded-md border border-line bg-paper">
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="border-line border-b text-faint text-xs uppercase tracking-wide">
                <th className="px-3 py-2 text-left font-medium">Entity</th>
                <th className="px-3 py-2 text-right font-medium">Amount</th>
                <th className="px-3 py-2 text-right font-medium">Short</th>
              </tr>
            </thead>
            <tbody>
              {FIGURES.map((figure, i) => (
                <tr key={figure} className="border-line/60 border-b last:border-0">
                  <td className="px-3 py-2 text-ink">
                    {
                      [
                        'Sharma Electricals',
                        'Kumar Carpentry',
                        'Godrej dealer',
                        'R. Iyer',
                        'M. Rao',
                        'Team salaries',
                      ][i]
                    }
                  </td>
                  <td className="tabular px-3 py-2 text-right text-ink">{formatINR(figure)}</td>
                  <td className="tabular px-3 py-2 text-right text-mute">
                    {formatShortINR(figure)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4 — the stage stepper. Small caps-ish labels at their smallest. */}
      <div>
        <p className="mb-2 text-faint text-xs uppercase tracking-wide">Stage stepper</p>
        <div className="overflow-x-auto rounded-md border border-line bg-paper p-4">
          <ol className="flex min-w-max items-center gap-1">
            {STAGES.map((stage, i) => (
              <li key={stage} className="flex items-center gap-1">
                <span
                  className={
                    i === CURRENT_STAGE
                      ? 'font-medium text-brand text-sm'
                      : i < CURRENT_STAGE
                        ? 'text-ok text-sm'
                        : 'text-faint text-sm'
                  }
                >
                  {stage}
                </span>
                {i < STAGES.length - 1 ? <span className="text-line">—</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* 5 — the rupee stress test, at the sizes that actually break. */}
      <div>
        <p className="mb-2 text-faint text-xs uppercase tracking-wide">
          ₹ at every size — check the glyph, not the layout
        </p>
        <div className="space-y-1 rounded-md border border-line bg-paper p-4">
          {(['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-2xl', 'text-4xl'] as const).map(
            (size) => (
              <p key={size} className={`${size} tabular text-ink`}>
                ₹18,40,000 · ₹6,42,000 · ₹80,000 · ₹1,70,000
              </p>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function LabTypeSpecimen() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6 max-w-prose">
        <h2 className="font-display text-ink text-lg">Type</h2>
        <p className="mt-1 text-mute text-sm">
          The current pairing, against real content. Change it in{' '}
          <code className="rounded bg-fill px-1 text-[0.8em]">src/styles/globals.css</code> —{' '}
          <code className="rounded bg-fill px-1 text-[0.8em]">--font-display</code> and{' '}
          <code className="rounded bg-fill px-1 text-[0.8em]">--font-ui</code>. Candidates worth
          loading: Source Serif 4 (the default), Fraunces, Instrument Serif — each against Inter,
          Geist, or Public Sans.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-6 rounded-md border border-line bg-panel px-4 py-3 text-sm">
        <div>
          <span className="text-faint text-xs uppercase tracking-wide">Display</span>
          <p className="font-display text-ink">Source Serif 4</p>
        </div>
        <div>
          <span className="text-faint text-xs uppercase tracking-wide">UI</span>
          <p className="text-ink">Inter</p>
        </div>
      </div>

      <Specimen />
    </div>
  );
}
