/**
 * The ingested list — spec §5.3.
 *
 * "One row per file or batch. Shows what was found, not just that it succeeded
 * — '412 rows → 3 projects, 19 vendors'. Failures are stated: '5 unreadable,
 * needs a human'."
 *
 * The honesty is the feature. A row that quietly said "done" for a batch where
 * five photos could not be read would be the first small lie the product tells.
 */

import type { IngestedFile, IngestStatus } from '@/fixtures/ingestion';
import { cn } from '@/lib/cn';

const STATUS_TONE: Record<IngestStatus, string> = {
  done: 'border-ok text-ok',
  reading: 'border-warn text-warn',
  partial: 'border-warn text-warn',
  queued: 'border-line text-faint',
};

export function IngestedList({
  files,
  settled,
  totalFiles,
}: {
  files: IngestedFile[];
  /** Ids that have finished the replayed animation. */
  settled: ReadonlySet<string>;
  totalFiles: number;
}) {
  return (
    <div>
      <p className="mb-2 font-medium text-faint text-xs uppercase tracking-wide">
        Ingested · {totalFiles} files
      </p>

      <ul className="space-y-2">
        {files.map((file) => {
          const done = settled.has(file.id);
          const status: IngestStatus = done ? file.status : 'queued';

          return (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-paper px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn('size-7 shrink-0 rounded bg-fill-2', !done && 'animate-pulse')}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink text-sm">{file.name}</p>
                  <p className="truncate text-faint text-xs">{done ? file.found : 'reading…'}</p>
                </div>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-full border px-2.5 py-0.5 text-xs',
                  STATUS_TONE[status],
                )}
              >
                {status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
