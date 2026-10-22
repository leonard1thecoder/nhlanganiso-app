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
    if (!form.subject.trim()) e.subject = 'Please specify the event type or subject.';
    if (!form.message.trim()) e.message = 'Please describe your catering requirements (guest count, menu ideas, date).';
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
      await cateringService.createRequest({
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
      <section className="container section center catering-success-section">
        <div className="empty-cart-icon">🥂</div>
        <p className="eyebrow"><span className="rule" aria-hidden="true" />Enquiry Received</p>
        <h1 className="success-heading">Thanks for getting in touch</h1>
        <p className="muted success-desc">
          Your enquiry has been received. We&apos;ll review your message and follow up using the email address you provided.
        </p>
        <div className="cta-row center">
          <button type="button" className="btn btn-outline" onClick={() => setSent(false)}>
            Send Another Enquiry
          </button>
          <Link href="/products" className="btn btn-primary">
            Browse the bakery
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section catering-page-section">
      <div className="catering-hero-card">
        <div className="catering-hero-content">
          <p className="eyebrow"><span className="rule" aria-hidden="true" />Contact Nhlanganiso</p>
          <h1 className="catering-title">Let&apos;s plan something worth sharing</h1>
          <p className="catering-lead">
            Ask us about celebration cakes, catering for your event, or anything else we can help with. Share a few details and we&apos;ll get back to you.
          </p>
        </div>
      </div>

      <div className="catering-grid">
        <div className="catering-form-wrap">
          <form className="catering-form card" onSubmit={onSubmit} noValidate>
            <div className="form-head">
              <h2>Send us a message</h2>
              <p className="muted small">For event enquiries, include your date, guest numbers and any menu ideas.</p>
            </div>

            {serverError && <Notice tone="error">{serverError}</Notice>}

            <div className="field-grid-2">
              <Field id="cat-name" label="Your Name" required error={errors.name}>
                <TextInput
                  id="cat-name"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Lerato Dlamini"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>

              <Field id="cat-email" label="Email Address" required error={errors.email}>
                <TextInput
                  id="cat-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="lerato@domain.co.za"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
            </div>

            <Field
              id="cat-subject"
              label="Subject or event type"
              required
              hint="e.g. Wedding banquet, 50th Birthday dessert bar, Corporate breakfast platter"
              error={errors.subject}
            >
              <TextInput
                id="cat-subject"
                value={form.subject}
                onChange={set('subject')}
                placeholder="e.g. Wedding Reception Cake &amp; Dessert Table"
                aria-invalid={Boolean(errors.subject)}
              />
            </Field>

            <Field
              id="cat-message"
              label="Your message"
              required
              hint="Include estimated guest count, target date, dietary requests, or specific treats you love."
              error={errors.message}
            >
              <TextArea
                id="cat-message"
                value={form.message}
                onChange={set('message')}
                rows={5}
                placeholder="Please describe: 1) Approximate number of guests; 2) Date of event; 3) Sweet vs savoury preferences; 4) Any special dietary notes."
                aria-invalid={Boolean(errors.message)}
              />
            </Field>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={submitting}
            >
              {submitting ? 'Sending message…' : 'Send enquiry →'}
            </button>
          </form>
        </div>

        <aside className="catering-info-sidebar">
          <div className="catering-features-card card">
            <h3 className="sidebar-title">How can we help?</h3>
            <ul className="catering-services-list">
              <li>
                <strong>Celebration &amp; Wedding Cakes</strong>
                <p className="muted small">Tiered artisanal cakes custom-decorated to match your celebration theme.</p>
              </li>
              <li>
                <strong>Gourmet Savoury Platters</strong>
                <p className="muted small">Handmade quiches, mini artisan pies, sliders, and sourdough crostini.</p>
              </li>
              <li>
                <strong>Dessert Bars &amp; Sweet Tables</strong>
                <p className="muted small">Mini cupcakes, macarons, chocolate brownies, fruit tarts, and pastries.</p>
              </li>
              <li>
                <strong>Corporate Office Feasts</strong>
                <p className="muted small">Prompt morning pastries, artisan sandwich boxes, and executive lunches.</p>
              </li>
            </ul>

            <div className="catering-contact-direct">
              <h4>Contact details</h4>
              {HAS_REAL_CONTACT_EMAIL && (
                <p className="contact-row">
                  <span>Email:</span> <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </p>
              )}
              {HAS_REAL_CONTACT_PHONE && (
                <p className="contact-row">
                  <span>Phone:</span> <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
                </p>
              )}
              <p className="muted small mt-2">
                All catering quotes include direct consultation to ensure your event menu is perfectly executed.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
