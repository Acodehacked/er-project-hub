import { requireRole } from '@/lib/auth/guards';

/**
 * Every /admin page also checks its own permission; this layout is a
 * second line of defence so a forgotten check can never expose admin pages.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('ADMIN');
  return children;
}
