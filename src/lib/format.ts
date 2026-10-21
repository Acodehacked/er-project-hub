import type { DocumentKind, ProjectMemberRole, ProjectStatus, RevisionStatus, TechnologyCategory } from '@/types';

/** Human-friendly labels and formatters shared by server and client components. */

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting screening',
  UNDER_REVIEW: 'Faculty review',
  APPROVED: 'Approved',
  REJECTED: 'Changes requested',
  ARCHIVED: 'Archived',
};

export const REVISION_STATUS_LABELS: Record<RevisionStatus, string> = {
  SUBMITTED: 'Awaiting screening',
  UNDER_REVIEW: 'Faculty review',
  APPROVED: 'Applied',
  REJECTED: 'Not accepted',
  CANCELLED: 'Cancelled',
};

export const MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  LEADER: 'Leader',
  DEVELOPER: 'Developer',
  DESIGNER: 'Designer',
  RESEARCHER: 'Researcher',
  DOCUMENTATION: 'Documentation',
  OTHER: 'Other',
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  REPORT: 'Report',
  PRESENTATION: 'Presentation',
  PAPER: 'Paper',
  OTHER: 'Other',
};

export const TECH_CATEGORY_LABELS: Record<TechnologyCategory, string> = {
  LANGUAGE: 'Languages',
  FRAMEWORK: 'Frameworks',
  DATABASE: 'Databases',
  HARDWARE: 'Hardware',
  CLOUD: 'Cloud',
  AI_ML: 'AI / ML',
  TOOL: 'Tools',
  OTHER: 'Other',
};

const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function formatDate(d: Date | string | null | undefined) {
  return d ? dateFmt.format(new Date(d)) : '—';
}

export function formatDateTime(d: Date | string | null | undefined) {
  return d ? dateTimeFmt.format(new Date(d)) : '—';
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function timeAgo(d: Date | string) {
  const seconds = Math.round((new Date(d).getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((p) => p && !p.endsWith('.'))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

/** Profile URL for a user: /2026/abinantony for students, /faculty/meeranair for faculty. */
export function profileHref(u: { username: string; role: string; graduationYear: number | null }) {
  if (u.role === 'FACULTY') return `/faculty/${u.username}`;
  if ((u.role === 'STUDENT' || u.role === 'REPRESENTATIVE') && u.graduationYear) return `/${u.graduationYear}/${u.username}`;
  return null;
}

export function avatarUrl(u: { id: string; avatarKey: string | null }) {
  return u.avatarKey ? `/api/files/${u.id}?kind=avatar&v=${encodeURIComponent(u.avatarKey.slice(-12))}` : null;
}

export function imageUrl(imageId: string) {
  return `/api/files/${imageId}?kind=image`;
}

export function documentUrl(documentId: string, inline = false) {
  return `/api/files/${documentId}?kind=document${inline ? '&inline=1' : ''}`;
}
