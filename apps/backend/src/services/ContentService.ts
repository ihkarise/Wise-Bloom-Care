/**
 * ContentService — content typing enforcement (docs/02-Research/28,
 * docs/04-Architecture/52 §6 BR-5). The single gate every module surfacing
 * medical content must pass through: it refuses to register OR serve any
 * item lacking a valid `content_type` (one of the three closed types) and a
 * non-empty `source_ref` (28 BR-1/BR-2).
 *
 * Re-validates on **read**, not just on write: Sheets has no schema
 * enforcement (docs/04-Architecture/54 §5), so a row could in principle be
 * corrupted after the fact — this service is the last line of defence before
 * untyped content would ever reach a client (docs/04-Architecture/51 BR-4).
 */

import { newId } from '../lib/ids';

import type { StorageAdapter } from '../adapters/StorageAdapter';
import type { ContentItem, ContentType, UUID } from '@wise-bloom/domain-types';

const VALID_CONTENT_TYPES: readonly ContentType[] = [
  'educational',
  'clinical_recommendation',
  'emergency_warning',
];

/** Refused to register or serve — content missing a valid type or source (docs/02-Research/28 BR-1/BR-2). */
export class UntypedContentError extends Error {
  override readonly name = 'UntypedContentError';
}

export class ContentItemNotFoundError extends Error {
  override readonly name = 'ContentItemNotFoundError';
}

export type RegisterContentInput = Omit<ContentItem, 'content_id'>;

export class ContentService {
  constructor(private readonly storage: StorageAdapter) {}

  private assertTyped(item: Partial<ContentItem>): asserts item is ContentItem {
    if (!item.content_type || !VALID_CONTENT_TYPES.includes(item.content_type)) {
      throw new UntypedContentError(
        'Content item is missing a valid content_type (docs/02-Research/28 BR-1)',
      );
    }
    if (!item.source_ref || !item.source_ref.trim()) {
      throw new UntypedContentError(
        'Content item is missing a source_ref (docs/02-Research/28 BR-1)',
      );
    }
  }

  /** Registers a content item — refuses untyped/unsourced content before it can ever ship (28 BR-2). */
  register(input: RegisterContentInput): ContentItem {
    this.assertTyped(input);
    const item: ContentItem = { ...input, content_id: newId() };
    return this.storage.create('ContentItem', item);
  }

  /** Resolves one content item by id — refuses to serve it if it is not validly typed and sourced. */
  get(contentId: UUID): ContentItem {
    const item = this.storage.get('ContentItem', contentId);
    if (!item) {
      throw new ContentItemNotFoundError(`ContentItem ${contentId} not found`);
    }
    this.assertTyped(item);
    return item;
  }

  /** All validly-typed items for a topic — any corrupted/untyped row is silently excluded, never served. */
  findByTopic(topic: string): ContentItem[] {
    return this.storage.query('ContentItem', { topic }).filter((item) => {
      try {
        this.assertTyped(item);
        return true;
      } catch {
        return false;
      }
    });
  }
}
