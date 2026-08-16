/**
 * The drop zone — spec §5.3.
 *
 * "Dominant, always visible, accepts folders and multi-select. Copy names real
 * artefacts so the user recognises their own mess."
 *
 * No file-type gate and no naming convention (§5.2, movement 1): whatever is
 * dropped is accepted. In the prototype the bundle is pre-computed (§5.7), so a
 * real drop replays the known result rather than parsing anything.
 */

import { useState } from 'react';
import { cn } from '@/lib/cn';

export function DropZone({ onDrop }: { onDrop: () => void }) {
  const [over, setOver] = useState(false);

  return (
    <button
      type="button"
      onClick={onDrop}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        onDrop();
      }}
      className={cn(
        'w-full cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
        over
          ? 'border-brand bg-brand-soft/60'
          : 'border-brand/60 bg-brand-soft/20 hover:bg-brand-soft/40',
      )}
    >
      <p className="font-display font-semibold text-2xl text-brand">Drop anything here</p>
      <p className="mx-auto mt-2 max-w-md text-mute text-sm">
        Folders, Excel sheets, PDFs, WhatsApp exports, site photos, quotations, agreements. No
        sorting.
      </p>
      <span className="mt-4 inline-flex gap-2">
        <span className="rounded-full border border-brand px-4 py-1.5 font-medium text-brand text-sm">
          Browse files
        </span>
        <span className="rounded-full border border-line px-4 py-1.5 text-mute text-sm">
          Connect Drive
        </span>
      </span>
    </button>
  );
}
