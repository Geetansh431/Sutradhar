/**
 * Files — spec §6.6.
 *
 * "Folder tree per project, plus a firm-level tree. The firm defines the
 * hierarchy; we do not impose one." So the tree is derived from each document's
 * own folder path rather than a structure we invented and made them fit.
 *
 * The load-bearing part is the current-for-execution marker: §6.6 says this
 * ends the "carpenter built from the old PDF" failure, and that only works if a
 * superseded drawing is still visibly present and visibly not current. Nothing
 * is hidden and nothing is deleted — it is marked.
 */

import type { Document, EntityId } from '@/domain/types';
import type { EntityTable } from '@/store/store';

export type FilesState = { entities: EntityTable; documents: Document[] };

export type FileRow = {
  id: EntityId;
  name: string;
  version: string | null;
  currentForExecution: boolean;
  approvedAt: string | null;
  unreadable: boolean;
  /** The version this one replaced, resolved to a name. */
  supersedes: string | null;
  /** True when a newer version of this file exists — the failure §6.6 names. */
  superseded: boolean;
};

export type FileFolder = {
  /** Full path, e.g. "Iyer Residence/Drawings". */
  path: string;
  /** The top segment: a project name, or "Firm". */
  root: string;
  /** The rest, e.g. "Drawings". Empty when the folder is a root itself. */
  leaf: string;
  files: FileRow[];
};

const live = (documents: Document[]): Document[] =>
  documents.filter((document) => document.archivedAt === null);

/**
 * Every folder, grouped, roots in a stable order.
 *
 * Firm-level folders sort last: a project's own files are what someone opening
 * this screen is usually after.
 */
export function fileTree(state: FilesState): FileFolder[] {
  const documents = live(state.documents);
  const supersededIds = new Set(
    documents.map((document) => document.supersedesId).filter((id): id is EntityId => id !== null),
  );
  const nameById = new Map(documents.map((document) => [document.id, document.name]));

  const byPath = new Map<string, FileRow[]>();
  for (const document of documents) {
    const rows = byPath.get(document.folder) ?? [];
    rows.push({
      id: document.id,
      name: document.name,
      version: document.version,
      currentForExecution: document.currentForExecution,
      approvedAt: document.approvedAt,
      unreadable: document.unreadable,
      supersedes: document.supersedesId ? (nameById.get(document.supersedesId) ?? null) : null,
      superseded: supersededIds.has(document.id),
    });
    byPath.set(document.folder, rows);
  }

  return [...byPath.entries()]
    .map(([path, files]) => {
      const [root = path, ...rest] = path.split('/');
      return {
        path,
        root,
        leaf: rest.join('/'),
        // Current-for-execution first: it is the one someone came here to find.
        files: files.sort((a, b) => {
          if (a.currentForExecution !== b.currentForExecution)
            return a.currentForExecution ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      };
    })
    .sort((a, b) => {
      const firmA = a.root === 'Firm';
      const firmB = b.root === 'Firm';
      if (firmA !== firmB) return firmA ? 1 : -1;
      return a.path.localeCompare(b.path);
    });
}

/** Counts for the header, and the one number worth saying out loud. */
export type FileCounts = {
  total: number;
  /** Files a newer version has replaced — still on file, not current. */
  superseded: number;
  /** Files that could not be read at all (§5.2). */
  unreadable: number;
  approved: number;
};

export function fileCounts(state: FilesState): FileCounts {
  const folders = fileTree(state);
  const files = folders.flatMap((folder) => folder.files);
  return {
    total: files.length,
    superseded: files.filter((file) => file.superseded).length,
    unreadable: files.filter((file) => file.unreadable).length,
    approved: files.filter((file) => file.approvedAt !== null).length,
  };
}
