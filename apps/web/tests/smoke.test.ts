/**
 * Frontend smoke test (docs/20-Implementation/205 §9): the shell renders.
 *
 * Renders the hydrated island in jsdom and asserts the foundation shell shows —
 * proving the Astro/React/Tailwind pipeline and semantic tokens boot. It also
 * checks the typed API client instantiates against the contract without making a
 * real network call.
 */

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from '../src/api/client';
import AppShell from '../src/islands/AppShell';

describe('AppShell', () => {
  it('renders the foundation shell', () => {
    render(createElement(AppShell, { environment: 'dev' }));
    expect(screen.getByRole('heading', { name: /one continuous record/i })).toBeTruthy();
    expect(screen.getByText(/build baseline/i)).toBeTruthy();
    expect(screen.getByText('dev')).toBeTruthy();
  });
});

describe('ApiClient', () => {
  it('constructs against the contract and issues a bearer-authenticated request', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ items: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const client = new ApiClient({
      baseUrl: 'https://example.test/api',
      token: 'synthetic-token',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await client.getTimeline();
    expect(result.items).toEqual([]);

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v1/timeline');
    expect((init.headers as Record<string, string>)['Authorization']).toBe(
      'Bearer synthetic-token',
    );
  });
});
