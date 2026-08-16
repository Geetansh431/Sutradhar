/**
 * The canned questions — the whole of what this prototype can be asked.
 *
 * CLAUDE.md: "The ask bar is a filtered picker over canned questions — free
 * text narrows the list, it never submits. There is no path to an unprogrammed
 * answer." So this list is the boundary of the demo, and it is a closed list on
 * purpose: a question that is not here cannot be asked, rather than being asked
 * and answered badly.
 *
 * The four worked examples in spec §7.6 are the first four.
 */

export type CannedQuestion = {
  id: string;
  /** As the user would type it. */
  text: string;
  /** Grouped in the picker, so the list reads as capability rather than a menu. */
  group: 'money' | 'projects' | 'people' | 'capture';
  /** Shown under the question — what the answer will contain. */
  answers: string;
};

export const QUESTIONS: CannedQuestion[] = [
  {
    id: 'vendor-exposure',
    text: 'Which vendors are we most exposed to right now?',
    group: 'money',
    answers: 'Total exposure, by vendor, with what is gated and what is unconfirmed',
  },
  {
    id: 'kormangala-handover',
    text: 'Will Kormangala hit its handover date?',
    group: 'projects',
    answers: 'Days behind, the blocking chain, and what would recover it',
  },
  {
    id: 'july-across-projects',
    text: 'Show me July across all projects',
    group: 'money',
    answers: 'In, out, net, and the one anomaly worth noticing',
  },
  {
    id: 'sharma-bill-capture',
    text: 'Sharma ka bill aa gaya, 80 hazaar, Iyer site',
    group: 'capture',
    answers: 'Recognised as capture — produces a change preview, not an answer',
  },
  {
    id: 'owed-to-sharma',
    text: 'How much do we owe Sharma?',
    group: 'money',
    answers: 'Running balance, with every line traceable to its source',
  },
  {
    id: 'uncovered-payments',
    text: 'What is not covered in the next 30 days?',
    group: 'money',
    answers: 'Every outflow with no inflow gated against it',
  },
  {
    id: 'vendors-without-terms',
    text: 'Which vendors have no payment terms on file?',
    group: 'people',
    answers: 'The gap list, each with what it blocks',
  },
  {
    id: 'iyer-margin',
    text: 'What is the margin on Iyer Residence?',
    group: 'projects',
    answers: 'Value, received, spent, and what the change order would cost',
  },
];

/**
 * Narrows the list as the user types. Never returns "no results and submit
 * anyway" — an empty result is the honest answer that the question is not one
 * this prototype can take.
 */
export function filterQuestions(query: string): CannedQuestion[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return QUESTIONS;
  return QUESTIONS.filter(
    (question) =>
      question.text.toLowerCase().includes(needle) ||
      question.answers.toLowerCase().includes(needle) ||
      question.group.includes(needle),
  );
}

export const questionById = (id: string): CannedQuestion | undefined =>
  QUESTIONS.find((question) => question.id === id);
