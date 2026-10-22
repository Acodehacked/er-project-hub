import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { projectDocuments, projectImages, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth/session';
import { getStorage, isStorageConfigured } from '@/lib/storage';
import { getPolicyProject } from '@/features/projects/queries';
import { canDownloadDocuments, canViewProject } from '@/features/projects/policy';

/**
 * GET /api/files/:id?kind=image|document|avatar
 *
 * The R2 bucket is private. This route checks that the current user may see
 * the file, then redirects to a presigned URL that expires in 5 minutes.
 *   - images of APPROVED projects + avatars: public
 *   - documents: signed-in users who can view the project
 *   - anything of a non-approved project: team, reviewers, admins only
 */
export async function GET(request: NextRequest, ctx: RouteContext<'/api/files/[id]'>) {
  const { id } = await ctx.params;
  const kind = request.nextUrl.searchParams.get('kind');
  if (!isStorageConfigured) return new NextResponse('Storage not configured', { status: 503 });

  const notFound = () => new NextResponse('Not found', { status: 404 });
  const storage = getStorage();

  if (kind === 'avatar') {
    const [user] = await db.select({ avatarKey: users.avatarKey }).from(users).where(eq(users.id, id)).limit(1);
    if (!user?.avatarKey) return notFound();
    return redirectTo(await storage.createDownloadUrl({ key: user.avatarKey, inline: true }), 3600);
  }

  if (kind === 'image') {
    const [image] = await db.select().from(projectImages).where(eq(projectImages.id, id)).limit(1);
    if (!image) return notFound();
    const project = await getPolicyProject(image.projectId);
    // Unauthorised users get 404 (not 403) so they cannot probe which ids exist.
    if (!canViewProject(await getCurrentUser(), project)) return notFound();
    const cacheable = project.status === 'APPROVED';
    return redirectTo(await storage.createDownloadUrl({ key: image.storageKey, inline: true }), cacheable ? 3600 : 0);
  }

  if (kind === 'document') {
    const [doc] = await db.select().from(projectDocuments).where(eq(projectDocuments.id, id)).limit(1);
    if (!doc) return notFound();
    const user = await getCurrentUser();
    if (!user) return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`, request.url));
    const project = await getPolicyProject(doc.projectId);
    if (!canDownloadDocuments(user, project)) return notFound();
    const inline = request.nextUrl.searchParams.get('inline') === '1' && doc.mimeType === 'application/pdf';
    return redirectTo(await storage.createDownloadUrl({ key: doc.storageKey, fileName: doc.fileName, inline }), 0);
  }

  return notFound();
}

function redirectTo(url: string, maxAgeSeconds: number) {
  const res = NextResponse.redirect(url, 302);
  // Short private caching keeps galleries snappy while the signed URL is still valid.
  res.headers.set('Cache-Control', maxAgeSeconds > 0 ? `private, max-age=${Math.min(maxAgeSeconds, 240)}` : 'no-store');
  return res;
}
