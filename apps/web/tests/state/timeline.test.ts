/**
 * Timeline UI state tests (docs/08-Timeline/110, docs/04-Architecture/56 §3
 * cursor pagination).
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApiClient } from '../../src/api/client';
import { useTimeline } from '../../src/state/timeline';

import type { Event } from '@wise-bloom/domain-types';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeEvent(id: string): Event {
  return {
    event_id: id,
    family_id: 'f1',
    subject_id: 'm1',
    type: 'note',
    life_stage: 'pregnancy',
    occurred_at: '2026-01-01T00:00:00.000Z',
    version: 1,
    created_by: 'u1',
  };
}

describe('useTimeline', () => {
  it('is empty and not loading before a client is available', () => {
    const { result } = renderHook(() => useTimeline(null));
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('loads the first page on mount for an empty timeline', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ items: [] }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const { result } = renderHook(() => useTimeline(client));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('loadMore appends the next page using the returned cursor', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ items: [makeEvent('e1')], next_cursor: '1' }))
      .mockResolvedValueOnce(jsonResponse({ items: [makeEvent('e2')] }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const { result } = renderHook(() => useTimeline(client));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.hasMore).toBe(true);

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items.map((e) => e.event_id)).toEqual(['e1', 'e2']);
    expect(result.current.hasMore).toBe(false);
  });

  it('surfaces a calm error message on failure without throwing', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const { result } = renderHook(() => useTimeline(client));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.loading).toBe(false);
  });
});
