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
          <Link href="/" className="footer__brand" aria-label="Nhlanganiso Catering & Baking, home">
            <Image src="/brand/logo.jpg" alt="" width={1536} height={1024} className="footer__logo" />
          </Link>
          <p className="footer__desc">
            Baked goods, celebration cakes and catering from our bakery in South Africa.
          </p>
          <ul className="footer__badges" aria-label="Good to know">
            <li className="footer__pill">Prices in South African rand</li>
            <li className="footer__pill">Pay securely with PayFast</li>
          </ul>
        </div>

        <div>
          <h4 className="footer__heading">Shop</h4>
          <ul className="footer__list">
            <li><Link href="/products">Shop the bakery</Link></li>
            <li><Link href="/cakes">Cakes</Link></li>
            <li><Link href="/dessert">Desserts</Link></li>
            <li><Link href="/cart">Your bag</Link></li>
            <li><Link href="/about">Our story</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer__heading">Help</h4>
          <ul className="footer__list">
            <li><Link href="/contact">Contact and catering</Link></li>
            <li><Link href="/faq">Frequently asked questions</Link></li>
            <li><Link href="/orders">My orders</Link></li>
            <li><Link href="/account">My account</Link></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
          </ul>
        </div>

        {showContact ? (
        <div>
          <h4 className="footer__heading">Get in touch</h4>
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
          </ul>
        </div>
        ) : null}
      </div>

      <div className="footer__bottom">
        <div className="container footer__bottom-inner">
          <p>© {year} {SITE_NAME}. All rights reserved.</p>
          <p className="footer__currency">Prices in South African rand (ZAR). Payments processed by PayFast.</p>
        </div>
      </div>
    </footer>
  );
}
