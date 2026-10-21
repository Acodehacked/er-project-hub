import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { HeroBackground } from '@/components/motion/hero-background';
import { getCurrentUser } from '@/lib/auth/session';

const POINTS = [
  'Submit projects with your team, files and links',
  'Two-stage review by representatives and faculty',
  'A permanent public profile for your work',
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect('/dashboard');

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r bg-card lg:flex lg:flex-col lg:justify-between lg:p-10">
        <HeroBackground />
        <Logo className="relative" />
        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Your department’s home for engineering projects.</h2>
          <ul className="space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">ErHub · Engineering Project Repository</p>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">{children}</div>
      </div>
    </div>
  );
}
