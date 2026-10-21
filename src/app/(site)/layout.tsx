import { SiteShell } from '@/components/site/site-shell';

/** Public pages (technologies, profiles) share the site header and footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
