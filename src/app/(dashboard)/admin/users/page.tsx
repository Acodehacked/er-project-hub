import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { PaginationLinks } from '@/components/shared/pagination-links';
import { SearchForm } from '@/components/shared/search-form';
import { UserAvatar } from '@/components/shared/user-avatar';
import { requirePermission } from '@/lib/auth/guards';
import { ROLE_LABELS } from '@/lib/auth/rbac';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { userQuerySchema } from '@/lib/validation/admin';
import { USER_ROLES } from '@/db/schema/enums';
import { listUsers } from '@/features/admin/queries';
import { getDepartments } from '@/features/catalog/queries';
import { EditUserDialog, ResetPasswordDialog } from '@/features/admin/components/user-dialogs';

export const metadata: Metadata = { title: 'Users' };

export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  await requirePermission('admin:users');
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const query = userQuerySchema.parse(flat);
  const [result, departments] = await Promise.all([listUsers(query), getDepartments()]);

  const roleHref = (role?: string) => {
    const p = new URLSearchParams();
    if (query.q) p.set('q', query.q);
    if (role) p.set('role', role);
    return `/admin/users${p.size ? `?${p}` : ''}`;
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Students sign up themselves. Promote representatives and faculty here, and assign their department."
        breadcrumbs={[{ label: 'Administration', href: '/admin' }, { label: 'Users' }]}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[undefined, ...USER_ROLES].map((r) => (
            <Link
              key={r ?? 'all'}
              href={roleHref(r)}
              className={cn('rounded-full border px-3 py-1 text-sm transition-colors', query.role === r ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-tile-3/50')}
            >
              {r ? ROLE_LABELS[r] : 'All'}
            </Link>
          ))}
        </div>
        <SearchForm defaultValue={query.q} placeholder="Search name, email, username…" keep={{ role: query.role }} />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Department</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((u) => (
              <TableRow key={u.id} className={cn(!u.isActive && 'opacity-60')}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={u} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name} {!u.isActive && <Badge variant="outline" className="ml-1">Inactive</Badge>}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email} · @{u.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{ROLE_LABELS[u.role]}</Badge></TableCell>
                <TableCell className="hidden font-mono text-sm md:table-cell">{u.department?.code ?? '—'}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(u.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <EditUserDialog user={u} departments={departments} />
                  <ResetPasswordDialog user={u} />
                </TableCell>
              </TableRow>
            ))}
            {result.items.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No users match.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationLinks page={result.page} totalPages={result.totalPages} basePath="/admin/users" searchParams={flat} />
    </>
  );
}
