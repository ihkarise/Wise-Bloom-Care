/**
 * A tiny, dependency-free Markdown-subset parser for rendering authored
 * knowledge-base content safely (docs/04-Architecture/51 §8). It parses only the
 * block shapes the KB uses — headings, paragraphs, blockquotes, and unordered
 * lists — into a small model the content-type-aware component renders with React
 * (which escapes all text). No raw HTML is produced or interpreted, so there is
 * no injection surface; the client never fabricates content, it only structures
 * text the backend served.
 */

export type MarkdownBlock =
  | { readonly type: 'heading'; readonly text: string }
  | { readonly type: 'paragraph'; readonly text: string }
  | { readonly type: 'quote'; readonly text: string }
  | { readonly type: 'list'; readonly items: readonly string[] };

const HEADING = /^#{1,6}\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const LIST_ITEM = /^[-*]\s+(.*)$/;

/** Parses a Markdown subset into ordered blocks. Consecutive quote/list lines group into one block. */
export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];

  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: string[] = [];

  const flushParagraph = (): void => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
      paragraph = [];
    }
  };
  const flushQuote = (): void => {
    if (quote.length > 0) {
      blocks.push({ type: 'quote', text: quote.join(' ') });
      quote = [];
    }
  };
  const flushList = (): void => {
    if (list.length > 0) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };
  const flushAll = (): void => {
    flushParagraph();
    flushQuote();
    flushList();
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flushAll();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushAll();
      blocks.push({ type: 'heading', text: (heading[1] ?? '').trim() });
      continue;
    }

    const quoted = QUOTE.exec(line);
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push((quoted[1] ?? '').trim());
      continue;
    }

    const listItem = LIST_ITEM.exec(line);
    if (listItem) {
      flushParagraph();
      flushQuote();
      list.push((listItem[1] ?? '').trim());
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}
