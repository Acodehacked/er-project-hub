'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/shared/logo';
import { UserAvatar } from '@/components/shared/user-avatar';
import type { NavSection } from '@/components/navigation/nav-config';
import { NAV_ICONS } from '@/components/navigation/nav-icons';

type Props = {
  sections: NavSection[];
  badges: { reviews: number; notifications: number };
  user: { id: string; name: string; roleLabel: string; avatarKey: string | null };
  canCreate: boolean;
};

/** Role-aware sidebar: only shows what the signed-in user can use, with live badge counts. */
export function AppSidebar({ sections, badges, user, canCreate }: Props) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string) =>
    href === '/dashboard' || href === '/admin' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <Logo href="/dashboard" className="group-data-[collapsible=icon]:hidden" />
        <Logo href="/dashboard" compact className="hidden group-data-[collapsible=icon]:inline-flex" />
      </SidebarHeader>
      <SidebarContent>
        {canCreate && (
          <div className="px-3 pt-3 group-data-[collapsible=icon]:hidden">
            <Button asChild className="w-full justify-start">
              <Link href="/dashboard/projects/new" onClick={() => setOpenMobile(false)}><Plus /> New project</Link>
            </Button>
          </div>
        )}
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items
                .filter((item) => !(canCreate && item.href === '/dashboard/projects/new'))
                .map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  const count = item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.title}>
                        <Link href={item.href} onClick={() => setOpenMobile(false)}>
                          <Icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {count > 0 && (
                        <SidebarMenuBadge className="bg-spectrum rounded-full px-1.5 text-white peer-data-[active=true]/menu-button:text-white">
                          {count > 99 ? '99+' : count}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-sidebar-accent">
          <UserAvatar user={user} />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.roleLabel}</p>
          </div>
        </Link>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
