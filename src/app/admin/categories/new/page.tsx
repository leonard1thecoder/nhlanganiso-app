'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Field, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { RequireAuth } from '@/components/RequireAuth';
import { describeError, toApiError } from '@/lib/api';
import { adminService } from '@/lib/services';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

function NewCategoryForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onName = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v).slice(0, 140));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 1 || n.length > 120) e.name = 'Name must be 1–120 characters.';
    const s = slug.trim();
    if (s.length < 1 || s.length > 140 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))
      e.slug = 'Slug must be 1–140 chars: lowercase, numbers and hyphens (e.g. celebration-cakes).';
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    setCreated(false);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      // POST /api/v1/categories with the stored admin Bearer token.
      await adminService.createCategory({ name: name.trim(), slug: slug.trim() });
      setCreated(true);
      setName('');
      setSlug('');
      setSlugTouched(false);
    } catch (err) {
      const e2 = toApiError(err);
      setServerError(
        e2.status === 409
          ? 'That slug is already taken. Pick a different one.'
          : e2.status === 403
            ? 'Admins only — your account cannot create categories.'
            : describeError(err),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/admin">Dashboard</Link> <span aria-hidden="true">/</span>{' '}
        <Link href="/admin/categories">Categories</Link> <span aria-hidden="true">/</span> <span>New</span>
      </nav>
      <header className="page-head">
        <div>
          <p className="eyebrow">Back office</p>
          <h1>New category</h1>
          <p className="muted small">Creates via POST /api/v1/categories as the signed-in admin.</p>
        </div>
      </header>

      {serverError ? <Notice tone="error">{serverError}</Notice> : null}
      {created ? (
        <Notice tone="success">
          Category created. <Link href="/admin/categories">Back to categories</Link> or add another below.
        </Notice>
      ) : null}

      <form className="form-stack card" onSubmit={onSubmit} noValidate>
        <Field
          id="c-name"
          label="Name"
          required
          hint="1–120 characters."
          error={errors.name}
        >
          <TextInput
            id="c-name"
            value={name}
            maxLength={120}
            onChange={(e) => onName(e.target.value)}
            placeholder="Celebration Cakes"
            autoComplete="off"
          />
        </Field>

        <Field
          id="c-slug"
          label="Slug"
          required
          hint="1–140 chars, lowercase with dashes. Must be unique."
          error={errors.slug}
        >
          <TextInput
            id="c-slug"
            value={slug}
            maxLength={140}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="celebration-cakes"
            autoComplete="off"
          />
        </Field>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create category'}
        </button>
      </form>
    </section>
  );
}

export default function NewCategoryPage() {
  return (
    <RequireAuth adminOnly>
      <NewCategoryForm />
    </RequireAuth>
  );
}
