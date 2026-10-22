'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/components/Notice';
import { ProductCard } from '@/components/ProductCard';
import { describeError } from '@/lib/api';
import { productService, categoryService } from '@/lib/services';
import type { Category, PageMeta, Product } from '@/lib/types';

const PER_PAGE = 12;
const CAKE_CATEGORY_RE = /cake|birthday|muffin|cupcake|wedding|celebration/i;

interface ProductSection {
  category: Category;
  products: Product[];
}

function ProductsView() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [cakeSections, setCakeSections] = useState<ProductSection[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isCakeBrowse = q.trim().toLowerCase() === 'cake';
  const cakeCategories = (categories ?? []).filter((category) => CAKE_CATEGORY_RE.test(category.name));
  const visibleCategories = isCakeBrowse ? cakeCategories : categories ?? [];

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((res) => !cancelled && setCategories(res))
      .catch(() => !cancelled && setCategories([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCakeBrowse || !categories) {
      setCakeSections(null);
      return;
    }

    const matchingCategories = categories
      .filter((category) => CAKE_CATEGORY_RE.test(category.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (matchingCategories.length === 0) {
      setCakeSections([]);
      return;
    }

    let cancelled = false;
    setCakeSections(null);
    Promise.all(
      matchingCategories.map(async (category) => {
        try {
          const result = await productService.list({ search: category.name, page: 1, per_page: 4 });
          return { category, products: result.data };
        } catch {
          return { category, products: [] };
        }
      }),
    ).then((sections) => {
      if (cancelled) return;
      const seen = new Set<string>();
      setCakeSections(
        sections
          .map((section) => ({
            ...section,
            products: section.products.filter((product) => {
              if (seen.has(product.id)) return false;
              seen.add(product.id);
              return true;
            }),
          }))
          .filter((section) => section.products.length > 0),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [categories, isCakeBrowse]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setProducts(null);
    productService
      .list({ search: q || undefined, page, per_page: PER_PAGE })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [q, page]);

  const go = (nextQ: string, nextPage: number) => {
    const sp = new URLSearchParams();
    if (nextQ) sp.set('q', nextQ);
    if (nextPage > 1) sp.set('page', String(nextPage));
    const qs = sp.toString();
    router.push(qs ? `/products?${qs}` : '/products');
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    go(input.trim(), 1);
  };

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.per_page)) : 1;

  return (
    <section className="container section">
      {/* Editorial Header */}
      <header className="shop-header">
        <div className="shop-header__content">
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Cakes &amp; Collections</p>
          <h1 className="shop-header__title">{isCakeBrowse ? 'Cakes made to share' : 'Fresh from the Bakery'}</h1>
          <p className="shop-header__desc">
            {isCakeBrowse
              ? 'Browse the cakes available now, from celebration favourites to other bakery treats.'
              : 'Browse the current bakery collection, or search for something you have in mind.'}
          </p>
        </div>

        {/* Search Bar */}
        <form className="shop-search" role="search" onSubmit={onSearch}>
          <div className="shop-search__input-wrapper">
            <svg className="shop-search__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <input
              id="product-search"
              className="shop-search__input"
              type="search"
              placeholder={isCakeBrowse ? 'Search birthday cakes, muffins…' : 'Search baked goods…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {input && (
              <button
                type="button"
                className="shop-search__clear"
                onClick={() => {
                  setInput('');
                  go('', 1);
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="btn btn-primary shop-search__btn">{isCakeBrowse ? 'Find Cakes' : 'Find Bakes'}</button>
        </form>
      </header>

      {/* Category Filter Pills (if categories available) */}
      {visibleCategories.length > 0 && (
        <div className="shop-filter-bar">
          <div className="shop-filter-bar__label">{isCakeBrowse ? 'Cake collections:' : 'Categories:'}</div>
          <div className="shop-filter-pills">
            <button
              type="button"
              className={`shop-filter-pill ${isCakeBrowse || !q ? 'is-active' : ''}`}
              onClick={() => {
                const nextQuery = isCakeBrowse ? 'cake' : '';
                setInput(nextQuery);
                go(nextQuery, 1);
              }}
            >
              {isCakeBrowse ? 'All Cakes' : 'All Items'}
            </button>
            {visibleCategories.map((c) => {
              const active = q.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`shop-filter-pill ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    setInput(c.name);
                    go(c.name, 1);
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Count & Active Filter Indicator */}
      <div className="shop-status-bar">
        <div className="shop-status-text">
          {meta ? (
            <span>Showing <strong>{meta.total}</strong> {meta.total === 1 ? 'item' : 'items'}</span>
          ) : (
            <span>Fetching the freshest bakes…</span>
          )}
          {q && (
            <span className="shop-query-badge">
              matching &ldquo;{q}&rdquo;
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  go('', 1);
                }}
                className="shop-query-remove"
                aria-label="Remove filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      {error ? <Notice tone="error" title="Could not load products">{error}</Notice> : null}

      {!error && products === null ? (
        <div className="grid-products" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="product-card product-card--skeleton" />
          ))}
        </div>
      ) : null}

      {products && products.length === 0 ? (
        <div className="empty-catalog-state card">
          <div className="empty-catalog-icon" aria-hidden="true">🥖</div>
          <h2>{isCakeBrowse ? 'No cakes match this query' : 'No baked goods match this query'}</h2>
          <p className="muted">
            We couldn&apos;t find any items matching &ldquo;{q}&rdquo;. Try another term or browse our complete collection.
          </p>
          <div className="cta-row center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setInput('');
                go('', 1);
              }}
            >
              View Full Collection
            </button>
            <Link href="/contact" className="btn btn-outline">
              Contact us about a custom cake
            </Link>
          </div>
        </div>
      ) : null}

      {products && products.length > 0 ? (
        isCakeBrowse && cakeSections && cakeSections.length > 0 ? (
          <div className="cake-collections">
            {cakeSections.map(({ category, products: sectionProducts }) => (
              <section className="cake-collection" key={category.id} aria-labelledby={`cake-collection-${category.id}`}>
                <div className="cake-collection__head">
                  <div>
                    <p className="eyebrow"><span className="rule" aria-hidden="true" />From the cake collection</p>
                    <h2 id={`cake-collection-${category.id}`}>{category.name}</h2>
                  </div>
                  <button type="button" className="link-arrow cake-collection__link" onClick={() => { setInput(category.name); go(category.name, 1); }}>
                    View collection <span aria-hidden="true">→</span>
                  </button>
                </div>
                <div className="grid-products">
                  {sectionProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>
            ))}
            {products.some((product) => !cakeSections.some((section) => section.products.some((item) => item.id === product.id))) ? (
              <section className="cake-collection" aria-labelledby="more-cakes-heading">
                <div className="cake-collection__head"><h2 id="more-cakes-heading">More cakes</h2></div>
                <div className="grid-products">
                  {products.filter((product) => !cakeSections.some((section) => section.products.some((item) => item.id === product.id))).map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="grid-products">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      ) : null}

      {/* Pagination */}
      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => go(q, page - 1)}
          >
            ← Previous
          </button>
          <span className="pagination__info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page >= totalPages}
            onClick={() => go(q, page + 1)}
          >
            Next →
          </button>
        </nav>
      ) : null}
    </section>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading shop…</div>}>
      <ProductsView />
    </Suspense>
  );
}
