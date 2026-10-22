import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Meet Nhlanganiso Catering & Baking and explore the bakery, celebration cakes and catering services.',
};

export default function AboutPage() {
  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / Our Story</nav>
      <header className="page-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />About the bakery</p>
          <h1>{SITE_NAME}</h1>
          <p className="lead">Baked goods, celebration cakes and catering for moments worth sharing.</p>
        </div>
      </header>
      <div className="two-col">
        <article className="card">
          <h2 className="card__title">A bakery for everyday and special occasions</h2>
          <p>Explore the Nhlanganiso bakery for baked goods, or get in touch about a celebration cake or catering for your event.</p>
          <p>Use the shop to browse current products and prices. For a tailored event menu, send an enquiry with your date, guest numbers and requirements.</p>
          <div className="cta-row">
            <Link href="/products" className="btn btn-primary">Browse baked goods</Link>
            <Link href="/catering" className="btn btn-outline">Enquire about catering</Link>
          </div>
        </article>
        <aside className="card">
          <h2 className="card__title">How to order</h2>
          <ol>
            <li>Browse available products and add your selection to the cart.</li>
            <li>Review your cart and continue to checkout.</li>
            <li>For catering, share your event details through the enquiry form.</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}
