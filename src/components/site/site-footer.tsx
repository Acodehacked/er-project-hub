import Link from 'next/link';
import { Logo } from '@/components/shared/logo';

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            The engineering department’s project repository — where student work is reviewed, approved and kept for every
            batch that follows.
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Explore</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/projects">Project repository</Link></li>
            <li><Link className="hover:text-foreground" href="/projects?featured=1">Featured projects</Link></li>
            <li><Link className="hover:text-foreground" href="/technologies">Technologies</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">For students</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link className="hover:text-foreground" href="/register">Create an account</Link></li>
            <li><Link className="hover:text-foreground" href="/dashboard/projects/new">Submit a project</Link></li>
            <li><Link className="hover:text-foreground" href="/login">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} ErHub — Engineering Project Repository & Innovation Management System
        </p>
      </div>
    </footer>
  );
}
