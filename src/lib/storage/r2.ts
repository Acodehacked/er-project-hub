import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';
import { DOWNLOAD_URL_TTL_SECONDS, UPLOAD_URL_TTL_SECONDS, type StorageProvider } from './provider';

/**
 * Cloudflare R2 implementation. R2 speaks the S3 API, so we use the official
 * AWS SDK pointed at the R2 endpoint. The bucket stays PRIVATE: every read
 * goes through an access-checked route that issues a 5-minute signed URL.
 */
export function createR2Provider(): StorageProvider {
  const bucket = env.R2_BUCKET!;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
    },
    // Newer SDKs add CRC32 checksums by default, which browsers cannot send
    // on presigned PUTs. Only compute them when an operation requires it.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  return {
    async createUploadUrl({ key, contentType }) {
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      // Signing content-type means the browser must upload exactly the declared type.
      return getSignedUrl(client, command, {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
        signableHeaders: new Set(['content-type']),
      });
    },

    async createDownloadUrl({ key, fileName, inline }) {
      const disposition = fileName
        ? `${inline ? 'inline' : 'attachment'}; filename="${fileName.replace(/"/g, '')}"`
        : undefined;
      const command = new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: disposition });
      return getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
    },

    async head(key) {
      try {
        const res = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { size: res.ContentLength ?? 0, contentType: res.ContentType };
      } catch (error) {
        if (error instanceof Error && (error.name === 'NotFound' || error.name === 'NoSuchKey')) return null;
        throw error;
      }
    },

    async readPrefix(key, bytes) {
      const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key, Range: `bytes=0-${bytes - 1}` }));
      return res.Body ? await res.Body.transformToByteArray() : new Uint8Array();
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
