/**
 * Markdown-subset parser tests (MS-1.6 safe rendering, docs/04-Architecture/51 §8).
 */

import { describe, expect, it } from 'vitest';

import { parseMarkdown } from '../../src/lib/markdown';

describe('parseMarkdown', () => {
  it('parses headings and the paragraph that follows', () => {
    expect(parseMarkdown('## Stage\nFirst trimester.')).toEqual([
      { type: 'heading', text: 'Stage' },
      { type: 'paragraph', text: 'First trimester.' },
    ]);
  });

  it('joins consecutive lines into one paragraph and splits on a blank line', () => {
    expect(parseMarkdown('one\ntwo\n\nthree')).toEqual([
      { type: 'paragraph', text: 'one two' },
      { type: 'paragraph', text: 'three' },
    ]);
  });

  it('groups consecutive list items into one list block', () => {
    expect(parseMarkdown('- one\n- two')).toEqual([{ type: 'list', items: ['one', 'two'] }]);
  });

  it('groups consecutive blockquote lines', () => {
    expect(parseMarkdown('> a\n> b')).toEqual([{ type: 'quote', text: 'a b' }]);
  });

  it('handles any heading depth and keeps inline markers as text', () => {
    expect(parseMarkdown('#### Deep **bold**')).toEqual([
      { type: 'heading', text: 'Deep **bold**' },
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});
