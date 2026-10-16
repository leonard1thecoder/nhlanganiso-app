'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/format';

export function Navbar() {
  const { status, user, isAdmin, logout } = useAuth();
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/products', label: 'Shop' },
    { href: '/catering', label: 'Catering' },
    ...(status === 'authenticated'
      ? [
          {
            href: '/orders',
            label: 'My orders',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
                <path d="M8 15h5" />
              </svg>
            ),
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            href: '/admin',
            label: 'Admin dashboard',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <Image src="/brand/mark.png" alt="" width={44} height={44} priority className="brand__mark" />
          <span className="brand__text">
            <strong>Nhlanganiso</strong>
            <small>Catering &amp; Baking</small>
          </span>
        </Link>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true">{open ? '✕' : '☰'}</span>
        </button>

        <nav id="primary-nav" className={cn('navbar__nav', open && 'is-open')} aria-label="Main">
          {links.map((l) =>
            'icon' in l && l.icon ? (
              <Link
                key={l.href}
                href={l.href}
                className="icon-btn"
                onClick={() => setOpen(false)}
                aria-label={l.label}
                title={l.label}
              >
                {l.icon}
              </Link>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className={cn('navbar__link', isActive(l.href) && 'is-active')}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ),
          )}

          <Link
            href="/cart"
            className="navbar__cart icon-btn"
            onClick={() => setOpen(false)}
            aria-label={`Cart${ready && count > 0 ? `, ${count} items` : ''}`}
            title="Cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {ready && count > 0 && <span className="badge-count">{count}</span>}
          </Link>

          {status === 'authenticated' && user ? (
            <div className="navbar__account">
              <Link href="/account" className="navbar__link" onClick={() => setOpen(false)}>
                {user.full_name.split(' ')[0]}
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
              >
                Sign out
              </button>
            </div>
          ) : status === 'anonymous' ? (
            <Link
              href="/login"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Sign in to your account"
              title="Sign in"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
