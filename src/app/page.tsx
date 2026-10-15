'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { productService } from '@/lib/services';
import type { Product } from '@/lib/types';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    productService
      .list({ per_page: 4 })
      .then((res) => !cancelled && setFeatured(res.data))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">Baked daily · Catered with care</p>
            <h1>Bread and baking worth gathering around.</h1>
            <p className="lead">
              From everyday loaves to celebration cakes and full catering for your guests, every order is
              made fresh in our kitchen.
            </p>
            <div className="cta-row">
              <Link href="/products" className="btn btn-primary btn-lg">Shop now</Link>
              <Link href="/catering" className="btn btn-outline btn-lg">Plan an event</Link>
            </div>
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
              <p className="eyebrow">Fresh from the oven</p>
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

      <section className="section section--tint">
        <div className="container features">
          <div>
            <h3>Baked to order</h3>
            <p className="muted">Small batches, scheduled around your pickup time.</p>
          </div>
          <div>
            <h3>Transparent pricing</h3>
            <p className="muted">Totals are checked by our server before you pay, in Rand.</p>
          </div>
          <div>
            <h3>Catering that scales</h3>
            <p className="muted">Send us your date and guest count and we will send a quote.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cta-band">
          <div>
            <h2>Hosting something special?</h2>
            <p className="muted">Weddings, birthdays, office lunches and funeral receptions.</p>
          </div>
          <Link href="/catering" className="btn btn-primary btn-lg">Request a catering quote</Link>
        </div>
      </section>
    </>
  );
}
