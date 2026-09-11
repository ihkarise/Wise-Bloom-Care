/**
 * Frontend smoke test (docs/20-Implementation/205 §9): the landing shell renders.
 *
 * Renders the hydrated island in jsdom and asserts the landing shows — proving
 * the Astro/React/Tailwind pipeline and semantic tokens boot — and that it
 * offers the two ways into the product (create an account / log in), so a first
 * visitor is never left on a dead end. API-client behaviour is covered
 * per-module under `tests/api/`.
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import AppShell from '../src/islands/AppShell';

describe('AppShell', () => {
  it('renders the landing shell with entry navigation', () => {
    render(createElement(AppShell, { environment: 'dev' }));
    expect(screen.getByRole('heading', { name: /one continuous record/i })).toBeTruthy();
    // A first visitor must be able to start: both entry links are present and
    // resolve under the configured base path.
    const register = screen.getByRole('link', { name: /create your account/i });
    const login = screen.getByRole('link', { name: /log in/i });
    expect(register.getAttribute('href')).toContain('/register');
    expect(login.getAttribute('href')).toContain('/login');
    expect(screen.getByText('dev')).toBeTruthy();
  });
});
