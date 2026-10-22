'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Field, Select, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError } from '@/lib/api';
import { randsToCents } from '@/lib/format';
import { adminService, categoryService, productService } from '@/lib/services';
import type { Category, CreateProductBody, Product } from '@/lib/types';

function EditProductForm() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    productService
      .list({ per_page: 100 })
      .then((result) => {
        if (cancelled) return;
        const found = result.data.find((item) => item.id === productId);
        if (!found) {
          setError('Product not found. Return to the product list and try again.');
          return;
        }

        setProduct(found);
        setName(found.name);
        setSlug(found.slug);
        setPrice((found.price_cents / 100).toFixed(2));
        setCategoryId(found.category_id ?? '');
        setDescription(found.description ?? '');
        setImageUrl(found.image_url ?? '');
        setActive(found.active);
      })
      .catch((err) => {
        if (!cancelled) setError(describeError(err));
      });
    categoryService.list().then((items) => {
      if (!cancelled) setCategories(items);
    }).catch(() => {
      if (!cancelled) setCategories([]);
    });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!product) return;
    setError(null);
    setNotice(null);

    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Enter the product name.';
    if (!slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      nextErrors.slug = 'Use lowercase letters, numbers and hyphens (e.g. chocolate-cake).';
    }
    const priceCents = randsToCents(price);
    if (priceCents === undefined) nextErrors.price = 'Enter a valid price in Rand (e.g. 65.00).';
    if (product.image_url !== undefined && imageUrl.trim() && !/^https?:\/\/.+/.test(imageUrl.trim())) {
      nextErrors.image_url = 'Enter a full URL starting with http(s)://, or leave blank.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || priceCents === undefined) return;

    const body: Partial<CreateProductBody> = {
      name: name.trim(),
      slug: slug.trim(),
      price_cents: priceCents,
      active,
    };
    if (product.category_id !== undefined) body.category_id = categoryId || null;
    if (product.description !== undefined) body.description = description.trim() || null;
    if (product.image_url !== undefined) body.image_url = imageUrl.trim() || null;

    setSubmitting(true);
    try {
      await adminService.updateProduct(product.id, body);
      setProduct({ ...product, ...body });
      setNotice('Product updated successfully.');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin/products">Products</Link> <span aria-hidden="true">/</span> <span>Edit product</span>
      </nav>

      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>Edit product</h1>
          <p className="muted small">Update the product details shown in the shop.</p>
        </div>
      </header>

      {notice ? <Notice tone="success">{notice}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {!product && !error ? <div className="page-loading" role="status">Loading product…</div> : null}

      {product ? (
        <form className="form-stack card" onSubmit={onSubmit} noValidate>
          <Field id="edit-product-name" label="Name" required error={errors.name}>
            <TextInput id="edit-product-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>

          <Field id="edit-product-slug" label="Slug" required error={errors.slug}>
            <TextInput id="edit-product-slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
          </Field>

          <Field id="edit-product-price" label="Price (R)" required hint="e.g. 65.00" error={errors.price}>
            <TextInput
              id="edit-product-price"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>

          {product.category_id !== undefined ? (
            <Field id="edit-product-category" label="Category">
              <Select id="edit-product-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}

          {product.description !== undefined ? (
            <Field id="edit-product-description" label="Description">
              <TextArea id="edit-product-description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
          ) : null}

          {product.image_url !== undefined ? (
            <Field id="edit-product-image" label="Image URL" error={errors.image_url}>
              <TextInput
                id="edit-product-image"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://…"
              />
            </Field>
          ) : null}

          <div className="field">
            <label htmlFor="edit-product-active" className="field__label">
              <input
                id="edit-product-active"
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />{' '}
              Active (visible in shop)
            </label>
          </div>

          <div className="admin-products-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
            <Link href="/admin/products" className="btn btn-outline">Cancel</Link>
          </div>
        </form>
      ) : null}
    </section>
  );
}

export default function EditProductPage() {
  return (
    <RequireAuth adminOnly>
      <EditProductForm />
    </RequireAuth>
  );
}
