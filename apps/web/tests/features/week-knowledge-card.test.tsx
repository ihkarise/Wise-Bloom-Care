/**
 * WeekKnowledgeCardView tests (MS-1.6 frontend + a11y, docs/20-Implementation/208 §9).
 * The view is presentational (props only), covering the typed content render,
 * week navigation, the loading/empty/error states, the content-type-aware guard,
 * and accessibility — without session or network mocks.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  WeekKnowledgeCardView,
  type WeekKnowledgeCardViewProps,
} from '../../src/features/pregnancy/WeekKnowledgeCard';

import type { ContentItemResponse } from '@wise-bloom/api-contract';

const WEEK12: ContentItemResponse = {
  content: {
    content_id: 'pregnancy-week-12',
    life_stage: 'pregnancy',
    topic: 'pregnancy-week-12',
    content_type: 'educational',
    source_ref: 'S-WHO-ANC, S-ACOG-GWG',
    kb_path: 'knowledge-base/pregnancy/week12.md',
    version: '1.0',
  },
  title: 'Pregnancy — Week 12',
  body: '> **Educational information, not medical advice.**\n\n## Stage\nFirst trimester.\n\n## Looking after yourself\n- Attend your antenatal visits.\n- Follow your clinician’s guidance.',
  week: 12,
  gestational_age: { days: 84, weeks: 12, daysIntoWeek: 0 },
};

function baseProps(
  overrides: Partial<WeekKnowledgeCardViewProps> = {},
): WeekKnowledgeCardViewProps {
  return {
    data: null,
    loading: false,
    error: null,
    notAvailable: false,
    canPrev: false,
    canNext: false,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  };
}

describe('WeekKnowledgeCardView', () => {
  it('renders a labelled section and calm intro', () => {
    const { container } = render(<WeekKnowledgeCardView {...baseProps()} />);
    expect(screen.getByRole('heading', { name: 'Week-by-week knowledge' })).toBeTruthy();
    expect(
      container.querySelector('section[aria-labelledby="week-knowledge-heading"]'),
    ).toBeTruthy();
  });

  it('shows a calm empty state when no pregnancy week is available yet', () => {
    render(<WeekKnowledgeCardView {...baseProps({ notAvailable: true })} />);
    expect(screen.getByText('No week to show yet')).toBeTruthy();
    expect(screen.getByText(/last menstrual period/i)).toBeTruthy();
  });

  it('shows a loading indicator while loading', () => {
    render(<WeekKnowledgeCardView {...baseProps({ loading: true })} />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows an error as an alert', () => {
    render(<WeekKnowledgeCardView {...baseProps({ error: 'Something went wrong.' })} />);
    expect(screen.getByRole('alert').textContent).toContain('Something went wrong.');
  });

  it('renders the typed, sourced week content with title, type label, and body', () => {
    render(<WeekKnowledgeCardView {...baseProps({ data: WEEK12 })} />);
    expect(screen.getByRole('heading', { name: 'Pregnancy — Week 12' })).toBeTruthy();
    expect(screen.getByText('Educational')).toBeTruthy();
    expect(screen.getByText('Week 12 of 40')).toBeTruthy();
    // Body: rendered headings, list item, and the disclaimer blockquote.
    expect(screen.getByRole('heading', { name: 'Stage' })).toBeTruthy();
    expect(screen.getByText('Attend your antenatal visits.')).toBeTruthy();
    expect(screen.getByText(/Educational information, not medical advice\./)).toBeTruthy();
    // Sources and gestational-age context.
    expect(screen.getByText(/Sources:/)).toBeTruthy();
    expect(screen.getByText(/S-WHO-ANC/)).toBeTruthy();
    expect(screen.getByText(/around 12 weeks 0\s*days/)).toBeTruthy();
  });

  it('is content-type-aware: does not render content lacking a source_ref', () => {
    const untyped: ContentItemResponse = {
      ...WEEK12,
      content: { ...WEEK12.content, source_ref: '   ' },
    };
    render(<WeekKnowledgeCardView {...baseProps({ data: untyped })} />);
    // The section still renders, but the content article does not.
    expect(screen.getByRole('heading', { name: 'Week-by-week knowledge' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Pregnancy — Week 12' })).toBeNull();
    expect(screen.queryByText('Educational')).toBeNull();
  });

  it('supports week navigation with accessible controls', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <WeekKnowledgeCardView
        {...baseProps({ data: WEEK12, canPrev: false, canNext: true, onNext, onPrev })}
      />,
    );
    const prev = screen.getByRole('button', { name: 'Previous week' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next week' }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
  });
});
