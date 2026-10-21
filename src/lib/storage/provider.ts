/**
 * Storage abstraction. The rest of the app only talks to this interface, so
 * Cloudflare R2 can later be swapped for AWS S3, MinIO on a college server,
 * etc. by writing one new implementation — no feature code changes.
 *
 * Files are uploaded by the BROWSER directly to storage using a short-lived
 * presigned URL, so large files never pass through our Next.js server.
 */
export interface StorageProvider {
  /** URL the browser can PUT the file to (expires quickly). */
  createUploadUrl(params: { key: string; contentType: string }): Promise<string>;
  /** URL to read a private object (expires quickly). */
  createDownloadUrl(params: { key: string; fileName?: string; inline?: boolean }): Promise<string>;
  /** Metadata of an uploaded object, or null if it does not exist. */
  head(key: string): Promise<{ size: number; contentType: string | undefined } | null>;
  /** First bytes of an object — used to verify the real file type ("magic bytes"). */
  readPrefix(key: string, bytes: number): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

export const UPLOAD_URL_TTL_SECONDS = 10 * 60;
export const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;
