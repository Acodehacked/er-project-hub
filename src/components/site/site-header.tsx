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
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <MobileNav items={PUBLIC_NAV} signedIn={!!user} />
        <Logo />
        <SiteNavLinks items={PUBLIC_NAV} />
        <div className="ml-auto flex items-center gap-2">
          <CommandPalette items={paletteItems} className="w-9 px-0 sm:w-64 sm:px-3" />
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserMenu user={toMenuUser(user)} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Sign in</Link>
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
