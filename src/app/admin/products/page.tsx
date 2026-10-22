'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import { productService } from '@/lib/services';
import type { Product } from '@/lib/types';

function AdminProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    productService
      .list({ per_page: 100 })
      .then((res) => !cancelled && setProducts(res.data))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span> <span>Products</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Products</h1>
          <p className="muted small">{products ? `${products.length} products` : 'Loading…'}</p>
        </div>
        <div className="admin-products-actions">
          <Link href="/admin/categories" className="btn btn-outline">
            View categories
          </Link>
          <Link href="/admin/products/new" className="btn btn-primary">
            New product
          </Link>
        </div>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!error && products === null ? <div className="page-loading" role="status">Loading products…</div> : null}
      {products && products.length === 0 ? <p className="muted">No products yet. Create the first one.</p> : null}

      {products && products.length > 0 ? (
        <div className="admin-product-grid">
          {products.map((product) => {
            const promotionQuery = new URLSearchParams({
              product_name: product.name,
              product_slug: product.slug,
              product_price_cents: String(product.price_cents),
            });
            const couponQuery = new URLSearchParams({
              product_id: product.id,
              product_name: product.name,
            });

            return (
              <article className="card admin-product-card" key={product.id}>
                <div className="admin-product-card__heading">
                  <div>
                    <p className="eyebrow">Bakery product</p>
                    <h2>{product.name}</h2>
                  </div>
                  <span className={`badge-pill ${product.active ? 'in-stock' : 'out-of-stock'}`}>
                    {product.active ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <p className="admin-product-card__slug"><code>{product.slug}</code></p>
                <p className="admin-product-card__price">{formatZAR(product.price_cents)}</p>
                {product.description ? (
                  <p className="admin-product-card__description">{product.description}</p>
                ) : null}

                <div className="admin-product-card__actions">
                  <Link
                    href={`/admin/newsletter?${promotionQuery.toString()}`}
                    className="btn btn-outline btn-sm"
                  >
                    Create promotion
                  </Link>
                  <Link
                    href={`/admin/coupons?${couponQuery.toString()}`}
                    className="btn btn-outline btn-sm"
                  >
                    Create coupon promotion
                  </Link>
                  <Link
                    href={`/admin/products/${encodeURIComponent(product.id)}/edit`}
                    className="btn btn-primary btn-sm"
                  >
                    Edit product
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default function AdminProductsPage() {
  return (
    <RequireAuth adminOnly>
      <AdminProducts />
    </RequireAuth>
  );
}
