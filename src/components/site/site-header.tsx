import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { CommandPalette } from '@/components/navigation/command-palette';
import { UserMenu } from '@/components/navigation/user-menu';
import { toMenuUser } from '@/components/navigation/menu-user';
import { buildDashboardNav, PUBLIC_NAV } from '@/components/navigation/nav-config';
import { getCurrentUser } from '@/lib/auth/session';
import { SiteNavLinks, MobileNav } from './site-nav';

export async function SiteHeader() {
  const user = await getCurrentUser();
  const paletteItems = user ? buildDashboardNav(user).flatMap((s) => s.items) : PUBLIC_NAV;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/75 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-2">
          <MobileNav items={PUBLIC_NAV} signedIn={!!user} />
          <Logo />
        </div>
        <SiteNavLinks items={PUBLIC_NAV} />
        <div className="ml-auto flex items-center gap-2">
          <CommandPalette items={paletteItems} className="w-9 rounded-full bg-secondary/70 px-0 lg:w-56 lg:px-3" />
          <ThemeToggle className="bg-secondary/70" />
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu user={toMenuUser(user)} />
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
