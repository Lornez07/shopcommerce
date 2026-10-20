import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display font-bold text-lg text-text-primary">
              ShopCommerce
            </Link>
            <p className="mt-2 text-sm text-text-muted max-w-xs">
              Simple, ownable storefront for small businesses.
            </p>
          </div>
          <nav>
            <h3 className="font-medium text-text-primary mb-3">Shop</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="/category/all" className="hover:text-text-primary transition-colors">All Products</Link></li>
              <li><Link href="#" className="hover:text-text-primary transition-colors">Categories</Link></li>
              <li><Link href="#" className="hover:text-text-primary transition-colors">New Arrivals</Link></li>
            </ul>
          </nav>
          <nav>
            <h3 className="font-medium text-text-primary mb-3">Support</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="#" className="hover:text-text-primary transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-text-primary transition-colors">Shipping Info</Link></li>
              <li><Link href="#" className="hover:text-text-primary transition-colors">Returns</Link></li>
            </ul>
          </nav>
          <nav>
            <h3 className="font-medium text-text-primary mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="#" className="hover:text-text-primary transition-colors">Privacy</Link></li>
              <li><Link href="#" className="hover:text-text-primary transition-colors">Terms</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} ShopCommerce. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-text-primary transition-colors">Email</a>
          </div>
        </div>
      </div>
    </footer>
  );
}