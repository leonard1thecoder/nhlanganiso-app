'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { CONTACT, HAS_REAL_CONTACT_EMAIL, HAS_REAL_CONTACT_PHONE } from '@/lib/config';
import { cateringService } from '@/lib/services';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: FormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CateringPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Please enter your name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.subject.trim()) e.subject = 'Please enter a subject.';
    if (!form.message.trim()) e.message = 'Please enter your message.';
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      // Contact form submits to the same catering request endpoint; subject maps to
      // event_type and message to menu_requirements so nothing is lost.
      const res = await cateringService.createRequest({
        event_type: form.subject.trim(),
        menu_requirements: form.message.trim(),
        contact_name: form.name.trim(),
        contact_email: form.email.trim().toLowerCase(),
        contact_phone: undefined,
      });
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      setServerError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <section className="container section center">
        <p className="eyebrow">Message received</p>
        <h1>Thank you — we are on it</h1>
        <p className="muted">
          We have received your message and will reply to {form.email} as soon as possible.
        </p>
        <p className="small">
          Reference: <code>{form.subject || 'Contact'}</code>
        </p>
        <Link href="/products" className="btn btn-outline">Browse the shop</Link>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="catering-layout">
        <div>
          <p className="eyebrow">Contact us</p>
          <h1>Get in touch</h1>
          <p className="lead">
            Have a question about our bakes, catering, or an order? Send us a message and we will get back to you.
          </p>
          {HAS_REAL_CONTACT_EMAIL || HAS_REAL_CONTACT_PHONE ? (
            <p className="muted small">
              Prefer to talk?{' '}
              {HAS_REAL_CONTACT_PHONE ? (
                <>Call <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a></>
              ) : null}
              {HAS_REAL_CONTACT_PHONE && HAS_REAL_CONTACT_EMAIL ? ' or ' : null}
              {HAS_REAL_CONTACT_EMAIL ? (
                <>email <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></>
              ) : null}
              .
            </p>
          ) : null}
        </div>

        <div className="card">
          {serverError ? <Notice tone="error" title="Could not send your message">{serverError}</Notice> : null}

          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <Field id="contact_name" label="Name" required error={errors.name}>
                <TextInput
                  id="contact_name"
                  autoComplete="name"
                  value={form.name}
                  onChange={set('name')}
                  aria-invalid={!!errors.name}
                />
              </Field>
              <Field id="contact_email" label="Email" required error={errors.email}>
                <TextInput
                  id="contact_email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  aria-invalid={!!errors.email}
                />
              </Field>
            </div>

            <Field id="contact_subject" label="Subject" required error={errors.subject}>
              <TextInput
                id="contact_subject"
                autoComplete="off"
                value={form.subject}
                onChange={set('subject')}
                aria-invalid={!!errors.subject}
              />
            </Field>

            <Field id="contact_message" label="Message" required error={errors.message}>
              <TextArea
                id="contact_message"
                value={form.message}
                onChange={set('message')}
                aria-invalid={!!errors.message}
              />
            </Field>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
