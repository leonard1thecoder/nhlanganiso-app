'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { newsletterService } from '@/lib/services';
import type { NewsletterReceipt } from '@/lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Recipe = {
  title: string;
  meta: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
  ingredients: string[];
  steps: string[];
};

const RECIPES: Recipe[] = [
  {
    title: 'Chocolate cupcakes',
    meta: 'Makes 12 · Bake 20 minutes',
    image: '/brand/gallery/cupcakes-cooling.png',
    imageWidth: 600,
    imageHeight: 600,
    alt: 'Chocolate cupcakes cooling on a wire rack',
    ingredients: [
      '180 g cake flour',
      '40 g cocoa powder',
      '1 tsp baking powder',
      '1/2 tsp bicarbonate of soda',
      '1/4 tsp salt',
      '200 g caster sugar',
      '2 large eggs',
      '120 ml vegetable oil',
      '180 ml milk',
      '120 ml hot water or coffee',
    ],
    steps: [
      'Heat the oven to 170°C and line a 12-hole muffin tin with paper cases.',
      'Sift the flour, cocoa, baking powder, bicarbonate of soda and salt into a bowl. Stir in the sugar.',
      'In another bowl, whisk the eggs, oil and milk together.',
      'Pour the wet mixture into the dry ingredients and stir until just combined. Add the hot water or coffee and mix until smooth.',
      'Spoon the batter into the cases, filling each about two-thirds full.',
      'Bake for 18 to 20 minutes, until a skewer inserted into the centre comes out clean. Cool in the tin for 5 minutes, then move to a rack.',
    ],
  },
  {
    title: 'Red velvet cupcakes',
    meta: 'Makes 12 · Bake 20 minutes, plus frosting',
    image: '/brand/gallery/red-velvet-cupcakes.png',
    imageWidth: 383,
    imageHeight: 383,
    alt: 'Red velvet cupcakes with white swirl frosting',
    ingredients: [
      '250 g cake flour',
      '1 tbsp cocoa powder',
      '1 tsp bicarbonate of soda',
      '1/2 tsp salt',
      '200 g caster sugar',
      '2 large eggs',
      '120 ml vegetable oil',
      '240 ml buttermilk',
      '1 tsp white vinegar',
      '1 tsp vanilla essence',
      '1 tbsp red food colouring',
      'For the frosting: 125 g butter, 250 g cream cheese, 300 g icing sugar, 1 tsp vanilla essence',
    ],
    steps: [
      'Heat the oven to 175°C and line a 12-hole muffin tin with paper cases.',
      'Sift the flour, cocoa, bicarbonate of soda and salt together. Stir in the sugar.',
      'In another bowl, whisk the eggs, oil, buttermilk, vinegar, vanilla and food colouring together.',
      'Fold the wet ingredients into the dry until just combined. Do not overmix.',
      'Divide the batter between the cases and bake for 18 to 20 minutes, until springy to the touch. Cool completely before frosting.',
      'Beat the butter and cream cheese until smooth, then beat in the icing sugar and vanilla. Pipe onto the cupcakes and finish with a sprinkle of cake crumbs, if you like.',
    ],
  },
  {
    title: 'Classic scones',
    meta: 'Makes about 12 · Bake 12 to 15 minutes',
    image: '/brand/gallery/scones.png',
    imageWidth: 381,
    imageHeight: 381,
    alt: 'Freshly baked golden scones',
    ingredients: [
      '500 g self-raising flour',
      '1/2 tsp salt',
      '2 tbsp caster sugar',
      '80 g cold butter, cubed',
      '1 large egg',
      '250 ml milk, plus extra for brushing',
    ],
    steps: [
      'Heat the oven to 220°C and line a baking tray with baking paper.',
      'Rub the butter into the flour, salt and sugar until the mixture looks like fine breadcrumbs.',
      'Beat the egg into the milk, then stir most of it into the flour with a knife to make a soft dough. Add the rest only if needed.',
      'Turn the dough onto a lightly floured surface, pat it to about 3 cm thick and cut out rounds with a 6 cm cutter.',
      'Place the scones on the tray, brush the tops with milk and bake for 12 to 15 minutes, until risen and golden.',
      'Cool on a rack. Serve warm with butter and jam.',
    ],
  },
  {
    title: 'Piped butter biscuits',
    meta: 'Makes about 24 · Bake 12 to 15 minutes',
    image: '/brand/gallery/butter-biscuits.png',
    imageWidth: 389,
    imageHeight: 358,
    alt: 'Piped butter biscuits with coloured centres',
    ingredients: [
      '250 g soft butter',
      '100 g icing sugar',
      '1 tsp vanilla essence',
      '200 g cake flour',
      '50 g cornflour',
      'A pinch of salt',
      'Glacé cherries, halved, to decorate (optional)',
    ],
    steps: [
      'Heat the oven to 180°C and line two baking trays with baking paper.',
      'Beat the butter and icing sugar until pale and fluffy. Beat in the vanilla.',
      'Sift in the flour, cornflour and salt and mix to a soft dough.',
      'Spoon the dough into a piping bag fitted with a star nozzle and pipe rosettes about 4 cm across onto the trays, leaving space between them.',
      'Press a cherry half into the centre of each biscuit, if using.',
      'Bake for 12 to 15 minutes, until the edges are just golden. Cool on the tray for 5 minutes, then move to a rack.',
    ],
  },
];

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
            <li key={recipe.title} className="card recipe-card">
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
              <details className="recipe-card__details">
                <summary className="btn btn-outline btn-block recipe-card__toggle">View ingredients and method</summary>
                <h3>Ingredients</h3>
                <ul>
                  {recipe.ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h3>Method</h3>
                <ol>
                  {recipe.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </details>
            </li>
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
