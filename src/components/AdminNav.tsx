'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/format';

const ITEMS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Manage products', exact: true },
  { href: '/admin/categories', label: 'Manage categories', exact: true },
  { href: '/admin/orders', label: 'Manage orders', exact: true },
  { href: '/admin/refunds', label: 'Refunds', exact: true },
  { href: '/admin/newsletter', label: 'Newsletter', exact: true },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav" aria-label="Admin">
      <p className="admin-nav__title">Back office</p>
      <ul>
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn('admin-nav__link', active && 'is-active')}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
