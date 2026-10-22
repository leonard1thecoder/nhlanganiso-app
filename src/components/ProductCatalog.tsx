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
const DESSERT_CATEGORY_RE = /dessert|pastry|pastries|tart|pudding|brownie|cookie|macaron|cupcake|muffin/i;
export type CatalogMode = 'all' | 'cakes' | 'desserts';

interface ProductSection {
  category: Category;
  products: Product[];
}

function ProductsView({ mode }: { mode: CatalogMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultQuery = mode === 'cakes' ? 'cake' : mode === 'desserts' ? 'dessert' : '';
  const q = params.get('q') ?? defaultQuery;
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [collectionSections, setCollectionSections] = useState<ProductSection[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isCakeBrowse = mode === 'cakes' || (mode === 'all' && q.trim().toLowerCase() === 'cake');
  const isDessertBrowse = mode === 'desserts' || (mode === 'all' && q.trim().toLowerCase() === 'dessert');
  const isCollectionBrowse = isCakeBrowse || isDessertBrowse;
  const collectionPattern = isDessertBrowse ? DESSERT_CATEGORY_RE : CAKE_CATEGORY_RE;
  const collectionLabel = isDessertBrowse ? 'Desserts' : 'Cakes';
  const collectionNoun = isDessertBrowse ? 'dessert' : 'cake';
  const collectionCategories = (categories ?? []).filter((category) => collectionPattern.test(category.name));
  const visibleCategories = isCollectionBrowse ? collectionCategories : categories ?? [];

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
    if (!isCollectionBrowse || !categories) {
      setCollectionSections(null);
      return;
    }

    const matchingCategories = categories
      .filter((category) => collectionPattern.test(category.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (matchingCategories.length === 0) {
      setCollectionSections([]);
      return;
    }

    let cancelled = false;
    setCollectionSections(null);
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
      setCollectionSections(
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
  }, [categories, collectionPattern, isCollectionBrowse]);

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
    const routePath = mode === 'cakes' ? '/cakes' : mode === 'desserts' ? '/dessert' : '/products';
    if (nextQ && nextQ !== defaultQuery) sp.set('q', nextQ);
    if (nextPage > 1) sp.set('page', String(nextPage));
    const qs = sp.toString();
    router.push(qs ? `${routePath}?${qs}` : routePath);
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
          <p className="eyebrow"><span className="rule" aria-hidden="true" />{isCollectionBrowse ? `${collectionLabel} & Collections` : 'The Bakery'}</p>
          <h1 className="shop-header__title">{isCollectionBrowse ? `${collectionLabel} made to share` : 'Fresh from the Bakery'}</h1>
          <p className="shop-header__desc">
            {isCollectionBrowse
              ? `Browse the ${collectionLabel.toLowerCase()} available now, grouped into collections when categories are available.`
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
              placeholder={isCakeBrowse ? 'Search birthday cakes, muffins…' : isDessertBrowse ? 'Search tarts, brownies, pastries…' : 'Search baked goods…'}
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
          <button type="submit" className="btn btn-primary shop-search__btn">{isCollectionBrowse ? `Find ${collectionLabel}` : 'Find Bakes'}</button>
        </form>
      </header>

      {/* Category Filter Pills (if categories available) */}
      {visibleCategories.length > 0 && (
        <div className="shop-filter-bar">
          <div className="shop-filter-bar__label">{isCollectionBrowse ? `${collectionLabel} collections:` : 'Categories:'}</div>
          <div className="shop-filter-pills">
            <button
              type="button"
              className={`shop-filter-pill ${(isCollectionBrowse ? q.trim().toLowerCase() === (isCakeBrowse ? 'cake' : 'dessert') : !q) ? 'is-active' : ''}`}
              onClick={() => {
                const nextQuery = isCollectionBrowse ? isDessertBrowse ? 'dessert' : 'cake' : '';
                setInput(nextQuery);
                go(nextQuery, 1);
              }}
            >
              {isCollectionBrowse ? `All ${collectionLabel}` : 'All Items'}
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
          <h2>{isCollectionBrowse ? `No ${collectionLabel.toLowerCase()} match this query` : 'No baked goods match this query'}</h2>
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
              Contact us about a custom order
            </Link>
          </div>
        </div>
      ) : null}

      {products && products.length > 0 ? (
        isCollectionBrowse && collectionSections && collectionSections.length > 0 ? (
          <div className="cake-collections">
            {collectionSections.map(({ category, products: sectionProducts }) => (
              <section className="cake-collection" key={category.id} aria-labelledby={`cake-collection-${category.id}`}>
                <div className="cake-collection__head">
                  <div>
                    <p className="eyebrow"><span className="rule" aria-hidden="true" />From the {collectionNoun} collection</p>
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
            {products.some((product) => !collectionSections.some((section) => section.products.some((item) => item.id === product.id))) ? (
              <section className="cake-collection" aria-labelledby="more-collection-heading">
                <div className="cake-collection__head"><h2 id="more-collection-heading">More {collectionLabel.toLowerCase()}</h2></div>
                <div className="grid-products">
                  {products.filter((product) => !collectionSections.some((section) => section.products.some((item) => item.id === product.id))).map((product) => <ProductCard key={product.id} product={product} />)}
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

export function ProductCatalog({ mode }: { mode: CatalogMode }) {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading {mode === 'cakes' ? 'cakes' : mode === 'desserts' ? 'desserts' : 'shop'}…</div>}>
      <ProductsView mode={mode} />
    </Suspense>
  );
}
