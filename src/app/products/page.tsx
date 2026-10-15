'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/components/Notice';
import { ProductCard } from '@/components/ProductCard';
import { describeError } from '@/lib/api';
import { productService } from '@/lib/services';
import type { PageMeta, Product } from '@/lib/types';

const PER_PAGE = 12;

// The API supports `search`, `page` and `per_page`. A `category` filter exists in the
// request type but is not applied server-side yet, so it is intentionally not offered here.

function ProductsView() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? '1') || 1);

  const [input, setInput] = useState(q);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setInput(q), [q]);

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
      <header className="page-head">
        <div>
          <p className="eyebrow">Shop</p>
          <h1>Fresh from the bakery</h1>
          <p className="muted">
            {meta ? `${meta.total} ${meta.total === 1 ? 'product' : 'products'}` : 'Loading products…'}
            {q ? <> for &ldquo;{q}&rdquo;</> : null}
          </p>
        </div>

        <form className="search" role="search" onSubmit={onSearch}>
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <input
            id="product-search"
            className="input"
            type="search"
            placeholder="Search bread, cakes, pastries…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </header>

      {error ? <Notice tone="error" title="Could not load products">{error}</Notice> : null}

      {!error && products === null ? (
        <div className="grid-products" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="product-card product-card--skeleton" />
          ))}
        </div>
      ) : null}

      {products && products.length === 0 ? (
        <div className="empty">
          <p>No products matched your search.</p>
          {q ? <button type="button" className="btn btn-outline" onClick={() => go('', 1)}>Clear search</button> : null}
        </div>
      ) : null}

      {products && products.length > 0 ? (
        <div className="grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : null}

      {products && totalPages > 1 ? (
        <nav className="pagination" aria-label="Pagination">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={page <= 1}
            onClick={() => go(q, page - 1)}
          >
            ← Previous
          </button>
          <span className="muted">
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

      <p className="muted small">
        Looking for a larger order? <Link href="/catering">Request a catering quote</Link>.
      </p>
    </section>
  );
}

export default function ProductsPage() {
  // useSearchParams needs a Suspense boundary for static rendering.
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading…</div>}>
      <ProductsView />
    </Suspense>
  );
}
