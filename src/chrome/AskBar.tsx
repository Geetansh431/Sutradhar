/**
 * The global bar — spec §4.3, and CLAUDE.md's on-script rule.
 *
 * "One bar, present on every screen, invoked by ⌘K or by clicking. It is both
 * the question box and the capture box — the user does not have to know which
 * they are doing."
 *
 * It is a **filtered picker**, not a text input that submits. Typing narrows
 * the canned list; there is no code path from free text to an answer. That is
 * the guarantee that keeps the demo on script: an unprogrammed question cannot
 * be asked, rather than being asked and answered badly.
 */

import { useEffect, useRef, useState } from 'react';
import { type CannedQuestion, filterQuestions } from '@/canvas/questions';
import { cn } from '@/lib/cn';

const GROUP_LABEL: Record<CannedQuestion['group'], string> = {
  money: 'Money',
  projects: 'Projects',
  people: 'People',
  capture: 'Capture',
};

export function AskBar({ onPick }: { onPick: (question: CannedQuestion) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const matches = filterQuestions(query);

  const pick = (question: CannedQuestion) => {
    setOpen(false);
    setQuery('');
    onPick(question);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full max-w-md cursor-pointer rounded-full border border-brand/50 bg-brand-soft/40 px-4 py-1.5 text-left text-mute text-sm hover:border-brand"
      >
        ⌘K Ask or capture anything…
      </button>
    );
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onBlur={() => globalThis.setTimeout(() => setOpen(false), 150)}
        placeholder="Ask or capture anything…"
        aria-label="Ask or capture"
        className="w-full rounded-full border border-brand bg-paper px-4 py-1.5 text-ink text-sm outline-none"
      />

      <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-line bg-paper shadow-lg">
        {matches.length === 0 ? (
          // No submit path. The prototype says what it can take instead.
          <p className="px-4 py-3 text-mute text-sm">
            Nothing canned matches that. This prototype answers a fixed set of questions — clear the
            box to see them.
          </p>
        ) : (
          <ul>
            {matches.map((question) => (
              <li key={question.id}>
                <button
                  type="button"
                  onMouseDown={() => pick(question)}
                  className={cn(
                    'block w-full cursor-pointer px-4 py-2 text-left hover:bg-fill',
                    question.group === 'capture' && 'border-warn border-l-2',
                  )}
                >
                  <span className="block text-ink text-sm">{question.text}</span>
                  <span className="block text-faint text-xs">
                    {GROUP_LABEL[question.group]} · {question.answers}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
