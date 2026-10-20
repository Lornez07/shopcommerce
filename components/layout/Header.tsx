'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { useCart } from '@/hooks/useCart';
import { signOut } from '@/lib/actions/auth';

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      key={count}
      className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[18px] animate-pulse-badge items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, refresh } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ? { email: data.user.email ?? '' } : null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email ?? '' } : null);
      void refresh();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refresh]);

  async function handleSignOut() {
    await signOut();
    setUser(null);
    await refresh();
    router.push('/');
    router.refresh();
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/category/all', label: 'All Products' }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="Shop Commerce — home">
            <span className="font-display text-xl font-bold text-text-primary">Shop</span>
            <span className="hidden font-body text-text-muted sm:inline">Commerce</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-150',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative rounded-md p-2 text-text-muted transition-colors hover:bg-background hover:text-text-primary"
              aria-label={`Shopping cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <CartBadge count={itemCount} />
            </Link>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="hidden text-sm font-medium text-text-muted transition-colors hover:text-text-primary sm:inline"
                  >
                    Account
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
                    <LogOut className="mr-1 h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
                >
                  Sign In
                </Link>
              )}
            </div>

            <button
              className="rounded-md p-2 text-text-muted transition-colors hover:bg-background hover:text-text-primary md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <div id="mobile-menu" className="animate-slide-down border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-sm px-2 py-2 text-base font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-muted hover:bg-background hover:text-text-primary'
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-border" />
              {user ? (
                <>
                  <Link
                    href="/account"
                    className="rounded-sm px-2 py-2 text-base font-medium text-text-muted transition-colors hover:bg-background hover:text-text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-sm px-2 py-2 text-base font-medium text-text-muted transition-colors hover:bg-background hover:text-text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}