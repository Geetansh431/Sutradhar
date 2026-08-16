/**
 * Money — spec §6.4, wireframe w09.
 *
 * "Every rupee planned before it is spent, every planned rupee with a date and
 * a status." A composition, nothing more: mode switch, money timeline (block
 * 03), warning strip, payment grid (block 02). The gap, its sentence and the
 * proposals its actions raise all come from selectors.
 *
 * The role cut runs before any money is read (§3.2). A team member never
 * reaches this screen; arriving at the URL says so plainly rather than
 * rendering an emptied-out version of it.
 */

import { useMemo, useState } from 'react';
import { ChangePreview } from '@/blocks/ChangePreview';
import { DataGrid } from '@/blocks/DataGrid';
import { MoneyTimeline } from '@/blocks/MoneyTimeline';
import { paymentColumns, uncoveredIds } from '@/blocks/paymentColumns';
import { AdminOnly, type ModeOption, ModeSwitch } from '@/chrome/ModeSwitch';
import { WarningStrip } from '@/chrome/WarningStrip';
import { chaseInflow, regateOutflow } from '@/domain/proposals';
import { gapSentence, moneyWindow } from '@/domain/selectors/money';
import { canReachMoneyScreen } from '@/domain/selectors/role';
import type { EntityId } from '@/domain/types';
import { applyChange, type ChangeSet } from '@/store/change';
import { type EntityTable, useStore } from '@/store/store';

type Mode = 'timeline' | 'ledgers' | 'payments';

const MODES: ModeOption<Mode>[] = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'ledgers', label: 'Ledgers' },
  { id: 'payments', label: 'All payments' },
];

export type MoneyProps = {
  /**
   * Read from this state instead of the live store. Only tests and `/lab` pass
   * it — the same escape hatch the blocks take, and for the same reason: a
   * static render never sees a store reset, because Zustand serves its initial
   * snapshot during SSR. Screens in the app omit it.
   */
  stateOverride?: { entities: EntityTable; currentUserId: EntityId | null };
};

export function Money({ stateOverride }: MoneyProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeUserId = useStore((s) => s.currentUserId);
  const entities = stateOverride?.entities ?? storeEntities;
  const currentUserId = stateOverride ? stateOverride.currentUserId : storeUserId;

  const [mode, setMode] = useState<Mode>('timeline');
  const [pending, setPending] = useState<ChangeSet | null>(null);

  const allowed = canReachMoneyScreen({ entities, currentUserId });

  // Read only once the role check passes — never fetched for someone who may
  // not see it (§3.2).
  const moneyView = useMemo(
    () => (allowed ? moneyWindow({ entities }) : null),
    [allowed, entities],
  );

  if (!moneyView) return <AdminOnly what="Money" />;

  const gap = moneyView.gaps[0];
  const columns = paymentColumns({
    gateLabel: (id: EntityId) =>
      moneyView.payments.find((p) => p.id === id)?.counterpartyName ?? id,
  });

  const confirm = (confirmed: ChangeSet) => {
    // The one write path; `applyChange` refuses anything unconfirmed.
    applyChange(useStore.getState(), confirmed, currentUserId ?? 'person-anil');
    setPending(null);
  };

  const propose = (next: ChangeSet | null) => {
    if (next) setPending(next);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">Money</h1>
        <p className="text-mute text-sm">All projects · next 60 days</p>
      </header>

      <ModeSwitch modes={MODES} active={mode} onChange={setMode} label="Money view" />

      {mode === 'timeline' ? (
        <section className="rounded-md border border-line bg-paper p-4">
          <MoneyTimeline {...(stateOverride ? { stateOverride: { entities } } : {})} />
        </section>
      ) : null}

      {gap ? (
        <WarningStrip
          sentence={gapSentence(gap)}
          actions={[
            { label: 'Chase inflow', onRun: () => propose(chaseInflow(gap, moneyView.payments)) },
            {
              label: 'Re-gate outflow',
              onRun: () => propose(regateOutflow(gap, moneyView.payments)),
            },
          ]}
        />
      ) : null}

      {pending ? (
        <ChangePreview changeSet={pending} onConfirm={confirm} onDiscard={() => setPending(null)} />
      ) : null}

      <section className="rounded-md border border-line bg-paper p-4">
        <DataGrid
          rows={moneyView.payments}
          columns={columns}
          rowId={(payment) => payment.id}
          highlightIds={uncoveredIds(moneyView.payments)}
          caption="Payments"
          onPropose={setPending}
          emptyMessage="No payments scheduled in this window."
          emptyHint="Capture one with ⌘K, or drop a bill in."
        />
      </section>
    </main>
  );
}
