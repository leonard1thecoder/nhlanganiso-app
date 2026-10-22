'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/format';

function NavIcon({ href }: { href: string }) {
  const common = {
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

  if (href === '/cakes' || href === '/dessert' || href === '/admin/products') {
    return (
      <svg {...common}>
        <path d="M4 13h16v6H4z" />
        <path d="M4 13c0-1.5 1.7-2.5 4-2.5s4 1 4 2.5 1.7-2.5 4-2.5 4 1 4 2.5" />
        <path d="M8 7v1M12 6v2M16 7v1M4 21h16" />
      </svg>
    );
  }

  if (href === '/' || href === '/admin') {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-7h6v7" />
      </svg>
    );
  }

  if (href === '/contact' || href === '/admin/catering') {
    return (
      <svg {...common}>
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.4-.7L4 20l1.4-3.5A7.2 7.2 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 2.9 8 7Z" />
        <path d="M8 12h8" />
      </svg>
    );
  }

  if (href === '/about') {
    return (
      <svg {...common}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z" />
        <path d="M4 5.5v16.5M8 7h8M8 11h7" />
      </svg>
    );
  }

  if (href === '/admin/newsletter') {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 3h16v18H4zM8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

export function MobileFooterNav() {
  const pathname = usePathname();
  const { isAdmin, status } = useAuth();
  const isAdminArea = pathname === '/admin'
    || pathname.startsWith('/admin/')
    || (pathname === '/account' && (isAdmin || status === 'loading'));
  const links = isAdminArea
    ? [
        { href: '/admin', label: 'Dashboard' },
        { href: '/admin/products', label: 'Products' },
        { href: '/admin/orders', label: 'Orders' },
        { href: '/admin/catering', label: 'Enquiries' },
        { href: '/admin/newsletter', label: 'Newsletter' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/cakes', label: 'Cakes' },
        { href: '/dessert', label: 'Desserts' },
        { href: '/contact', label: 'Contact' },
        { href: '/about', label: 'Our Story' },
      ];

  return (
    <nav className="mobile-footer-nav" aria-label="Mobile navigation">
      {links.map((link) => {
        const active = link.href === '/'
          ? pathname === '/'
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn('mobile-footer-nav__link', active && 'is-active')}
            aria-current={active ? 'page' : undefined}
          >
            <NavIcon href={link.href} />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
