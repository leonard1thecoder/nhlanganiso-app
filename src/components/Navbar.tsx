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

  // Back-office screens get a focused header: no shopfront links.
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');

  const navLinks = [
    ...(isAdminArea
      ? [
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/products', label: 'Products' },
          { href: '/admin/orders', label: 'Orders' },
          { href: '/admin/catering', label: 'Enquiries' },
          { href: '/admin/newsletter', label: 'Newsletter' },
        ]
      : [
          { href: '/', label: 'Home' },
          { href: '/products', label: 'Shop' },
          { href: '/products?q=cake', label: 'Celebration Cakes' },
          { href: '/catering', label: 'Catering' },
          { href: '/about', label: 'Our Story' },
        ]),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)} aria-label="Nhlanganiso Catering & Baking Home">
          <Image src="/brand/mark.png" alt="" width={44} height={44} priority className="brand__mark" />
          <span className="brand__text">
            <strong>Nhlanganiso</strong>
            <small>Catering &amp; Baking</small>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="navbar__nav-desktop" aria-label="Primary Navigation">
          <ul className="navbar__menu">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn('navbar__link', isActive(l.href) && 'is-active')}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right actions: Search, Account, Orders, Cart, Admin */}
        <div className="navbar__actions">
          {!isAdminArea ? (
            <Link
              href="/products"
              className="navbar__action-btn"
              aria-label="Search baked goods"
              title="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Link>
          ) : null}

          {status === 'authenticated' && user ? (
            <div className="navbar__account-dropdown">
              <Link
                href="/account"
                className="navbar__action-btn"
                aria-label={`My account (${user.full_name})`}
                title="Account"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="navbar__user-name-short">{user.full_name.split(' ')[0]}</span>
              </Link>
            </div>
          ) : status === 'anonymous' ? (
            <Link
              href="/login"
              className="navbar__action-btn"
              aria-label="Sign in"
              title="Sign in"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : null}

          {status === 'authenticated' && !isAdminArea ? (
            <Link
              href="/orders"
              className="navbar__action-btn"
              aria-label="My orders"
              title="My orders"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M8 7h8" />
                <path d="M8 11h8" />
                <path d="M8 15h5" />
              </svg>
            </Link>
          ) : null}

          {isAdmin && !isAdminArea ? (
            <Link
              href="/admin"
              className="navbar__action-badge"
              title="Admin Portal"
            >
              Admin
            </Link>
          ) : null}

          {!isAdminArea ? (
            <Link
              href="/cart"
              className="navbar__cart-btn"
              aria-label={`Shopping cart${ready && count > 0 ? `, ${count} items` : ''}`}
              title="Shopping Cart"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {ready && count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
          ) : null}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="navbar__hamburger"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="navbar__hamburger-bar" aria-hidden="true" />
            <span className="navbar__hamburger-bar" aria-hidden="true" />
            <span className="navbar__hamburger-bar" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="navbar__drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        id="mobile-nav-drawer"
        className={cn('navbar__drawer', open && 'is-open')}
        aria-label="Mobile Navigation"
      >
        <div className="navbar__drawer-head">
          <div className="brand">
            <Image src="/brand/mark.png" alt="" width={36} height={36} className="brand__mark" />
            <span className="brand__text">
              <strong>Nhlanganiso</strong>
              <small>Catering &amp; Baking</small>
            </span>
          </div>
          <button
            type="button"
            className="navbar__drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="navbar__drawer-nav">
          <ul className="navbar__drawer-list">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn('navbar__drawer-link', isActive(l.href) && 'is-active')}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar__drawer-footer">
          {status === 'authenticated' && user ? (
            <div className="navbar__drawer-user">
              <div className="navbar__drawer-user-info">
                <strong>{user.full_name}</strong>
                <span className="muted small">{user.email}</span>
              </div>
              <div className="navbar__drawer-user-links">
                <Link href="/account" className="btn btn-outline btn-sm btn-block" onClick={() => setOpen(false)}>
                  My account
                </Link>
                <Link href="/orders" className="btn btn-outline btn-sm btn-block" onClick={() => setOpen(false)}>
                  My orders
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="btn btn-outline btn-sm btn-block" onClick={() => setOpen(false)}>
                    Admin portal
                  </Link>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-block"
                  onClick={() => {
                    setOpen(false);
                    void logout();
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : status === 'anonymous' ? (
            <div className="navbar__drawer-auth">
              <Link href="/login" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link href="/register" className="btn btn-outline btn-block" onClick={() => setOpen(false)}>
                Create an account
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </header>
  );
}
