import Link from 'next/link';
import Image from 'next/image';
import { CONTACT, HAS_REAL_CONTACT_EMAIL, HAS_REAL_CONTACT_PHONE, SITE_NAME } from '@/lib/config';

export function Footer() {
  const year = new Date().getFullYear();
  const showContact = HAS_REAL_CONTACT_EMAIL || HAS_REAL_CONTACT_PHONE;

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand-col">
          <Link href="/" className="brand footer__brand" aria-label="Nhlanganiso Home">
            <Image src="/brand/mark.png" alt="" width={40} height={40} className="brand__mark" />
            <span className="brand__text">
              <strong>Nhlanganiso</strong>
              <small>Catering &amp; Baking</small>
            </span>
          </Link>
          <p className="footer__desc">
            Artisanal sourdough, bespoke celebration cakes, and memorable catering feasts made fresh daily with love in South Africa.
          </p>
          <div className="footer__badges">
            <span className="footer__pill">🇿🇦 Proudly South African</span>
            <span className="footer__pill">✨ Baked to Order</span>
          </div>
        </div>

        <div>
          <h4 className="footer__heading">Shop &amp; Menu</h4>
          <ul className="footer__list">
            <li><Link href="/products">All Baked Goods</Link></li>
            <li><Link href="/products?q=cake">Celebration Cakes</Link></li>
            <li><Link href="/products?q=pastry">Pastries &amp; Savoury</Link></li>
            <li><Link href="/catering">Catering Enquiries</Link></li>
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/cart">Shopping Bag</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer__heading">Customer Care</h4>
          <ul className="footer__list">
            <li><Link href="/catering">Contact &amp; Event Booking</Link></li>
            <li><Link href="/orders">Track My Order</Link></li>
            <li><Link href="/account">My Account</Link></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer__heading">Connect &amp; Pickup</h4>
          <ul className="footer__list">
            {HAS_REAL_CONTACT_EMAIL ? (
              <li>
                <a href={`mailto:${CONTACT.email}`} className="footer__contact-link">
                  <span className="footer__icon" aria-hidden="true">✉</span> {CONTACT.email}
                </a>
              </li>
            ) : null}
            {HAS_REAL_CONTACT_PHONE ? (
              <li>
                <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="footer__contact-link">
                  <span className="footer__icon" aria-hidden="true">📞</span> {CONTACT.phone}
                </a>
              </li>
            ) : null}
            <li className="footer__note">Orders are prepared fresh for scheduled bakery collection.</li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {year} {SITE_NAME}. All rights reserved.</p>
          <p className="footer__currency">Prices in South African Rand (ZAR) · Secured via PayFast</p>
        </div>
      </div>
    </footer>
  );
}
