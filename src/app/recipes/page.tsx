'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RecipeLikeButton } from '@/components/RecipeLikeButton';
import { describeError } from '@/lib/api';
import { RECIPES, type Recipe } from '@/lib/recipes';
import { newsletterService } from '@/lib/services';
import type { NewsletterReceipt } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <li className="card recipe-card">
      <div className="recipe-card__media">
        <Image
          src={recipe.image}
          alt={recipe.alt}
          width={recipe.imageWidth}
          height={recipe.imageHeight}
          sizes="(max-width: 960px) 100vw, 360px"
        />
      </div>
      <h2 className="recipe-card__title">{recipe.title}</h2>
      <p className="recipe-card__meta">{recipe.meta}</p>
      <div className="recipe-card__actions">
        <Link href={`/recipes/${recipe.id}`} className="btn btn-outline recipe-card__toggle">
          View ingredients and method
        </Link>
        <RecipeLikeButton id={recipe.id} title={recipe.title} />
      </div>
    </li>
  );
}

function NewsletterForm() {
  const params = useSearchParams();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [receipt, setReceipt] = useState<NewsletterReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;
    void newsletterService
      .verify(token)
      .then((r) => setReceipt(r))
      .catch((err) => setError(describeError(err)))
      .finally(() => setVerifying(false));
  }, [token]);

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await newsletterService.subscribe(email.trim().toLowerCase());
      setReceipt(r);
      setEmail('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="container section recipes-page">
        <header className="page-head page-head--center">
          <div>
            <p className="eyebrow"><span className="rule" aria-hidden="true" />From our kitchen</p>
            <h1>Recipes</h1>
            <p className="lead">
              Simple recipes for the cupcakes, scones and biscuits we bake. Try them at home, or order from us when you would rather not.
            </p>
          </div>
        </header>

        <ul className="recipe-grid">
          {RECIPES.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ul>
      </section>

      <section className="container section newsletter-page-section">
        <div className="newsletter-box card">
          <div className="newsletter-head text-center">
            <div className="empty-cart-icon">🗞️</div>
            <p className="eyebrow"><span className="rule" aria-hidden="true" />Bakery Gazette</p>
            <h2 className="newsletter-title">Stories from the Hearth</h2>
            <p className="muted">
              Be the first to hear about seasonal cake creations, holiday menus, catering specials, and secret bakery recipes.
            </p>
          </div>

          {verifying && <div className="page-loading" role="status">Confirming your subscription…</div>}
          {error && <Notice tone="error">{error}</Notice>}

          {receipt ? (
            <div className="newsletter-success text-center">
              <Notice tone="success" title="Subscription confirmed!">
                Thank you for subscribing! You are all set to receive our latest oven-fresh bakery updates.
              </Notice>
              <Link href="/products" className="btn btn-primary btn-lg mt-4">
                Explore Our Fresh Bakes →
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="newsletter-form" noValidate>
              <Field id="newsletter-email" label="Your Email Address" required>
                <TextInput
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.co.za"
                  autoComplete="email"
                />
              </Field>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-block mt-3"
                disabled={submitting}
              >
                {submitting ? 'Subscribing…' : 'Subscribe to Bakery Newsletter →'}
              </button>
              <p className="muted small text-center mt-2">
                No spam, ever. Unsubscribe at any time with a single click.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}

export default function NewsletterPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading recipes…</div>}>
      <NewsletterForm />
    </Suspense>
  );
}
