/**
 * Frontend smoke test (docs/20-Implementation/205 §9): the landing renders.
 *
 * Renders the hydrated island in jsdom and asserts the landing shows — proving
 * the Astro/React/Tailwind pipeline and semantic tokens boot — that it offers
 * the two ways into the product (create an account / log in) so a first visitor
 * is never left on a dead end, and that it explains what the product is.
 * API-client behaviour is covered per-module under `tests/api/`.
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import AppShell from '../src/islands/AppShell';

describe('AppShell', () => {
  it('renders the landing with entry navigation and product context', () => {
    render(createElement(AppShell));
    expect(screen.getByRole('heading', { name: /one continuous record/i })).toBeTruthy();
    expect(screen.getByText(/what wise bloom care does/i)).toBeTruthy();

    // A first visitor must be able to start: the entry links are present and
    // resolve under the configured base path. (Each appears more than once —
    // in the nav and hero — so match all and check the first.)
    const [register] = screen.getAllByRole('link', { name: /create your account/i });
    const [login] = screen.getAllByRole('link', { name: /^log in$/i });
    expect(register).toBeTruthy();
    expect(login).toBeTruthy();
    expect(register?.getAttribute('href')).toContain('/register');
    expect(login?.getAttribute('href')).toContain('/login');
  });
});
