import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="relative max-w-md space-y-5 text-center">
        <Logo className="justify-center" />
        <p className="font-mono text-7xl font-extrabold text-primary">404</p>
        <h1 className="text-2xl font-bold">We couldn’t find that page</h1>
        <p className="text-muted-foreground">The link may be broken, or the project may not be public yet.</p>
        <div className="flex justify-center gap-2">
          <Button asChild><Link href="/projects"><Compass /> Browse projects</Link></Button>
          <Button asChild variant="outline"><Link href="/">Home</Link></Button>
        </div>
      </div>
    </div>
  );
}
