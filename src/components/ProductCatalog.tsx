'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/components/Notice';
import { ProductCard } from '@/components/ProductCard';
import type { Category, PageMeta, Product } from '@/lib/types';
import { describeError } from '@/lib/api';
import { categoryService, productService } from '@/lib/services';

const PER_PAGE = 12;
const categorySearchTerm = (name: string) => name.toLowerCase() === 'cakes' ? 'cake' : name.toLowerCase() === 'other products' ? 'other products' : name;
const CAKE_CATEGORY_RE = /cake|birthday|wedding|celebration/i;
export type CatalogMode = 'all' | 'cakes';

interface ProductSection {
  category: Category;
  products: Product[];
}

function ProductsView({ mode }: { mode: CatalogMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const defaultQuery = mode === 'cakes' ? 'cake' : '';
  const q = params.get('q') ?? defaultQuery;
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [collectionSections, setCollectionSections] = useState<ProductSection[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isCakeBrowse = mode === 'cakes' || (mode === 'all' && q.trim().toLowerCase() === 'cake');
  const isCollectionBrowse = isCakeBrowse;
  const collectionPattern = CAKE_CATEGORY_RE;
  const collectionLabel = 'Cakes';
  const collectionNoun = 'cake';
  const collectionCategories = (categories ?? []).filter((category) => collectionPattern.test(category.name));
  const visibleCategories = isCollectionBrowse ? collectionCategories : categories ?? [];

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((cats) => {
        if (!cancelled) setCategories(cats);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
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
          const products = (await productService.list({ search: categorySearchTerm(category.name), per_page: 4 })).data;
          return { category, products };
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
      .list({ search: q.trim() || undefined, page, per_page: PER_PAGE })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data);
        setMeta(res.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [q, page]);

  const go = (nextQ: string, nextPage: number) => {
    const sp = new URLSearchParams();
    const routePath = mode === 'cakes' ? '/bakery' : '/products';
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
          <p className="eyebrow">{isCollectionBrowse ? 'Bakery collections' : 'Our bakery'}</p>
          <h1 className="shop-header__title">{isCollectionBrowse ? 'Bakery' : 'Shop the bakery'}</h1>
          <p className="shop-header__desc">
            {isCollectionBrowse
              ? `Browse our bakery. Add what you like to your bag, then collect from the bakery.`
              : 'Browse everything we have on the menu, or search for something specific.'}
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
              placeholder={isCakeBrowse ? 'Search bakery' : 'Search the bakery'}
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
          <button type="submit" className="btn btn-primary shop-search__btn">Search</button>
        </form>
      </header>

      {/* Category Filter Pills (if categories available) */}
      {visibleCategories.length > 0 && (
        <div className="shop-filter-bar">
          <div className="shop-filter-bar__label" id="shop-filter-label">{isCollectionBrowse ? 'Bakery collections' : 'Categories'}</div>
          <div className="shop-filter-pills" role="group" aria-labelledby="shop-filter-label">
            <button
              type="button"
              aria-pressed={isCollectionBrowse ? q.trim().toLowerCase() === 'cake' : !q}
              className={`shop-filter-pill ${(isCollectionBrowse ? q.trim().toLowerCase() === 'cake' : !q) ? 'is-active' : ''}`}
              onClick={() => {
                const nextQuery = isCollectionBrowse ? 'cake' : '';
                setInput(nextQuery);
                go(nextQuery, 1);
              }}
            >
              {isCollectionBrowse ? `All ${collectionLabel.toLowerCase()}` : 'All'}
            </button>
            {visibleCategories.map((c) => {
              const searchTerm = categorySearchTerm(c.name);
              const active = q.toLowerCase() === searchTerm.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  className={`shop-filter-pill ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    setInput(searchTerm);
                    go(searchTerm, 1);
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Count & Active Filter Indicator (not shown on the cakes page) */}
      {mode !== 'cakes' && (
      <div className="shop-status-bar">
        <div className="shop-status-text">
          {meta ? (
            <span>Showing <strong>{meta.total}</strong> {meta.total === 1 ? 'item' : 'items'}</span>
          ) : (
            <span>Loading products…</span>
          )}
          {q && (
            <span className="shop-query-badge">
              Showing results for &ldquo;{q}&rdquo;
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
      )}

      {error ? <Notice tone="error" title="Could not load products">{error}</Notice> : null}

      {!error && products === null ? (
        <div className="grid-products" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="tile tile--skeleton" />
          ))}
        </div>
      ) : null}

      {products && products.length === 0 ? (
        <div className="empty-catalog-state card">
          <h2>{isCollectionBrowse ? `No ${collectionLabel.toLowerCase()} match` : 'Nothing matches that search'}</h2>
          <p className="muted">
            We could not find anything for &ldquo;{q}&rdquo;. Try another word, or browse everything.
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
              Browse everything
            </button>
            <Link href="/contact" className="btn btn-outline">
              Enquire about a custom order
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
                    <p className="eyebrow">From the {collectionNoun} collection</p>
                    <h2 id={`cake-collection-${category.id}`}>{category.name}</h2>
                  </div>
                  <button type="button" className="link-arrow cake-collection__link" onClick={() => { setInput(category.name); go(category.name, 1); }}>
                    See all {category.name.toLowerCase()} <span aria-hidden="true">→</span>
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
            Previous
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
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}

export function ProductCatalog({ mode }: { mode: CatalogMode }) {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading {mode === 'cakes' ? 'cakes' : 'shop'}…</div>}>
      <ProductsView mode={mode} />
    </Suspense>
  );
}
