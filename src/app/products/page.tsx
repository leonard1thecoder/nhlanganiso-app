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

function ProductsView() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          <p className="eyebrow"><span className="rule" aria-hidden="true" />The Marketplace</p>
          <h1 className="shop-header__title">Fresh from the Bakery</h1>
          <p className="shop-header__desc">
            Explore our daily inventory of wholesome artisan loaves, decorative celebration cakes, flaky pastries, and catering spreads.
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
              placeholder="Search cakes, sourdough, croissants…"
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
          <button type="submit" className="btn btn-primary shop-search__btn">Find Bakes</button>
        </form>
      </header>

      {/* Category Filter Pills (if categories available) */}
      {categories && categories.length > 0 && (
        <div className="shop-filter-bar">
          <div className="shop-filter-bar__label">Categories:</div>
          <div className="shop-filter-pills">
            <button
              type="button"
              className={`shop-filter-pill ${!q ? 'is-active' : ''}`}
              onClick={() => {
                setInput('');
                go('', 1);
              }}
            >
              All Items
            </button>
            {categories.map((c) => {
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
          <h2>No baked goods match this query</h2>
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
            <Link href="/catering" className="btn btn-outline">
              Request Custom Catering Order
            </Link>
          </div>
        </div>
      ) : null}

      {products && products.length > 0 ? (
        <div className="grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
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
