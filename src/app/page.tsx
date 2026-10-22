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
          ? 'You are already on the list. Keep an eye on your inbox for bakery recipes and subscriber coupons.'
          : 'Thanks for joining us. Check your inbox to confirm your subscription and receive bakery updates.',
      });
    } catch (err) {
      setNewsletterFeedback({ kind: 'error', message: describeError(err) });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <div className="hero__tagline">
              <span className="hero__sparkle" aria-hidden="true">✦</span>
              <span>Handcrafted in South Africa</span>
            </div>
            <h1 className="hero__title">
              Freshly baked. <br />
              <span className="accent">Made to be shared.</span>
            </h1>
            <p className="hero__lead">
              Fresh breads, celebration cakes and catering for life&apos;s special moments.
            </p>
            <div className="cta-row hero__cta-group">
              <Link href="/products" className="btn btn-primary btn-lg">
                Shop Baked Goods
                <span className="btn-arrow" aria-hidden="true">→</span>
              </Link>
              <Link href="/contact" className="btn btn-outline btn-lg">
                Contact &amp; Catering
              </Link>
            </div>
            <div className="hero__trust-strip">
              <div className="hero__trust-item">
                <span className="hero__trust-icon" aria-hidden="true">✓</span>
                <span>Browse the bakery</span>
              </div>
              <div className="hero__trust-item">
                <span className="hero__trust-icon" aria-hidden="true">✓</span>
                <span>Secure PayFast Checkout</span>
              </div>
              <div className="hero__trust-item">
                <span className="hero__trust-icon" aria-hidden="true">✓</span>
                <span>South African Rand pricing</span>
              </div>
            </div>
          </div>

          <div className="hero__art-container">
            <div className="hero__art-card">
              <div className="hero__art-image-wrap">
                <Image
                  src={featured?.find((product) => product.image_url)?.image_url ?? '/brand/mark.png'}
                  alt={featured?.find((product) => product.image_url)?.name ?? 'Nhlanganiso Catering & Baking'}
                  width={1200}
                  height={800}
                  priority
                  className="hero__img"
                  sizes="(max-width: 900px) 90vw, 560px"
                />
              </div>
              <div className="hero__floating-card">
                <div className="hero__floating-badge">Made for sharing</div>
                <p className="hero__floating-text">Explore baked goods and plan a celebration with Nhlanganiso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Carousel / Grid */}
      {categories && categories.length > 0 ? (
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <div>
                <p className="eyebrow"><span className="rule" aria-hidden="true" />Browse by Craving</p>
                <h2>Signature Categories</h2>
              </div>
              <Link href="/products" className="link-arrow">
                View all categories <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="category-grid">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`${CAKE_CATEGORY_RE.test(c.name) ? '/cakes' : DESSERT_CATEGORY_RE.test(c.name) ? '/dessert' : '/products'}?q=${encodeURIComponent(c.name)}`}
                  className="category-card"
                >
                  <div className="category-card__visual">
                    <span className="category-card__monogram" aria-hidden="true">
                      {c.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="category-card__info">
                    <h3 className="category-card__title">{c.name}</h3>
                    <span className="category-card__action">Explore collection →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured Products / Best Sellers */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="eyebrow"><span className="rule" aria-hidden="true" />Fresh from the Oven</p>
              <h2>Best Sellers &amp; Bakery Favourites</h2>
            </div>
            <Link href="/products" className="link-arrow">
              Browse Full Shop <span aria-hidden="true">→</span>
            </Link>
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
            <div className="empty-catalog-state">
              <p className="muted">Our shelves are currently being freshly restocked. Please check back shortly!</p>
              <Link href="/contact" className="btn btn-outline">Enquire about Custom Bakes</Link>
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

      {/* Cakes */}
      <section className="section section--tint">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="eyebrow"><span className="rule" aria-hidden="true" />Made for celebrating</p>
              <h2>Cakes</h2>
            </div>
            <Link href="/cakes" className="link-arrow">
              Explore all cakes <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {cakes === null ? (
            <div className="grid-products" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-card product-card--skeleton" />
              ))}
            </div>
          ) : cakes.length > 0 ? (
            <div className="grid-products">
              {cakes.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <p className="muted">Our cake collection is being freshly prepared. Contact us for a custom celebration cake.</p>
          )}
        </div>
      </section>

      {/* Desserts */}
      <section className="section">
        <div className="container">
          <div className="section__head">
            <div>
              <p className="eyebrow"><span className="rule" aria-hidden="true" />A little something sweet</p>
              <h2>Desserts</h2>
            </div>
            <Link href="/dessert" className="link-arrow">
              Explore all desserts <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          {desserts === null ? (
            <div className="grid-products" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="product-card product-card--skeleton" />
              ))}
            </div>
          ) : desserts.length > 0 ? (
            <div className="grid-products">
              {desserts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <p className="muted">Our dessert selection is being freshly prepared. Browse the bakery for today&apos;s treats.</p>
          )}
        </div>
      </section>

      {/* Brand Craftsmanship / Story */}
      <section className="section section--tint brand-story-section">
        <div className="container brand-story-grid">
          <div className="brand-story-copy">
            <p className="eyebrow"><span className="rule" aria-hidden="true" />The Nhlanganiso Craft</p>
            <h2>Baking Worth Gathering Around</h2>
            <p className="lead-story">
              At Nhlanganiso Catering &amp; Baking, every loaf, delicate tart, and multi-tiered cake starts with wholesome ingredients, honest technique, and deep devotion to taste.
            </p>
            <p className="muted">
              Whether you are stopping by for your family&apos;s daily bread or orchestrating a memorable wedding reception, our bakery is committed to hospitality, warmth, and uncompromised quality.
            </p>
            <div className="story-highlights">
              <div className="story-highlight-item">
                <strong className="story-highlight-number">Bakes</strong>
                <span className="story-highlight-label">Shop breads, cakes and pastries</span>
              </div>
              <div className="story-highlight-item">
                <strong className="story-highlight-number">Events</strong>
                <span className="story-highlight-label">Send a catering enquiry online</span>
              </div>
            </div>
          </div>

          <div className="story-steps-box">
            <h3 className="story-steps-heading">How Our Ordering Works</h3>
            <ol className="story-steps-list">
              <li className="story-step-item">
                <span className="story-step-num">01</span>
                <div>
                  <h4>Browse &amp; Pick Your Treats</h4>
                  <p className="muted small">Select your favourites online, with easy real-time cart review.</p>
                </div>
              </li>
              <li className="story-step-item">
                <span className="story-step-num">02</span>
                <div>
                  <h4>Secure PayFast Checkout</h4>
                  <p className="muted small">Instant payment via card or EFT, verified directly with our server.</p>
                </div>
              </li>
              <li className="story-step-item">
                <span className="story-step-num">03</span>
                <div>
                  <h4>Bespoke Collection</h4>
                  <p className="muted small">Freshly prepared and packaged for pickup at your scheduled time.</p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Catering Showcase Banner */}
      <section className="section catering-banner-section">
        <div className="container">
          <div className="catering-banner-card">
            <div className="catering-banner-content">
              <span className="hero__tagline mb-3">✦ Full-Service Food Design</span>
              <h2>Hosting an Unforgettable Occasion?</h2>
              <p className="muted">
                From intimate dinner celebrations and corporate functions to lavish wedding banquets, Nhlanganiso delivers curated catering platters and dessert bars crafted to impress your guests.
              </p>
              <div className="cta-row">
                <Link href="/contact" className="btn btn-secondary btn-lg">
                  Contact us about your event
                </Link>
                <Link href="/products" className="btn btn-ghost btn-lg">
                  View Pastry Platters
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="section newsletter-signup-section">
        <div className="container">
          <div className="newsletter-signup-card">
            <div className="newsletter-signup-copy">
              <p className="eyebrow"><span className="rule" aria-hidden="true" />A little sweetness in your inbox</p>
              <h2>Join the Nhlanganiso bakery list</h2>
              <p className="newsletter-signup-lead">
                Get subscriber-only discount coupons, baking recipes, and first notice of new seasonal treats.
              </p>
              <div className="newsletter-benefits">
                <span><strong>01</strong> Special coupon offers</span>
                <span><strong>02</strong> Recipes and bakery updates</span>
              </div>
            </div>

            <form className="newsletter-signup-form" onSubmit={onNewsletterSubmit}>
              <label htmlFor="home-newsletter-email">Your email address</label>
              <div className="newsletter-signup-input-row">
                <input
                  id="home-newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={(event) => setNewsletterEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
                <button type="submit" className="btn btn-primary" disabled={subscribing}>
                  {subscribing ? 'Joining...' : 'Subscribe'}
                </button>
              </div>
              {newsletterFeedback ? (
                <p className={`newsletter-signup-feedback is-${newsletterFeedback.kind}`} role={newsletterFeedback.kind === 'error' ? 'alert' : 'status'}>
                  {newsletterFeedback.message}
                </p>
              ) : (
                <p className="newsletter-signup-note">Occasional bakery news only. Unsubscribe whenever you like.</p>
              )}
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
