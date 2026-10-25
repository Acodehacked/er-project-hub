import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { GradientTiles } from '@/components/motion/gradient-tiles';

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-card">
      <div className="bg-columns absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" aria-hidden />
      <div className="relative flex flex-1 items-center justify-center px-4 py-16">
        <div className="max-w-md space-y-5 text-center">
          <Logo className="justify-center" />
          <p className="text-spectrum font-mono text-8xl font-bold tracking-tighter">404</p>
          <h1 className="text-3xl font-semibold">
            We couldn’t find <span className="text-ink-soft">that page</span>
          </h1>
          <p className="text-muted-foreground">The link may be broken, or the project may not be public yet.</p>
          <div className="flex justify-center gap-2">
            <Button asChild><Link href="/projects"><Compass /> Browse projects</Link></Button>
            <Button asChild variant="outline"><Link href="/">Home</Link></Button>
          </div>
        </div>
      </div>
      <GradientTiles cols={14} rows={3} seed={4} className="relative px-2 pb-2" />
    </div>
  );
}
