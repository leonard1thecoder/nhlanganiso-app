'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/format';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/products', label: 'Products', icon: 'products' },
  { href: '/admin/categories', label: 'Categories', icon: 'categories' },
  { href: '/admin/orders', label: 'Orders', icon: 'orders' },
  { href: '/admin/catering', label: 'Enquiries', icon: 'enquiries' },
  { href: '/admin/refunds', label: 'Refunds', icon: 'refunds' },
  { href: '/admin/newsletter', label: 'Newsletter', icon: 'newsletter' },
];

function AdminNavIcon({ name }: { name: string }) {
  const common = {
    className: 'admin-nav__icon',
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (name === 'dashboard') {
    return <svg {...common}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></svg>;
  }
  if (name === 'products') {
    return <svg {...common}><path d="M4 8h16l-1.5 12h-13z" /><path d="M8 8a4 4 0 0 1 8 0" /><path d="M9 12v2M15 12v2" /></svg>;
  }
  if (name === 'categories') {
    return <svg {...common}><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>;
  }
  if (name === 'orders') {
    return <svg {...common}><path d="M6 3h12v18H6z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>;
  }
  if (name === 'enquiries') {
    return <svg {...common}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.4-3.5A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 2.9 8 7Z" /><path d="M8 12h8" /></svg>;
  }
  if (name === 'refunds') {
    return <svg {...common}><path d="M4 7h13a4 4 0 0 1 0 8H7" /><path d="m8 11-4 4 4 4" /><path d="M8 4h12" /></svg>;
  }
  return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
}

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      <p className="admin-nav__title">Admin workspace</p>
      <ul>
        {ITEMS.map((item) => {
          const active = item.href === '/admin'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn('admin-nav__link', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
              >
                <AdminNavIcon name={item.icon} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
