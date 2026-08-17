/**
 * Files — §6.6.
 *
 * The assertion that matters is the current-for-execution marker. §6.6 says
 * this screen ends the "carpenter built from the old PDF" failure, and that
 * only holds if the superseded drawing is *present* and *visibly not current*.
 * A screen that quietly hid old versions would look tidier and fix nothing.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fileCounts, fileTree } from '@/domain/selectors/files';
import { buildState } from '@/fixtures/scenarios';
import { Files } from '@/screens/Files';

const live = buildState('live');
const state = { entities: live.entities, documents: live.documents };

const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const render = () =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Files
        stateOverride={{
          entities: live.entities,
          documents: live.documents,
          currentUserId: 'person-anil',
        }}
      />
    </MemoryRouter>,
  );

describe('the file tree — §6.6', () => {
  const folders = fileTree(state);

  it("derives the hierarchy from the firm's own paths, projects before firm", () => {
    const roots = folders.map((folder) => folder.root);
    expect(roots[0]).not.toBe('Firm');
    expect(roots.at(-1)).toBe('Firm');
  });

  it('groups a project drawing folder together', () => {
    const drawings = folders.find((folder) => folder.path === 'Iyer Residence/Drawings');
    expect(drawings?.files.map((file) => file.version)).toEqual(['Rev C', 'Rev B']);
  });

  it('puts the current-for-execution file first in its folder', () => {
    const drawings = folders.find((folder) => folder.path === 'Iyer Residence/Drawings');
    expect(drawings?.files[0]?.currentForExecution).toBe(true);
  });

  it('marks the replaced drawing superseded without removing it', () => {
    const drawings = folders.find((folder) => folder.path === 'Iyer Residence/Drawings');
    const revB = drawings?.files.find((file) => file.version === 'Rev B');
    expect(revB).toBeDefined();
    expect(revB?.superseded).toBe(true);
    expect(revB?.currentForExecution).toBe(false);
  });

  it('counts what is worth saying in the header', () => {
    const counts = fileCounts(state);
    expect(counts.superseded).toBe(2);
    expect(counts.unreadable).toBe(1);
  });
});

describe('Files — the screen', () => {
  const html = text(render());

  it('says which file execution should build from, loudly', () => {
    expect(html).toContain('Current for execution');
  });

  it('warns on the superseded one rather than hiding it', () => {
    expect(html).toContain('Iyer_FalseCeiling_RevB.pdf');
    expect(html).toContain('Superseded — do not build from this');
  });

  it('lists the unreadable file honestly (§5.2)', () => {
    expect(html).toContain('IMG_2231.jpg');
    expect(html).toContain('unreadable · needs a human');
  });

  it('admits the document viewer is not built rather than offering a dead click', () => {
    expect(html).toContain('not built in this prototype');
  });
});
