/** Submission readiness checklist — shown to students before they submit. */
export type ChecklistItem = { key: string; label: string; done: boolean; required: boolean; step: string };

export function buildChecklist(p: {
  abstract: string;
  description: string | null;
  technologies: unknown[];
  members: unknown[];
  images: unknown[];
  documents: unknown[];
  guideId: string | null;
  githubUrl: string | null;
}): ChecklistItem[] {
  return [
    { key: 'abstract', label: 'Abstract written (50+ characters)', done: p.abstract.trim().length >= 50, required: true, step: 'basics' },
    { key: 'tech', label: 'At least one technology', done: p.technologies.length > 0, required: true, step: 'tech' },
    { key: 'description', label: 'Detailed description', done: !!p.description?.trim(), required: false, step: 'basics' },
    { key: 'team', label: 'Teammates added', done: p.members.length > 1, required: false, step: 'team' },
    { key: 'guide', label: 'Faculty guide chosen', done: !!p.guideId, required: false, step: 'team' },
    { key: 'images', label: 'At least one image', done: p.images.length > 0, required: false, step: 'files' },
    { key: 'docs', label: 'Project report uploaded', done: p.documents.length > 0, required: false, step: 'files' },
    { key: 'code', label: 'Source code linked', done: !!p.githubUrl, required: false, step: 'tech' },
  ];
}
