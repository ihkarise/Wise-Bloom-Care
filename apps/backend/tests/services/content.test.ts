/**
 * ContentService tests (docs/20-Implementation/206 §9: "content typing
 * refusal"; acceptance criterion: refuses untyped/unsourced medical content).
 */

import { describe, expect, it } from 'vitest';

import {
  ContentItemNotFoundError,
  ContentService,
  UntypedContentError,
} from '../../src/services/ContentService';
import { createInMemoryAdapter } from '../support/inMemoryAdapter';

const VALID_ITEM = {
  topic: 'pregnancy-week-20',
  content_type: 'educational' as const,
  source_ref: 'docs/02-Research/20-WHO_GUIDELINES.md',
  kb_path: 'knowledge-base/pregnancy/week20.md',
  version: '1.0',
};

describe('ContentService.register', () => {
  it('registers a validly typed and sourced item', () => {
    const storage = createInMemoryAdapter();
    const item = new ContentService(storage).register(VALID_ITEM);
    expect(item.content_id).toBeTruthy();
    expect(item.content_type).toBe('educational');
  });

  it('refuses an item with no content_type', () => {
    const storage = createInMemoryAdapter();
    const service = new ContentService(storage);
    expect(() => service.register({ ...VALID_ITEM, content_type: undefined as never })).toThrow(
      UntypedContentError,
    );
  });

  it('refuses an item with an invalid content_type', () => {
    const storage = createInMemoryAdapter();
    const service = new ContentService(storage);
    expect(() => service.register({ ...VALID_ITEM, content_type: 'diagnosis' as never })).toThrow(
      UntypedContentError,
    );
  });

  it('refuses an item with an empty source_ref', () => {
    const storage = createInMemoryAdapter();
    const service = new ContentService(storage);
    expect(() => service.register({ ...VALID_ITEM, source_ref: '  ' })).toThrow(
      UntypedContentError,
    );
  });
});

describe('ContentService.get', () => {
  it('resolves a registered item', () => {
    const storage = createInMemoryAdapter();
    const service = new ContentService(storage);
    const created = service.register(VALID_ITEM);
    expect(service.get(created.content_id)).toEqual(created);
  });

  it('throws for an unknown id', () => {
    const storage = createInMemoryAdapter();
    expect(() => new ContentService(storage).get('missing')).toThrow(ContentItemNotFoundError);
  });

  it('refuses to serve a row that was corrupted after the fact (defence in depth, 28 BR-2)', () => {
    const storage = createInMemoryAdapter();
    // Bypass the service to simulate a row without content_type reaching storage
    // directly (Sheets enforces no schema — docs/04-Architecture/54 §5).
    storage.create('ContentItem', {
      content_id: 'corrupted-1',
      topic: 'pregnancy-week-20',
      content_type: '' as never,
      source_ref: 'docs/02-Research/20-WHO_GUIDELINES.md',
      kb_path: 'knowledge-base/pregnancy/week20.md',
      version: '1.0',
    });

    expect(() => new ContentService(storage).get('corrupted-1')).toThrow(UntypedContentError);
  });
});

describe('ContentService.findByTopic', () => {
  it('excludes corrupted/untyped rows rather than serving them', () => {
    const storage = createInMemoryAdapter();
    const service = new ContentService(storage);
    service.register(VALID_ITEM);
    storage.create('ContentItem', {
      content_id: 'corrupted-2',
      topic: VALID_ITEM.topic,
      content_type: '' as never,
      source_ref: '',
      kb_path: 'knowledge-base/pregnancy/week20.md',
      version: '1.0',
    });

    const results = service.findByTopic(VALID_ITEM.topic);
    expect(results).toHaveLength(1);
    expect(results[0]?.content_type).toBe('educational');
  });
});
