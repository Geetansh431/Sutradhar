/**
 * Files — spec §6.6, IA §4.1.
 *
 * "Folder tree per project, plus a firm-level tree. Versions with an explicit
 * 'current for execution' marker. This ends the 'carpenter built from the old
 * PDF' failure. The marker is visually loud."
 *
 * So the marker is the loudest thing on the screen, and a superseded drawing
 * sits next to its replacement rather than being tidied away — a file nobody
 * can see is a file someone still builds from.
 *
 * Block 05 (document viewer) is not built, so a file does not open here yet.
 * The screen says that rather than offering a click that does nothing.
 */

import { DataGrid, type GridColumn } from '@/blocks/DataGrid';
import { type FileRow, fileCounts, fileTree } from '@/domain/selectors/files';
import type { Document, EntityId } from '@/domain/types';
import { formatShortDate } from '@/lib/dates';
import { type EntityTable, useStore } from '@/store/store';

const columns: GridColumn<FileRow>[] = [
  {
    id: 'name',
    header: 'File',
    sortValue: (row) => row.name,
    cell: (row) => (
      <span className={row.superseded ? 'text-mute line-through' : 'text-ink'}>{row.name}</span>
    ),
  },
  {
    id: 'version',
    header: 'Version',
    sortValue: (row) => row.version ?? '',
    cell: (row) =>
      row.version ? (
        <span className="text-mute">{row.version}</span>
      ) : (
        <span className="text-faint">—</span>
      ),
  },
  {
    id: 'status',
    header: 'Status',
    sortValue: (row) => (row.currentForExecution ? 0 : row.superseded ? 2 : 1),
    // The loud marker (§6.6). Everything else on this row is quiet so that it
    // is the thing the eye lands on.
    cell: (row) => {
      if (row.currentForExecution) {
        return (
          <span className="rounded bg-ok-soft px-2 py-0.5 font-medium text-ok text-xs">
            Current for execution
          </span>
        );
      }
      if (row.superseded) {
        return <span className="text-warn text-xs">Superseded — do not build from this</span>;
      }
      return <span className="text-faint text-xs">On file</span>;
    },
  },
  {
    id: 'approved',
    header: 'Approved',
    sortValue: (row) => row.approvedAt ?? '',
    cell: (row) =>
      row.approvedAt ? (
        <span className="text-mute">{formatShortDate(row.approvedAt.slice(0, 10))}</span>
      ) : (
        <span className="fv-missing">not approved</span>
      ),
  },
  {
    id: 'readable',
    header: 'Read',
    sortValue: (row) => (row.unreadable ? 1 : 0),
    // §5.2: an unreadable file is listed honestly, never dropped.
    cell: (row) =>
      row.unreadable ? (
        <span className="text-warn text-xs">unreadable · needs a human</span>
      ) : (
        <span className="text-faint text-xs">read</span>
      ),
  },
];

export type FilesProps = {
  /** Tests and `/lab` read from here instead of the live store — see `Money`. */
  stateOverride?: {
    entities: EntityTable;
    documents: Document[];
    currentUserId: EntityId | null;
  };
};

export function Files({ stateOverride }: FilesProps = {}) {
  const storeEntities = useStore((s) => s.entities);
  const storeDocuments = useStore((s) => s.documents);
  const entities = stateOverride?.entities ?? storeEntities;
  const documents = stateOverride?.documents ?? storeDocuments;

  const state = { entities, documents };
  const folders = fileTree(state);
  const counts = fileCounts(state);

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-6 py-6">
      <header>
        <h1 className="font-display text-ink text-xl">Files</h1>
        <p className="text-mute text-sm">
          {counts.total} files · {counts.approved} client-approved · {counts.superseded} superseded
          {counts.unreadable > 0 ? ` · ${counts.unreadable} we could not read` : ''}
        </p>
      </header>

      {folders.length === 0 ? (
        <section className="rounded-lg border border-line px-4 py-10 text-center">
          <p className="text-mute text-sm">Nothing has been filed yet.</p>
          <p className="mt-1 text-faint text-xs">
            Drop a folder into onboarding and everything in it lands here.
          </p>
        </section>
      ) : (
        folders.map((folder) => (
          <section key={folder.path} className="rounded-lg border border-line p-4">
            <h2 className="mb-2 font-medium text-ink text-xs uppercase tracking-wide">
              {folder.root}
              {folder.leaf ? <span className="text-faint"> / {folder.leaf}</span> : null}
            </h2>
            <DataGrid
              rows={folder.files}
              columns={columns}
              rowId={(row) => row.id}
              caption={folder.path}
              askHint={false}
            />
          </section>
        ))
      )}

      <p className="text-faint text-xs">
        Opening a file needs the document viewer, which is not built in this prototype.
      </p>
    </main>
  );
}
