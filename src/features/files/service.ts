import 'server-only';
import { and, count, eq } from 'drizzle-orm';
import { db } from '@/db';
import { projectDocuments, projectImages, users } from '@/db/schema';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import { getStorage, matchesSignature } from '@/lib/storage';
import { sanitizeFileName } from '@/lib/security/sanitization';
import { logAudit } from '@/lib/security/audit';
import {
  MAX_DOCUMENTS_PER_PROJECT,
  MAX_IMAGES_PER_PROJECT,
  allowedTypesFor,
  extensionOf,
  maxSizeFor,
  validateFileMeta,
  type ConfirmUploadInput,
  type RequestUploadInput,
} from '@/lib/validation/files';
import type { CurrentUser } from '@/types';
import { getPolicyProject } from '@/features/projects/queries';
import { canEditLight } from '@/features/projects/policy';

/**
 * Upload flow (the file never passes through our server):
 *
 *  1. requestUpload()  – check permission + type + size, return a presigned PUT URL
 *  2. browser PUTs the file straight to R2
 *  3. confirmUpload()  – verify the object really exists, its size, and its
 *                        magic bytes; only then insert the metadata row
 */

function keyPrefix(kind: RequestUploadInput['kind'], ownerId: string) {
  if (kind === 'avatar') return `avatars/${ownerId}/`;
  return `projects/${ownerId}/${kind === 'image' ? 'images' : 'documents'}/`;
}

async function assertProjectUploadAllowed(user: CurrentUser, projectId: string | undefined, kind: 'image' | 'document') {
  if (!projectId) throw new ValidationError('Missing project.');
  const project = await getPolicyProject(projectId);
  if (!canEditLight(user, project)) throw new ForbiddenError('You cannot change files on this project right now.');

  const table = kind === 'image' ? projectImages : projectDocuments;
  const max = kind === 'image' ? MAX_IMAGES_PER_PROJECT : MAX_DOCUMENTS_PER_PROJECT;
  const [row] = await db.select({ value: count() }).from(table).where(eq(table.projectId, projectId));
  if ((row?.value ?? 0) >= max) throw new ValidationError(`A project can have at most ${max} ${kind}s.`);
  return project;
}

export async function requestUpload(user: CurrentUser, input: RequestUploadInput) {
  const problem = validateFileMeta(input.kind, { fileName: input.fileName, mimeType: input.mimeType, size: input.size });
  if (problem) throw new ValidationError(problem);

  const ownerId = input.kind === 'avatar' ? user.id : (await assertProjectUploadAllowed(user, input.projectId, input.kind), input.projectId!);
  // We generate the key — the client never chooses storage paths.
  const key = `${keyPrefix(input.kind, ownerId)}${crypto.randomUUID()}.${extensionOf(input.fileName)}`;
  const uploadUrl = await getStorage().createUploadUrl({ key, contentType: input.mimeType });
  return { key, uploadUrl };
}

export async function confirmUpload(user: CurrentUser, input: ConfirmUploadInput) {
  const ownerId = input.kind === 'avatar' ? user.id : input.projectId;
  if (!ownerId) throw new ValidationError('Missing project.');
  // The key must be one we could have issued for this owner.
  if (!input.key.startsWith(keyPrefix(input.kind, ownerId)) || input.key.includes('..')) {
    throw new ForbiddenError('Invalid upload key.');
  }
  if (input.kind !== 'avatar') await assertProjectUploadAllowed(user, input.projectId, input.kind);

  const storage = getStorage();
  const head = await storage.head(input.key);
  if (!head) throw new ValidationError('Upload not found. Please try again.');

  const mimeType = head.contentType ?? '';
  const reject = async (message: string) => {
    await storage.delete(input.key).catch(() => undefined);
    throw new ValidationError(message);
  };
  if (!allowedTypesFor(input.kind)[mimeType]) await reject('This file type is not allowed.');
  if (head.size > maxSizeFor(input.kind)) await reject('The file is too large.');
  if (!matchesSignature(mimeType, await storage.readPrefix(input.key, 16))) {
    await reject('The file content does not match its type.');
  }

  const fileName = sanitizeFileName(input.fileName);

  if (input.kind === 'avatar') {
    const current = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { avatarKey: true } });
    await db.update(users).set({ avatarKey: input.key }).where(eq(users.id, user.id));
    if (current?.avatarKey) await storage.delete(current.avatarKey).catch(() => undefined);
    return { id: user.id };
  }

  const projectId = input.projectId!;
  const id = crypto.randomUUID();
  if (input.kind === 'image') {
    const [existing] = await db.select({ value: count() }).from(projectImages).where(eq(projectImages.projectId, projectId));
    const isFirst = (existing?.value ?? 0) === 0;
    await db.insert(projectImages).values({
      id,
      projectId,
      fileName,
      storageKey: input.key,
      mimeType,
      fileSize: head.size,
      caption: input.caption || null,
      isCover: isFirst, // the first image becomes the cover automatically
      displayOrder: existing?.value ?? 0,
      uploadedById: user.id,
    });
  } else {
    await db.insert(projectDocuments).values({
      id,
      projectId,
      kind: input.documentKind ?? 'OTHER',
      fileName,
      storageKey: input.key,
      mimeType,
      fileSize: head.size,
      uploadedById: user.id,
    });
  }
  await logAudit({ userId: user.id, action: `file.upload.${input.kind}`, targetEntity: 'project', targetId: projectId, details: { fileName, size: head.size } });
  return { id };
}

export async function deleteProjectFile(user: CurrentUser, kind: 'image' | 'document', fileId: string) {
  const table = kind === 'image' ? projectImages : projectDocuments;
  const [file] = await db.select().from(table).where(eq(table.id, fileId)).limit(1);
  if (!file) throw new NotFoundError('File not found.');

  const project = await getPolicyProject(file.projectId);
  if (!canEditLight(user, project)) throw new ForbiddenError();

  await db.delete(table).where(eq(table.id, fileId));
  await getStorage().delete(file.storageKey).catch((e) => console.error('[files] delete failed', e));

  // Keep a cover image if one was removed.
  if (kind === 'image' && 'isCover' in file && file.isCover) {
    const next = await db.query.projectImages.findFirst({ where: eq(projectImages.projectId, file.projectId) });
    if (next) await db.update(projectImages).set({ isCover: true }).where(eq(projectImages.id, next.id));
  }
  await logAudit({ userId: user.id, action: `file.delete.${kind}`, targetEntity: 'project', targetId: file.projectId, details: { fileName: file.fileName } });
}

export async function setCoverImage(user: CurrentUser, imageId: string) {
  const image = await db.query.projectImages.findFirst({ where: eq(projectImages.id, imageId) });
  if (!image) throw new NotFoundError('Image not found.');
  const project = await getPolicyProject(image.projectId);
  if (!canEditLight(user, project)) throw new ForbiddenError();

  await db.transaction(async (tx) => {
    await tx.update(projectImages).set({ isCover: false }).where(eq(projectImages.projectId, image.projectId));
    await tx.update(projectImages).set({ isCover: true }).where(and(eq(projectImages.id, imageId)));
  });
}

/** Removes every stored object of a project (called after deleting the project). */
export async function purgeProjectFiles(keys: string[]) {
  const storage = getStorage();
  await Promise.allSettled(keys.map((k) => storage.delete(k)));
}
