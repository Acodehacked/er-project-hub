import { z } from 'zod';
import { DOCUMENT_KINDS } from '@/db/schema/enums';
import { idSchema } from './common';

/** Upload rules agreed for v2: 25 MB cap, images + office/PDF documents, no ZIP. */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;
export const MAX_IMAGES_PER_PROJECT = 10;
export const MAX_DOCUMENTS_PER_PROJECT = 15;
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export const IMAGE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
} as const satisfies Record<string, readonly string[]>;

export const DOCUMENT_TYPES = {
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['pptx'],
} as const satisfies Record<string, readonly string[]>;

export type UploadKind = 'image' | 'document' | 'avatar';

export function allowedTypesFor(kind: UploadKind): Record<string, readonly string[]> {
  return kind === 'document' ? DOCUMENT_TYPES : IMAGE_TYPES;
}

export function maxSizeFor(kind: UploadKind): number {
  return kind === 'avatar' ? MAX_AVATAR_SIZE : MAX_FILE_SIZE;
}

/** The `accept` attribute for <input type="file">. */
export function acceptAttributeFor(kind: UploadKind): string {
  const types = allowedTypesFor(kind);
  return [...Object.keys(types), ...Object.values(types).flat().map((e) => `.${e}`)].join(',');
}

export function extensionOf(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

/** Checks that MIME type, extension and size all agree with the rules. */
export function validateFileMeta(kind: UploadKind, meta: { fileName: string; mimeType: string; size: number }) {
  const types = allowedTypesFor(kind);
  const extensions = types[meta.mimeType];
  if (!extensions) return 'This file type is not allowed.';
  if (!extensions.includes(extensionOf(meta.fileName))) return 'The file extension does not match its type.';
  if (meta.size <= 0) return 'The file is empty.';
  if (meta.size > maxSizeFor(kind)) return `Files must be ${Math.round(maxSizeFor(kind) / 1024 / 1024)} MB or smaller.`;
  return null;
}

export const requestUploadSchema = z.object({
  projectId: idSchema.optional(),
  kind: z.enum(['image', 'document', 'avatar']),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  size: z.number().int().positive(),
});
export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z.object({
  projectId: idSchema.optional(),
  kind: z.enum(['image', 'document', 'avatar']),
  key: z.string().min(1).max(512),
  fileName: z.string().trim().min(1).max(255),
  documentKind: z.enum(DOCUMENT_KINDS).optional(),
  caption: z.string().trim().max(200).optional(),
});
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
