import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const WIZARD_STEPS = [
  { key: 'basics', label: 'Basics', hint: 'Title & abstract' },
  { key: 'team', label: 'Team', hint: 'Members & guide' },
  { key: 'tech', label: 'Tech & links', hint: 'Stack, code, demo' },
  { key: 'files', label: 'Files', hint: 'Images & documents' },
  { key: 'review', label: 'Review', hint: 'Check & submit' },
] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number]['key'];

/** Horizontal stepper for the project editor. Every step is a link, so users can jump around freely. */
export function WizardSteps({ projectId, current, done }: { projectId: string; current: WizardStep; done: Partial<Record<WizardStep, boolean>> }) {
  const currentIndex = WIZARD_STEPS.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Project editor steps" className="mb-8 overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2">
        {WIZARD_STEPS.map((step, i) => {
          const isCurrent = step.key === current;
          const isDone = done[step.key] && !isCurrent;
          return (
            <li key={step.key} className="flex items-center gap-2">
              {i > 0 && <span className={cn('h-px w-6 bg-border sm:w-10', i <= currentIndex && 'bg-primary/60')} />}
              <Link
                href={`/dashboard/projects/${projectId}/edit?step=${step.key}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  isCurrent ? 'border-primary bg-primary text-primary-foreground shadow-lift' : 'bg-card hover:border-tile-3/50',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full text-[11px] font-bold',
                    isCurrent ? 'bg-primary-foreground/20' : isDone ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
