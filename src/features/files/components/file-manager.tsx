'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CloudOff, FileText, ImagePlus, Star, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleActionResult } from '@/components/forms/form-fields';
import { DOCUMENT_KIND_LABELS, documentUrl, formatFileSize, imageUrl } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DOCUMENT_KINDS } from '@/db/schema/enums';
import {
  MAX_DOCUMENTS_PER_PROJECT,
  MAX_IMAGES_PER_PROJECT,
  acceptAttributeFor,
  validateFileMeta,
} from '@/lib/validation/files';
import type { DocumentKind } from '@/types';
import { confirmUploadAction, deleteFileAction, requestUploadAction, setCoverImageAction } from '@/actions/file-actions';

type ImageItem = { id: string; fileName: string; isCover: boolean; caption: string | null };
type DocItem = { id: string; fileName: string; kind: DocumentKind; fileSize: number };
type Uploading = { name: string; progress: number };

/** PUT the file straight to R2 using the presigned URL, reporting progress. */
function putWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Network error — check the bucket CORS settings.'));
    xhr.send(file);
  });
}

export function FileManager({
  projectId,
  images,
  documents,
  storageReady,
  readOnly,
}: {
  projectId: string;
  images: ImageItem[];
  documents: DocItem[];
  storageReady: boolean;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploads, setUploads] = useState<Uploading[]>([]);
  const [docKind, setDocKind] = useState<DocumentKind>('REPORT');
  const imageInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  async function uploadFiles(kind: 'image' | 'document', files: FileList | null) {
    if (!files?.length) return;
    const remaining = kind === 'image' ? MAX_IMAGES_PER_PROJECT - images.length : MAX_DOCUMENTS_PER_PROJECT - documents.length;
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (list.length < files.length) toast.warning(`Only ${remaining} more ${kind}s can be added.`);

    for (const file of list) {
      const problem = validateFileMeta(kind, { fileName: file.name, mimeType: file.type, size: file.size });
      if (problem) {
        toast.error(`${file.name}: ${problem}`);
        continue;
      }
      setUploads((u) => [...u, { name: file.name, progress: 0 }]);
      try {
        const ticket = await requestUploadAction({ projectId, kind, fileName: file.name, mimeType: file.type, size: file.size });
        if (!handleActionResult(ticket)) throw new Error('skip');
        await putWithProgress(ticket.data.uploadUrl, file, (p) => setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress: p } : x))));
        const done = await confirmUploadAction({ projectId, kind, key: ticket.data.key, fileName: file.name, documentKind: kind === 'document' ? docKind : undefined });
        handleActionResult(done, undefined, { quiet: true });
      } catch (error) {
        if (error instanceof Error && error.message !== 'skip') toast.error(`${file.name}: ${error.message}`);
      } finally {
        setUploads((u) => u.filter((x) => x.name !== file.name));
      }
    }
    router.refresh();
  }

  const act = (fn: () => Promise<unknown>) => startTransition(async () => { await fn(); router.refresh(); });

  if (!storageReady) {
    return (
      <Alert className="border-warning/40 bg-warning/10">
        <CloudOff />
        <AlertTitle>Uploads unavailable</AlertTitle>
        <AlertDescription>
          File storage (Cloudflare R2) is not configured yet. You can continue without files and add them later — see docs/R2_SETUP.md.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Images</CardTitle>
            <CardDescription>Screenshots, photos of your prototype, diagrams. JPG, PNG or WebP up to 25 MB · {images.length}/{MAX_IMAGES_PER_PROJECT}</CardDescription>
          </div>
          {!readOnly && (
            <>
              <input ref={imageInput} type="file" accept={acceptAttributeFor('image')} multiple hidden onChange={(e) => { void uploadFiles('image', e.target.files); e.target.value = ''; }} />
              <Button variant="outline" onClick={() => imageInput.current?.click()} disabled={images.length >= MAX_IMAGES_PER_PROJECT}><ImagePlus /> Add images</Button>
            </>
          )}
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <button
              type="button"
              disabled={readOnly}
              onClick={() => imageInput.current?.click()}
              className="grid w-full place-items-center gap-2 rounded-xl border border-dashed p-10 text-sm text-muted-foreground transition-colors hover:border-tile-3/50 hover:text-foreground"
            >
              <Upload className="size-6" /> Click to upload your first image — it becomes the cover.
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <figure key={img.id} className={cn('group relative aspect-video overflow-hidden rounded-xl border bg-muted', img.isCover && 'ring-2 ring-primary')}>
                  <img src={imageUrl(img.id)} alt={img.caption ?? img.fileName} className="size-full object-cover" />
                  {img.isCover && <Badge className="absolute top-2 left-2"><Star className="fill-current" /> Cover</Badge>}
                  {!readOnly && (
                    <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                      {!img.isCover && <Button size="sm" variant="secondary" disabled={pending} onClick={() => act(async () => handleActionResult(await setCoverImageAction(img.id)))}>Make cover</Button>}
                      <Button size="icon" variant="destructive" className="size-8" aria-label={`Delete ${img.fileName}`} disabled={pending} onClick={() => act(async () => handleActionResult(await deleteFileAction('image', img.id)))}><Trash2 /></Button>
                    </div>
                  )}
                </figure>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Project report, presentation, papers. PDF, DOCX or PPTX up to 25 MB · {documents.length}/{MAX_DOCUMENTS_PER_PROJECT}</CardDescription>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <Select value={docKind} onValueChange={(v) => setDocKind(v as DocumentKind)}>
                <SelectTrigger className="w-36" aria-label="Document type"><SelectValue /></SelectTrigger>
                <SelectContent>{DOCUMENT_KINDS.map((k) => <SelectItem key={k} value={k}>{DOCUMENT_KIND_LABELS[k]}</SelectItem>)}</SelectContent>
              </Select>
              <input ref={docInput} type="file" accept={acceptAttributeFor('document')} hidden onChange={(e) => { void uploadFiles('document', e.target.files); e.target.value = ''; }} />
              <Button variant="outline" onClick={() => docInput.current?.click()} disabled={documents.length >= MAX_DOCUMENTS_PER_PROJECT}><Upload /> Upload</Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 && <p className="text-sm text-muted-foreground">No documents yet. Reviewers usually expect your project report.</p>}
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-xl border p-3">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground"><FileText className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <a href={documentUrl(doc.id)} className="block truncate text-sm font-medium hover:text-accent-foreground">{doc.fileName}</a>
                <p className="text-xs text-muted-foreground">{DOCUMENT_KIND_LABELS[doc.kind]} · {formatFileSize(doc.fileSize)}</p>
              </div>
              {!readOnly && (
                <Button size="icon" variant="ghost" aria-label={`Delete ${doc.fileName}`} disabled={pending} onClick={() => act(async () => handleActionResult(await deleteFileAction('document', doc.id)))}><Trash2 /></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <div className="fixed right-4 bottom-4 z-50 w-72 space-y-3 rounded-xl border bg-popover p-4 shadow-lg" aria-live="polite">
          {uploads.map((u) => (
            <div key={u.name} className="space-y-1">
              <p className="truncate text-xs font-medium">{u.name}</p>
              <Progress value={u.progress} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
