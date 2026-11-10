'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { categoryService, newsletterService, productService } from '@/lib/services';
import type { Category, Product } from '@/lib/types';

const CAKE_CATEGORY_RE = /cake|birthday|muffin|cupcake|wedding|celebration/i;
const DESSERT_CATEGORY_RE = /dessert|pastry|pastries|tart|pudding|brownie|cookie|macaron/i;

async function loadCollectionProducts(categories: Category[], pattern: RegExp, fallbackSearch: string) {
  const matchingCategories = categories.filter((category) => pattern.test(category.name));
  const productGroups = matchingCategories.length > 0
    ? await Promise.all(
        matchingCategories.map(async (category) => {
          try {
            const result = await productService.list({ search: category.name, per_page: 4 });
            return result.data;
          } catch {
            return [];
          }
        }),
      )
    : [
        await productService
          .list({ search: fallbackSearch, per_page: 8 })
          .then((result) => result.data)
          .catch(() => []),
      ];

  const uniqueProducts = new Map<string, Product>();
  for (const product of productGroups.flat()) uniqueProducts.set(product.id, product);
  const products = [...uniqueProducts.values()];
  if (products.length > 0 || matchingCategories.length === 0) return products.slice(0, 4);

  return productService
    .list({ search: fallbackSearch, per_page: 4 })
    .then((result) => result.data)
    .catch(() => []);
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[] | null>(null);
  const [cakes, setCakes] = useState<Product[] | null>(null);
  const [desserts, setDesserts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterFeedback, setNewsletterFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productService
      .list({ per_page: 8 })
      .then((res) => !cancelled && setFeatured(res.data))
      .catch((err) => !cancelled && setError(describeError(err)));
    categoryService
      .list()
      .then((cats) => {
        if (cancelled) return;
        setCategories(cats);
        return Promise.all([
          loadCollectionProducts(cats, CAKE_CATEGORY_RE, 'cake'),
          loadCollectionProducts(cats, DESSERT_CATEGORY_RE, 'dessert'),
        ]).then(([cakeProducts, dessertProducts]) => {
          if (cancelled) return;
          setCakes(cakeProducts);
          setDesserts(dessertProducts);
        });
      })
      .catch(() => {
        if (cancelled) return;
        setCategories([]);
        void Promise.all([
          loadCollectionProducts([], CAKE_CATEGORY_RE, 'cake'),
          loadCollectionProducts([], DESSERT_CATEGORY_RE, 'dessert'),
        ]).then(([cakeProducts, dessertProducts]) => {
          if (cancelled) return;
          setCakes(cakeProducts);
          setDesserts(dessertProducts);
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewsletterFeedback(null);
    setSubscribing(true);
    try {
      const receipt = await newsletterService.subscribe(newsletterEmail.trim().toLowerCase());
      setNewsletterEmail('');
      setNewsletterFeedback({
        kind: 'success',
        message: receipt.already_subscribed
          ? 'You are already subscribed.'
          : 'Thanks for subscribing. Check your inbox and confirm to start receiving bakery news.',
      });
    } catch (err) {
      setNewsletterFeedback({ kind: 'error', message: describeError(err) });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      <section className="home-hero">
        <div className="container home-hero__grid">
          <div className="home-hero__copy">
            <p className="eyebrow">Bakery and catering · South Africa</p>
            <h1 className="home-hero__title">Fresh bakes and celebration cakes, ready to collect.</h1>
            <p className="home-hero__lead">
              Order online and collect from our bakery. For a larger event, send us an enquiry and we will reply with a quote.
            </p>
            <div className="cta-row">
              <Link href="/products" className="btn btn-primary btn-lg">Shop the bakery</Link>
              <Link href="/contact" className="btn btn-outline btn-lg">Plan a catering order</Link>
            </div>
            <ul className="home-hero__facts">
              <li>Prices in South African rand</li>
              <li>Pay securely with PayFast</li>
              <li>Collect from our bakery</li>
            </ul>
          </div>

          <div className="home-hero__media">
            <Image
              src="/brand/hero-bread-still.jpg"
              alt="A freshly baked loaf with a scored crust, beside wheat stalks and flour"
              width={640}
              height={420}
              priority
              className="home-hero__image"
              sizes="(max-width: 900px) 92vw, 560px"
            />
          </div>
        </div>
      </section>

      {categories && categories.length > 0 ? (
        <section className="section section--tint" aria-labelledby="home-categories">
          <div className="container">
            <div className="section__head">
              <h2 id="home-categories">Browse by category</h2>
              <Link href="/products" className="link-arrow">
                See the full shop <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ul className="category-grid">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${CAKE_CATEGORY_RE.test(c.name) ? '/cakes' : DESSERT_CATEGORY_RE.test(c.name) ? '/dessert' : '/products'}?q=${encodeURIComponent(c.name)}`}
                    className="category-card"
                  >
                    <span className="category-card__title">{c.name}</span>
                    <span className="category-card__action">View <span aria-hidden="true">→</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="home-best-sellers">
        <div className="container">
          <div className="section__head">
            <h2 id="home-best-sellers">Best sellers</h2>
            <Link href="/products" className="link-arrow">
              Browse the full shop <span aria-hidden="true">→</span>
            </Link>
          </div>

          {error ? <Notice tone="error">{error}</Notice> : null}

          {!error && featured === null ? (
            <div className="grid-products" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tile tile--skeleton" />
              ))}
            </div>
          ) : null}

          {featured && featured.length === 0 ? (
            <div className="empty-state">
              <p className="muted">Our shelves are being restocked. Check back soon, or send us an enquiry for a custom bake.</p>
              <Link href="/contact" className="btn btn-outline">Enquire about a custom bake</Link>
            </div>
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

      <section className="section section--tint" aria-labelledby="home-cakes">
        <div className="container">
          <div className="section__head">
            <h2 id="home-cakes">Cakes</h2>
            <Link href="/cakes" className="link-arrow">
              All cakes <span aria-hidden="true">→</span>
            </Link>
          </div>
          {cakes === null ? (
            <div className="grid-products" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tile tile--skeleton" />
              ))}
            </div>
          ) : cakes.length > 0 ? (
            <div className="grid-products">
              {cakes.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <p className="muted">Our cake range is being refreshed. Enquire about a custom celebration cake.</p>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="home-desserts">
        <div className="container">
          <div className="section__head">
            <h2 id="home-desserts">Desserts</h2>
            <Link href="/dessert" className="link-arrow">
              All desserts <span aria-hidden="true">→</span>
            </Link>
          </div>
          {desserts === null ? (
            <div className="grid-products" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="tile tile--skeleton" />
              ))}
            </div>
          ) : desserts.length > 0 ? (
            <div className="grid-products">
              {desserts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <p className="muted">Our dessert range is being refreshed. Check back soon.</p>
          )}
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="home-how">
        <div className="container home-how">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 id="home-how">Order online, collect from the bakery</h2>
            <p className="muted">
              Ordering is for collection only at the moment. Your bag shows the price confirmed by our server before you pay.
            </p>
          </div>
          <ol className="home-how__steps">
            <li>
              <span className="home-how__num" aria-hidden="true">1</span>
              <div>
                <h3>Choose your bakes</h3>
                <p className="muted">Add items to your bag and adjust quantities as you go.</p>
              </div>
            </li>
            <li>
              <span className="home-how__num" aria-hidden="true">2</span>
              <div>
                <h3>Pay with PayFast</h3>
                <p className="muted">You will be taken to PayFast to pay by card or Instant EFT. Your order is confirmed once payment is received.</p>
              </div>
            </li>
            <li>
              <span className="home-how__num" aria-hidden="true">3</span>
              <div>
                <h3>Collect from the bakery</h3>
                <p className="muted">We prepare your order for collection from our bakery.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="home-catering">
        <div className="container">
          <div className="catering-panel">
            <div>
              <p className="eyebrow">Catering</p>
              <h2 id="home-catering">Planning an event?</h2>
              <p>
                Tell us the date, the number of guests and what you have in mind. We reply with a quote, and you decide whether to accept it. Accepting a quote does not take payment.
              </p>
            </div>
            <div className="cta-row">
              <Link href="/contact" className="btn btn-secondary btn-lg">Send a catering enquiry</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tint" aria-labelledby="home-newsletter">
        <div className="container newsletter-panel">
          <div>
            <p className="eyebrow">Newsletter</p>
            <h2 id="home-newsletter">Hear about new bakes first</h2>
            <p className="muted">Seasonal specials and news from the bakery. Unsubscribe at any time.</p>
          </div>

          <form className="newsletter-form" onSubmit={onNewsletterSubmit}>
            <label htmlFor="home-newsletter-email" className="field__label">Email address</label>
            <div className="newsletter-form__row">
              <input
                id="home-newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={subscribing}>
                {subscribing ? 'Subscribing…' : 'Subscribe'}
              </button>
            </div>
            {newsletterFeedback ? (
              <p className={`newsletter-form__feedback is-${newsletterFeedback.kind}`} role={newsletterFeedback.kind === 'error' ? 'alert' : 'status'}>
                {newsletterFeedback.message}
              </p>
            ) : (
              <p className="newsletter-form__note">We will send a confirmation email before you receive anything.</p>
            )}
          </form>
        </div>
      </section>
    </>
  );
}
