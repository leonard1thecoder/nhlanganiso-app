'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { categoryService, newsletterService, productService } from '@/lib/services';
import type { Category, Product } from '@/lib/types';

const CAKE_CATEGORY_RE = /cake|birthday|muffin|cupcake|wedding|celebration/i;
const DESSERT_CATEGORY_RE = /dessert|pastry|pastries|tart|pudding|brownie|cookie|macaron/i;\n\nconst categorySearchTerm = (name: string) => name.toLowerCase() === 'cakes' ? 'cake' : name.toLowerCase() === 'other products' ? 'other products' : name;

async function loadCollectionProducts(categories: Category[], pattern: RegExp, fallbackSearch: string) {
  const matchingCategories = categories.filter((category) => pattern.test(category.name));
  const productGroups = matchingCategories.length > 0
    ? await Promise.all(
        matchingCategories.map(async (category) => {
          try {
            const result = await productService.list({ search: categorySearchTerm(category.name), per_page: 4 });
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
            <div className="home-social-icons" aria-label="Our social platforms and email">
              <span className="home-social-icons__item home-social-icons__item--whatsapp" role="img" aria-label="WhatsApp" title="WhatsApp">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.8 11.8 0 0 0 2 17.7L.5 23.5l6-1.6A11.8 11.8 0 0 0 20.5 3.5ZM12 21a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.5.9.9-3.4-.2-.4A9.8 9.8 0 1 1 12 21Zm5.4-7.3c-.3-.2-1.7-.9-2-.9s-.5-.2-.7.2-.8.9-1 1.1-.4.2-.7.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.5.2-.5c.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3 .2.4.4.6a10.8 10.8 0 0 0 4.2 3.7c.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.7-.7 1.9-1.3s.2-1.2.2-1.3-.2-.2-.5-.3Z"/></svg>
              </span>
              <span className="home-social-icons__item home-social-icons__item--instagram" role="img" aria-label="Instagram" title="Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.7" r="1.2"/></svg>
              </span>
              <span className="home-social-icons__item home-social-icons__item--facebook" role="img" aria-label="Facebook" title="Facebook">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.1H7.3V13h2.8v8h3.4Z"/></svg>
              </span>
              <span className="home-social-icons__item home-social-icons__item--tiktok" role="img" aria-label="TikTok" title="TikTok">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 8.2a6.8 6.8 0 0 1-4.2-1.4v8.1a5.6 5.6 0 1 1-5.6-5.6c.4 0 .8 0 1.2.1v3.1a2.6 2.6 0 1 0 1.7 2.4V2.5h3.1c.2 2.1 1.7 3.8 3.8 4.1v1.6Z"/></svg>
              </span>
              <span className="home-social-icons__item home-social-icons__item--gmail" role="img" aria-label="Gmail" title="Gmail">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5H18V8.2l-6 4.5-6-4.5V20h-.5A2.5 2.5 0 0 1 3 17.5v-11Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m4 6 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
            <ul className="home-hero__facts">
              <li>Prices in South African rand</li>
              <li>Pay securely with PayFast</li>
              <li>Collect from our bakery</li>
            </ul>
          </div>

          <div className="home-hero__media">
            <img
              src="/brand/hero-bread.gif"
              alt="A cinematic view of freshly baked bread being prepared in the bakery"
              width={1200}
              height={800}
              className="home-hero__image"
              fetchPriority="high"
              decoding="async"
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
                    href={`${CAKE_CATEGORY_RE.test(c.name) ? '/cakes' : DESSERT_CATEGORY_RE.test(c.name) ? '/dessert' : '/products'}?q=${encodeURIComponent(categorySearchTerm(c.name))}`}
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
