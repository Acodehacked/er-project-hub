'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/shared/logo';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/components/navigation/nav-config';
import { NAV_ICONS } from '@/components/navigation/nav-icons';

export function SiteNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-2 md:flex" aria-label="Main">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
              active && 'font-medium text-foreground after:absolute after:-bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-spectrum',
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav({ items, signedIn }: { items: NavItem[]; signedIn: boolean }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
        </SheetHeader>
        <nav className="grid gap-1 px-4">
          {[...items, signedIn ? { title: 'Dashboard', href: '/dashboard', icon: 'home' as const } : { title: 'Sign in', href: '/login', icon: 'home' as const }].map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-accent">
                <Icon className="size-4 text-muted-foreground" /> {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
