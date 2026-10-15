import Link from 'next/link';
import { CONTACT, SITE_NAME } from '@/lib/config';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h3 className="footer__title">{SITE_NAME}</h3>
          <p className="muted">Fresh bread, baked goods and catering for every occasion.</p>
        </div>
        <div>
          <h4 className="footer__heading">Explore</h4>
          <ul className="footer__list">
            <li><Link href="/products">Shop</Link></li>
            <li><Link href="/catering">Catering enquiry</Link></li>
            <li><Link href="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="footer__heading">Contact</h4>
          <ul className="footer__list">
            <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">© {year} {SITE_NAME}. Prices in South African Rand (ZAR).</div>
      </div>
    </footer>
  );
}
