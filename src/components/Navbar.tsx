'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/format';
import { adminService, orderService } from '@/lib/services';

/**
 * Storefront header. Every action carries a visible text label so shoppers
 * never have to guess what an icon does. The navbar is shared with the
 * back office (see isAdminArea), so admin pages keep their own link set.
 */
export function Navbar() {
  const { status, user, isAdmin, logout } = useAuth();
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [ordersNeedingAttention, setOrdersNeedingAttention] = useState(0);

  // Back-office screens and an admin's account page stay in the admin context.
  // Treat a loading account page as admin context until the restored session is
  // known so the shopfront links do not flash before the role is loaded.
  const isAdminArea = pathname === '/admin'
    || pathname.startsWith('/admin/')
    || (pathname === '/account' && (isAdmin || status === 'loading'));

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/bakery', label: 'Bakery' },
    { href: '/about', label: 'Our story' },
    { href: '/contact', label: 'Contact us' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    if (status !== 'authenticated') {
      setOrdersNeedingAttention(0);
      return;
    }

    let active = true;
    const refreshCounts = async () => {
      try {
        const actionableCount = isAdmin
          ? (await adminService.orders()).filter((order) =>
              order.payment_status === 'pending' ||
              ((order.payment_status === 'paid' || order.payment_status === 'partially_refunded') &&
                order.fulfilment_status === 'new'),
            ).length
          : (await orderService.mine()).filter((order) => order.payment_status === 'pending').length;

        if (active) setOrdersNeedingAttention(actionableCount);
      } catch {
        if (active) setOrdersNeedingAttention(0);
      }
    };

    void refreshCounts();
    const interval = window.setInterval(() => void refreshCounts(), 60_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isAdmin, status]);

  const ordersHref = isAdmin ? '/admin/orders' : '/orders';
  const ordersLabel = isAdmin ? 'Orders' : 'My orders';

  return (
    <header className={cn('navbar', isAdmin && 'navbar--admin-user')}>
      <div className="container navbar__inner">
        <Link
          href={isAdminArea ? '/admin/products' : '/'}
          className="brand"
          aria-label={isAdminArea ? 'Admin products' : 'Nhlanganiso Catering & Baking, home'}
        >
          <Image
            src="/brand/logo.png"
            alt="Nhlanganiso Catering and Baking"
            width={1536}
            height={1024}
            priority
            className="brand__mark"
          />
        </Link>

        {!isAdminArea ? (
          <nav className="navbar__nav-desktop" aria-label="Main">
            <ul className="navbar__menu">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn('navbar__link', isActive(l.href) && 'is-active')}
                    aria-current={isActive(l.href) ? 'page' : undefined}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="navbar__actions">
          {status === 'authenticated' && !isAdminArea ? (
            <Link href={ordersHref} className="navbar__text-link navbar__orders-link">
              <span>{ordersLabel}</span>
              {ordersNeedingAttention > 0 ? (
                <span
                  className="navbar__count"
                  aria-label={`${ordersNeedingAttention} orders need attention`}
                >
                  {ordersNeedingAttention > 9 ? '9+' : ordersNeedingAttention}
                </span>
              ) : null}
            </Link>
          ) : null}

          {status === 'authenticated' && !isAdminArea ? (
            <Link href="/account/favorites" className="navbar__text-link navbar__favourites-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>Favourites</span>
            </Link>
          ) : null}

          {status === 'authenticated' && user ? (
            <Link href="/account" className="navbar__text-link navbar__account-link" title={user.full_name}>
              <span>{isAdminArea ? 'Account' : user.full_name.split(' ')[0]}</span>
            </Link>
          ) : status === 'anonymous' ? (
            <Link href="/login" className="navbar__text-link navbar__account-link">
              <span>Sign in</span>
            </Link>
          ) : null}

          {!isAdminArea ? (
            <Link href="/cart" className="navbar__bag-btn" aria-label={`Shopping bag${ready && count > 0 ? `, ${count} ${count === 1 ? 'item' : 'items'}` : ', empty'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7V5a3 3 0 0 1 6 0v2" />
              </svg>
              <span>Bag</span>
              {ready && count > 0 ? <span className="cart-badge" aria-hidden="true">{count}</span> : null}
            </Link>
          ) : null}

          {status === 'authenticated' ? (
            <button
              type="button"
              className="navbar__text-link navbar__signout-btn"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
