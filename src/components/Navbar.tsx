'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/format';

function CakeIcon() {
  return (
    <svg className="navbar__cake-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 13h16v6H4z" />
      <path d="M4 13c0-1.5 1.7-2.5 4-2.5s4 1 4 2.5 1.7-2.5 4-2.5 4 1 4 2.5" />
      <path d="M8 7v1M12 6v2M16 7v1" />
      <path d="M4 21h16" />
    </svg>
  );
}

export function Navbar() {
  const { status, user, isAdmin } = useAuth();
  const { count, ready } = useCart();
  const pathname = usePathname();

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
          { href: '/cakes', label: 'Cakes' },
          { href: '/dessert', label: 'Desserts' },
          { href: '/contact', label: 'Contact' },
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
        <Link href="/" className="brand" aria-label="Nhlanganiso Catering & Baking Home">
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
                  {(l.label === 'Cakes' || l.label === 'Desserts') && <CakeIcon />}
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right actions: FAQ, Account, Orders, Cart, Admin */}
        <div className="navbar__actions">
          {!isAdminArea ? (
            <Link
              href="/faq"
              className="navbar__action-btn"
              aria-label="Frequently asked questions"
              title="FAQ"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.7 9a2.4 2.4 0 1 1 4.4 1.3c-.8.6-1.7 1.1-1.7 2.5" />
                <path d="M12.4 16.5h.01" />
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
              className="navbar__action-btn navbar__sign-in-btn"
              aria-label="Sign in"
              title="Sign in"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Sign in</span>
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

        </div>
      </div>
    </header>
  );
}
