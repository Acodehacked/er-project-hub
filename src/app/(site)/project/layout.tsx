import { SiteShell } from '@/components/site/site-shell';

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
