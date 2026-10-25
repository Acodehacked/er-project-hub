import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { HeroBackground } from '@/components/motion/hero-background';
import { GradientTiles } from '@/components/motion/gradient-tiles';
import { SpectrumSwitch } from '@/components/motion/spectrum-switch';
import { getCurrentUser } from '@/lib/auth/session';

const POINTS = [
  'Submit projects with your team, files and links',
  'Two-stage review by representatives and faculty',
  'A permanent public profile for your work',
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect('/dashboard');

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-2 lg:p-3">
      <div className="relative hidden overflow-hidden rounded-3xl border bg-card shadow-soft lg:flex lg:flex-col">
        <HeroBackground />
        <div className="relative p-10">
          <Logo />
        </div>
        <div className="relative max-w-md space-y-6 px-10 pt-10">
          <h2 className="text-4xl leading-tight font-semibold">
            Your department’s <span className="text-ink-soft">project</span> <SpectrumSwitch /> <span className="text-ink-soft">home.</span>
          </h2>
          <ul className="space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-tile-3" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <GradientTiles cols={10} rows={4} seed={2} className="relative mt-auto p-2" />
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <Logo className="lg:hidden" />
          <ThemeToggle className="bg-secondary/70" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12">{children}</div>
      </div>
    </div>
  );
}
