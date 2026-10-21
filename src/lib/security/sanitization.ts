/**
 * React escapes everything rendered with {...}, so we never inject raw HTML
 * and do not need an HTML sanitiser. These helpers cover the remaining cases:
 * file names (HTTP headers / storage keys) and slugs/usernames (URLs).
 */

/** Keep a file name safe for Content-Disposition headers and display. */
export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  return cleaned || 'file';
}

/** "Smart Irrigation System!" -> "smart-irrigation-system" */
export function slugify(input: string, maxLength = 80): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
}

/** Suggest a username from a display name: "Abin Antony" -> "abinantony". */
export function suggestUsername(name: string): string {
  return slugify(name, 30).replace(/-/g, '') || 'user';
}
