/**
 * WeekKnowledgeCard — surfaces week-by-week pregnancy knowledge by gestational
 * age (MS-1.6; docs/06-Modules/82 FR-4; docs/20-Implementation/208 §6 Task 4).
 * The backend derives the current week from the mother's active pregnancy
 * episode and serves the authored knowledge-base content typed + sourced; this
 * card renders it through a content-type-aware component and never fabricates
 * content (docs/04-Architecture/51 §8, BR-4). Calm, plain language, mobile-first
 * (docs/03-UX/41). All network goes through `api/` (51 BR-1).
 *
 * The default export is a thin container (session + data + network); the
 * presentational `WeekKnowledgeCardView` is exported for testing and takes all
 * of its state through props.
 */
import { type ReactElement, type ReactNode } from 'react';

import { parseMarkdown, type MarkdownBlock } from '../../lib/markdown';
import { useWeekKnowledge } from '../../state/content';
import { useAuthenticatedClient } from '../../state/session';

import type { ContentItemResponse } from '@wise-bloom/api-contract';
import type { ContentType } from '@wise-bloom/domain-types';

/** Human-readable label per medical content type (docs/02-Research/28). */
const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  educational: 'Educational',
  clinical_recommendation: 'Clinical recommendation',
  emergency_warning: 'Emergency',
};

const quietButtonClass =
  'inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-small font-medium text-text-primary transition-colors hover:border-action hover:text-action focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60';

// ---------------------------------------------------------------------------
// Safe inline + block rendering (React escapes all text — no raw HTML)
// ---------------------------------------------------------------------------

const INLINE = /\*\*(.+?)\*\*|`(.+?)`/g;

/** Renders a Markdown-subset inline string: `**bold**` and `` `code` ``; everything else is plain text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${index}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(
        <code key={`${keyPrefix}-c-${index}`} className="text-caption">
          {match[2]}
        </code>,
      );
    }
    lastIndex = INLINE.lastIndex;
    index += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function renderBlock(block: MarkdownBlock, key: string): ReactElement {
  switch (block.type) {
    case 'heading':
      return (
        <h4 key={key} className="text-body font-semibold text-text-primary">
          {renderInline(block.text, key)}
        </h4>
      );
    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-l-2 border-border pl-3 text-small italic leading-relaxed text-text-secondary"
        >
          {renderInline(block.text, key)}
        </blockquote>
      );
    case 'list':
      return (
        <ul
          key={key}
          className="flex list-disc flex-col gap-1 pl-5 text-body leading-relaxed text-text-primary"
        >
          {block.items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
          ))}
        </ul>
      );
    default:
      return (
        <p key={key} className="text-body leading-relaxed text-text-primary">
          {renderInline(block.text, key)}
        </p>
      );
  }
}

// ---------------------------------------------------------------------------
// Presentational view (props only — no session, no network)
// ---------------------------------------------------------------------------

export interface WeekKnowledgeCardViewProps {
  data: ContentItemResponse | null;
  loading: boolean;
  error: string | null;
  notAvailable: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function WeekKnowledgeCardView({
  data,
  loading,
  error,
  notAvailable,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: WeekKnowledgeCardViewProps): ReactElement {
  const typeLabel =
    data && data.content.source_ref.trim().length > 0
      ? CONTENT_TYPE_LABEL[data.content.content_type]
      : undefined;

  return (
    <section aria-labelledby="week-knowledge-heading" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 id="week-knowledge-heading" className="text-h2 font-semibold text-text-primary">
          Week-by-week knowledge
        </h2>
        <p className="text-small leading-relaxed text-text-secondary">
          Gentle, general education for where you are in your pregnancy. This is not medical advice
          — your clinician guides your care.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-caution bg-surface-raised p-3 text-small text-text-primary"
        >
          {error}
        </p>
      ) : null}

      {notAvailable ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-raised p-6 text-center">
          <p className="text-body font-medium text-text-primary">No week to show yet</p>
          <p className="mt-1 text-small text-text-secondary">
            Add your last menstrual period (or due date) in your pregnancy details, and your
            week-by-week guidance will appear here.
          </p>
        </div>
      ) : null}

      {data && typeLabel ? (
        <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-action px-2 py-0.5 text-caption font-medium uppercase tracking-wide text-action">
                {typeLabel}
              </span>
              <span className="text-caption text-text-secondary">Week {data.week} of 40</span>
            </div>
            <nav aria-label="Browse weeks" className="flex gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev}
                aria-label="Previous week"
                className={quietButtonClass}
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!canNext}
                aria-label="Next week"
                className={quietButtonClass}
              >
                Next →
              </button>
            </nav>
          </div>

          <h3 className="text-h3 font-semibold text-text-primary">{data.title}</h3>

          {data.gestational_age ? (
            <p className="text-small text-text-secondary">
              You’re around {data.gestational_age.weeks} weeks {data.gestational_age.daysIntoWeek}{' '}
              days today.
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            {parseMarkdown(data.body ?? '').map((block, blockIndex) =>
              renderBlock(block, `wk-${data.week}-b-${blockIndex}`),
            )}
          </div>

          <p className="text-caption text-text-secondary">Sources: {data.content.source_ref}</p>
        </article>
      ) : null}

      {loading ? (
        <p aria-live="polite" className="text-small text-text-secondary">
          Loading…
        </p>
      ) : null}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Container: wires session + data + network into the view
// ---------------------------------------------------------------------------

export interface WeekKnowledgeCardProps {
  apiBaseUrl: string;
}

export default function WeekKnowledgeCard({
  apiBaseUrl,
}: WeekKnowledgeCardProps): ReactElement | null {
  const { client, checked } = useAuthenticatedClient(apiBaseUrl);
  const { data, loading, error, notAvailable, goToWeek } = useWeekKnowledge(client);

  if (!checked) {
    return null;
  }

  const week = data?.week ?? null;

  return (
    <WeekKnowledgeCardView
      data={data}
      loading={loading}
      error={error}
      notAvailable={notAvailable}
      canPrev={week !== null && week > 1}
      canNext={week !== null && week < 40}
      onPrev={() => {
        if (week !== null && week > 1) {
          goToWeek(week - 1);
        }
      }}
      onNext={() => {
        if (week !== null && week < 40) {
          goToWeek(week + 1);
        }
      }}
    />
  );
}
