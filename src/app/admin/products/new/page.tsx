'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Field, Select, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { randsToCents } from '@/lib/format';
import { adminService, categoryService } from '@/lib/services';
import type { Category } from '@/lib/types';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

function NewProductForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((cats) => !cancelled && setCategories(cats))
      .catch(() => !cancelled && setCategories([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Enter the product name.';
    if (!slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim()))
      e.slug = 'Use lowercase letters, numbers and hyphens (e.g. chocolate-cake).';
    if (randsToCents(price) === undefined) e.price = 'Enter a valid price in Rand (e.g. 65.00).';
    if (imageUrl.trim() && !/^https?:\/\/.+/.test(imageUrl.trim()))
      e.image_url = 'Enter a full URL starting with http(s)://, or leave blank.';
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    setCreatedSlug(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      // POSTed with the stored admin Bearer token (see src/lib/api.ts interceptor).
      const created = await adminService.createProduct({
        name: name.trim(),
        slug: slug.trim(),
        price_cents: randsToCents(price) as number,
        description: description.trim() ? description.trim() : null,
        image_url: imageUrl.trim() ? imageUrl.trim() : null,
        active,
        category_id: categoryId ? categoryId : null,
      });
      setCreatedSlug(created.slug);
      setName('');
      setSlug('');
      setSlugTouched(false);
      setPrice('');
      setCategoryId('');
      setDescription('');
      setImageUrl('');
      setActive(true);
    } catch (err) {
      setServerError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span>{' '}
        <Link href="/admin/products">Products</Link> <span aria-hidden="true">/</span> <span>New</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>New product</h1>
          <p className="muted small">Creates via POST /api/v1/products as the signed-in admin.</p>
        </div>
      </header>

      {serverError ? <Notice tone="error">{serverError}</Notice> : null}
      {createdSlug ? (
        <Notice tone="success">
          Product created. <Link href={`/products/${createdSlug}`}>View it in the shop</Link> or add another below.
        </Notice>
      ) : null}

      <form className="form-stack card" onSubmit={onSubmit} noValidate>
        <Field id="p-name" label="Name" required error={errors.name}>
          <TextInput
            id="p-name"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Chocolate celebration cake"
            autoComplete="off"
          />
        </Field>

        <Field
          id="p-slug"
          label="Slug"
          required
          hint="URL part: lowercase, numbers and hyphens."
          error={errors.slug}
        >
          <TextInput
            id="p-slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="chocolate-celebration-cake"
            autoComplete="off"
          />
        </Field>

        <Field id="p-price" label="Price (R)" required hint="e.g. 65.00" error={errors.price}>
          <TextInput
            id="p-price"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="65.00"
            autoComplete="off"
          />
        </Field>

        <Field id="p-category" label="Category" hint={categories === null ? 'Loading…' : undefined}>
          <Select id="p-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <p className="field__hint">
            <Link href="/admin/categories/new">+ New category</Link>
          </p>
        </Field>

        <Field id="p-desc" label="Description">
          <TextArea
            id="p-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rich chocolate sponge, serves 8–10…"
          />
        </Field>

        <Field id="p-image" label="Image URL" error={errors.image_url}>
          <TextInput
            id="p-image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
            autoComplete="off"
          />
        </Field>

        <div className="field">
          <label htmlFor="p-active" className="field__label">
            <input
              id="p-active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />{' '}
            Active (visible in shop)
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create product'}
        </button>
      </form>
    </section>
  );
}

export default function NewProductPage() {
  return (
    <RequireAuth adminOnly>
      <NewProductForm />
    </RequireAuth>
  );
}
