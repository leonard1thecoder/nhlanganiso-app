'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { categoryService } from '@/lib/services';
import type { Category } from '@/lib/types';

function AdminCategories() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((cats) => !cancelled && setCategories(cats))
      .catch((err) => !cancelled && setError(describeError(err)));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span> <span>Categories</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Categories</h1>
          <p className="muted small">{categories ? `${categories.length} categories` : 'Loading…'}</p>
        </div>
        <Link href="/admin/categories/new" className="btn btn-primary">
          New category
        </Link>
      </header>

      {error ? <Notice tone="error">{error}</Notice> : null}
      {!error && categories === null ? <div className="page-loading" role="status">Loading categories…</div> : null}
      {categories && categories.length === 0 ? <p className="muted">No categories yet. Create the first one.</p> : null}

      {categories && categories.length > 0 ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Slug</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td data-label="Name">{c.name}</td>
                  <td data-label="Slug">
                    <code>{c.slug}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export default function AdminCategoriesPage() {
  return (
    <RequireAuth adminOnly>
      <AdminCategories />
    </RequireAuth>
  );
}
