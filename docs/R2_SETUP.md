# Cloudflare R2 setup

ErHub stores images, documents and avatars in a **private** R2 bucket. The browser uploads directly to R2 using a 10-minute signed URL, and downloads go through `/api/files/[id]`, which checks permissions and redirects to a 5-minute signed URL.

The app runs without R2. Upload screens just show "Uploads unavailable" until the keys below are set.

## 1. Create the bucket

1. Cloudflare dashboard → **R2 Object Storage** → **Create bucket**.
2. Name it, for example `erhub-dev`. Keep it **private**; don't enable public access or `r2.dev` URLs.

## 2. Create an API token

1. R2 → **Manage R2 API Tokens** → **Create API token**.
2. Permission: **Object Read & Write**, restricted to your bucket.
3. Copy the **Access Key ID** and **Secret Access Key** (shown once) and your **Account ID**.

## 3. Add a CORS rule (required for browser uploads)

Bucket → **Settings** → **CORS policy** → add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

Add your production domain to `AllowedOrigins` when you deploy.

## 4. Fill in `.env`

```bash
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="erhub-dev"
```

Restart `npm run dev`. Open a project → **Edit** → **Files**, and upload an image.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| "Network error — check the bucket CORS settings" | The CORS rule is missing, or the origin/port doesn't match |
| 403 from R2 on upload | The token lacks write permission, or the upload URL expired (it lasts 10 minutes) |
| "The file content does not match its type" | The file was renamed (e.g. `.exe` → `.pdf`). Working as intended |

## Storage keys

```
projects/<projectId>/images/<uuid>.<ext>
projects/<projectId>/documents/<uuid>.<ext>
avatars/<userId>/<uuid>.<ext>
```

The server always generates keys; the browser never chooses a path.
