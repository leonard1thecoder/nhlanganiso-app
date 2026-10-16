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
        <Link href="/admin/products/new" className="btn btn-primary">
          New product
        </Link>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!error && products === null ? <div className="page-loading" role="status">Loading products…</div> : null}
      {products && products.length === 0 ? <p className="muted">No products yet. Create the first one.</p> : null}

      {products && products.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
                <th scope="col" className="num">Price</th>
                <th scope="col">Active</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td data-label="Name">{p.name}</td>
                  <td data-label="Slug">
                    <code>{p.slug}</code>
                  </td>
                  <td data-label="Price" className="num">
                    {formatZAR(p.price_cents)}
                  </td>
                  <td data-label="Active">{p.active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
