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
    ...(status === 'authenticated' ? [{ href: '/orders', label: 'My orders' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
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
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn('navbar__link', isActive(l.href) && 'is-active')}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}

          <Link href="/cart" className="navbar__cart" onClick={() => setOpen(false)} aria-label="Cart">
            Cart
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
            <Link href="/login" className="btn btn-primary btn-sm" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
