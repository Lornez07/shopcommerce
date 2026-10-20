import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminSignOut } from '@/components/admin/AdminSignOut';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin'
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Middleware already gates /admin. This is the second lock: a Server Component
  // can be reached without going through the matcher (rewrites, direct RSC).
  if (!user) redirect('/login?redirect=%2Fadmin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect('/');

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="flex shrink-0 flex-col justify-between border-b border-border bg-surface px-5 py-5 lg:w-64 lg:border-b-0 lg:border-r lg:py-8">
          <div>
            <Link href="/admin" className="block">
              <span className="font-display text-lg font-bold text-text-primary">
                ShopCommerce
              </span>
              <span className="mt-0.5 block text-xs font-medium uppercase tracking-wide text-text-muted">
                Admin
              </span>
            </Link>

            <nav className="mt-6 flex gap-1 lg:mt-8 lg:flex-col" aria-label="Admin">
              <Link
                href="/admin"
                aria-current="page"
                className="rounded-sm bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
              >
                Orders
              </Link>
              <Link
                href="/"
                className="rounded-sm px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text-primary"
              >
                Back to store
              </Link>
            </nav>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
            <span className="min-w-0 truncate text-xs text-text-muted">{user.email}</span>
            <AdminSignOut />
          </div>
        </aside>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
