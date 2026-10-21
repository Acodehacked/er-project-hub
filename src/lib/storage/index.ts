import 'server-only';
import { isR2Configured } from '@/lib/env';
import { AppError } from '@/lib/errors';
import type { StorageProvider } from './provider';
import { createR2Provider } from './r2';

export { isR2Configured as isStorageConfigured };
export type { StorageProvider };

let provider: StorageProvider | null = null;

/**
 * Returns the configured storage provider. When R2 keys are missing the app
 * still runs, but upload/download features throw a friendly error.
 */
export function getStorage(): StorageProvider {
  if (!isR2Configured) {
    throw new AppError(
      'File storage is not configured yet. Ask the administrator to add the R2 keys.',
      'STORAGE_UNAVAILABLE',
    );
  }
  provider ??= createR2Provider();
  return provider;
}

/**
 * File signatures ("magic bytes"). A renamed .exe will not start with these,
 * so we can reject files whose CONTENT does not match the declared type.
 */
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/webp': (b) =>
    String.fromCharCode(...b.slice(0, 4)) === 'RIFF' && String.fromCharCode(...b.slice(8, 12)) === 'WEBP',
  'application/pdf': (b) => String.fromCharCode(...b.slice(0, 4)) === '%PDF',
  // DOCX and PPTX are ZIP containers.
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': (b) =>
    b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': (b) =>
    b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04,
};

export function matchesSignature(mimeType: string, prefix: Uint8Array): boolean {
  const check = SIGNATURES[mimeType];
  return !!check && prefix.length >= 4 && check(prefix);
}
