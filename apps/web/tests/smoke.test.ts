/**
 * Frontend smoke test (docs/20-Implementation/205 §9): the shell renders.
 *
 * Renders the hydrated island in jsdom and asserts the foundation shell shows —
 * proving the Astro/React/Tailwind pipeline and semantic tokens boot.
 * API-client behaviour is covered per-module under `tests/api/`.
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import AppShell from '../src/islands/AppShell';

describe('AppShell', () => {
  it('renders the foundation shell', () => {
    render(createElement(AppShell, { environment: 'dev' }));
    expect(screen.getByRole('heading', { name: /one continuous record/i })).toBeTruthy();
    expect(screen.getByText(/build baseline/i)).toBeTruthy();
    expect(screen.getByText('dev')).toBeTruthy();
  });
});
