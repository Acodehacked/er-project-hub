import { z } from 'zod';

/** Database ids are UUID strings. */
export const idSchema = z.uuid('Invalid id');

/** Optional http(s) URL; an empty string from a form means "not provided". */
export const optionalUrl = z
  .union([
    z.literal(''),
    z
      .url({ protocol: /^https?$/, error: 'Enter a full URL starting with https://' })
      .max(512, 'URL is too long'),
  ])
  .optional();

/** Converts form "" / undefined values to null for the database. */
export function emptyToNull<T extends string | null | undefined>(value: T): string | null {
  return value && value.trim() !== '' ? value.trim() : null;
}

export const pageSchema = z.coerce.number().int().min(1).max(10_000).catch(1);
