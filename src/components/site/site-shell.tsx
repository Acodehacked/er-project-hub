import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

/** Public page frame: sticky header, content, footer. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
