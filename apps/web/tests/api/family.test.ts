/**
 * Family API module tests (docs/04-Architecture/56 §5 `/v1/family`).
 */

import { describe, expect, it, vi } from 'vitest';

import { getFamily } from '../../src/api/family';
import { ApiClient } from '../../src/api/client';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('family api', () => {
  it('gets the caller’s own family by default (no family_id query param)', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ family: { family_id: 'f1' } }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await getFamily(client);
    expect(result.family.family_id).toBe('f1');
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).not.toContain('family_id');
  });

  it('passes an explicit family_id when scoping to a specific family', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ family: { family_id: 'f2' } }));
    const client = new ApiClient({
      baseUrl: 'https://x.test',
      token: 't',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await getFamily(client, { familyId: 'f2' });
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('family_id=f2');
  });
});
