'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { categoryService, productService } from '@/lib/services';
import type { Category, Product } from '@/lib/types';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    productService
      .list({ per_page: 4 })
      .then((res) => !cancelled && setFeatured(res.data))
      .catch((err) => !cancelled && setError(describeError(err)));
    categoryService
      .list()
      .then((cats) => !cancelled && setCategories(cats))
      .catch(() => !cancelled && setCategories([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="hero__badge">Baked fresh daily</p>
            <h1>
              Freshly Baked. <span className="accent">Made to Be Shared.</span>
            </h1>
            <p className="lead">
              Everyday loaves, celebration cakes and catering platters — baked in small batches
              and ready for pickup.
            </p>
            <div className="cta-row">
              <Link href="/products" className="btn btn-primary btn-lg">Shop now</Link>
              <Link href="/catering" className="btn btn-secondary btn-lg">Plan an event</Link>
            </div>
            <ul className="hero__points">
              <li><span className="dot" aria-hidden="true" />Baked to order</li>
              <li><span className="dot" aria-hidden="true" />Secure PayFast checkout</li>
              <li><span className="dot" aria-hidden="true" />Easy pickup</li>
            </ul>
          </div>
          <div className="hero__art">
            <Image
              src="/brand/logo.jpg"
              alt="Nhlanganiso Catering & Baking logo: three figures, bread and wheat"
              width={1920}
              height={1280}
              priority
              sizes="(max-width: 900px) 90vw, 560px"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="eyebrow"><span className="rule" aria-hidden="true" />Fresh from the oven</p>
              <h2>Featured products</h2>
            </div>
            <Link href="/products" className="link-arrow">View all →</Link>
          </div>

          {error ? <Notice tone="error">{error}</Notice> : null}

          {!error && featured === null ? (
            <div className="grid-products" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-card product-card--skeleton" />
              ))}
            </div>
          ) : null}

          {featured && featured.length === 0 ? (
            <p className="muted">Our shelves are being restocked. Check back soon.</p>
          ) : null}

          {featured && featured.length > 0 ? (
            <div className="grid-products">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {categories && categories.length > 0 ? (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <div>
                <p className="eyebrow"><span className="rule" aria-hidden="true" />Browse by craving</p>
                <h2>Shop by category</h2>
              </div>
            </div>
            <ul className="cat-chips">
              {categories.map((c) => (
                <li key={c.id}>
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container editorial">
          <div>
            <p className="eyebrow"><span className="rule" aria-hidden="true" />Our bakery</p>
            <h2>Baking worth gathering around</h2>
            <p className="muted">
              Nhlanganiso Catering &amp; Baking prepares bread, cakes and platters in small,
              fresh batches — from weekday loaves to wedding and celebration orders.
            </p>
          </div>
          <div className="steps">
            <div className="step">
              <span className="step__num" aria-hidden="true">1</span>
              <h3>Choose your bakes</h3>
              <p className="muted">Browse the shop and add to your cart.</p>
            </div>
            <div className="step">
              <span className="step__num" aria-hidden="true">2</span>
              <h3>Pay securely</h3>
              <p className="muted">Check out with PayFast. Totals are verified by our server.</p>
            </div>
            <div className="step">
              <span className="step__num" aria-hidden="true">3</span>
              <h3>Collect fresh</h3>
              <p className="muted">Pick up your order from the bakery, baked to schedule.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-band">
          <div>
            <h2>Hosting something special?</h2>
            <p className="muted">Weddings, birthdays, office lunches and celebrations — request a tailored quote.</p>
          </div>
          <Link href="/catering" className="btn btn-secondary btn-lg">Request a catering quote</Link>
        </div>
      </section>
    </>
  );
}
