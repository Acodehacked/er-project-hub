'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { runAction } from '@/lib/action';
import { idSchema } from '@/lib/validation/common';
import { confirmUploadSchema, requestUploadSchema } from '@/lib/validation/files';
import { rateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';
import * as files from '@/features/files/service';

export async function requestUploadAction(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    rateLimit(`upload:${user.id}`, RATE_LIMITS.upload);
    return files.requestUpload(user, requestUploadSchema.parse(input));
  });
}

export async function confirmUploadAction(input: unknown) {
  return runAction(async () => {
    const user = await requireUser();
    const data = confirmUploadSchema.parse(input);
    const result = await files.confirmUpload(user, data);
    if (data.projectId) revalidatePath(`/dashboard/projects/${data.projectId}`, 'layout');
    revalidatePath('/dashboard', 'layout');
    return result;
  }, 'Uploaded');
}

export async function deleteFileAction(kind: 'image' | 'document', fileId: string) {
  return runAction(async () => {
    const user = await requireUser();
    await files.deleteProjectFile(user, z.enum(['image', 'document']).parse(kind), idSchema.parse(fileId));
    revalidatePath('/dashboard', 'layout');
  }, 'File removed');
}

export async function setCoverImageAction(imageId: string) {
  return runAction(async () => {
    const user = await requireUser();
    await files.setCoverImage(user, idSchema.parse(imageId));
    revalidatePath('/dashboard', 'layout');
  }, 'Cover image updated');
}
