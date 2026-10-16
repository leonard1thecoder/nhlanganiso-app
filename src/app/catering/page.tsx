'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Field, Select, TextArea, TextInput } from '@/components/Field';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { CONTACT, HAS_REAL_CONTACT_EMAIL, HAS_REAL_CONTACT_PHONE } from '@/lib/config';
import { randsToCents, todayISO } from '@/lib/format';
import { cateringService } from '@/lib/services';

const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate event', 'Office lunch', 'Funeral or memorial', 'Religious or cultural gathering', 'Other'];

interface FormState {
  event_type: string;
  event_date: string;
  guest_count: string;
  venue: string;
  budget: string;
  menu_requirements: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

const EMPTY: FormState = {
  event_type: EVENT_TYPES[0],
  event_date: '',
  guest_count: '',
  venue: '',
  budget: '',
  menu_requirements: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CateringPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [minDate, setMinDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Set on the client to avoid server/client date mismatches.
  useEffect(() => setMinDate(todayISO()), []);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): Partial<Record<keyof FormState, string>> => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.event_date) e.event_date = 'Choose the event date.';
    else if (minDate && form.event_date < minDate) e.event_date = 'The date cannot be in the past.';
    const guests = Number(form.guest_count);
    if (!Number.isInteger(guests) || guests < 1 || guests > 5000) e.guest_count = 'Enter between 1 and 5,000 guests.';
    if (!form.contact_name.trim()) e.contact_name = 'Please enter your name.';
    if (!EMAIL_RE.test(form.contact_email.trim())) e.contact_email = 'Enter a valid email address.';
    if (form.budget.trim() && randsToCents(form.budget) === undefined) e.budget = 'Enter an amount in Rand, e.g. 5000.';
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
      const res = await cateringService.createRequest({
        event_type: form.event_type,
        event_date: form.event_date,
        guest_count: Number(form.guest_count),
        venue: form.venue.trim() || undefined,
        budget_cents: randsToCents(form.budget),
        menu_requirements: form.menu_requirements.trim() || undefined,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim().toLowerCase(),
        contact_phone: form.contact_phone.trim() || undefined,
      });
      setCreatedId(res.id);
      setForm(EMPTY);
    } catch (err) {
      setServerError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (createdId) {
    return (
      <section className="container section center">
        <p className="eyebrow">Enquiry received</p>
        <h1>Thank you — we are on it</h1>
        <p className="muted">
          We have emailed a confirmation. Our team will review your event and send your quote by email.
        </p>
        <p className="small">
          Reference: <code>{createdId}</code>
        </p>
        <Link href="/products" className="btn btn-outline">Browse the shop</Link>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="catering-layout">
        <div>
          <p className="eyebrow">Catering</p>
          <h1>Plan your event with us</h1>
          <p className="lead">
            Tell us about your event and we will prepare a tailored quote, from bread platters to full dessert tables.
          </p>
          <ul className="check-list">
            <li>Quotes sent by email</li>
            <li>Tailored menus and dietary needs</li>
            <li>Itemised quotes you can review and accept online</li>
          </ul>
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
          {serverError ? <Notice tone="error" title="Could not send your enquiry">{serverError}</Notice> : null}

          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <div className="form-row">
              <Field id="event_type" label="Event type" required>
                <Select id="event_type" value={form.event_type} onChange={set('event_type')}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field id="event_date" label="Event date" required error={errors.event_date}>
                <TextInput id="event_date" type="date" min={minDate || undefined} value={form.event_date} onChange={set('event_date')} aria-invalid={!!errors.event_date} />
              </Field>
            </div>

            <div className="form-row">
              <Field id="guest_count" label="Number of guests" required error={errors.guest_count}>
                <TextInput id="guest_count" type="number" inputMode="numeric" min={1} max={5000} value={form.guest_count} onChange={set('guest_count')} aria-invalid={!!errors.guest_count} />
              </Field>
              <Field id="budget" label="Budget (optional, ZAR)" error={errors.budget} hint="Helps us suggest the right menu.">
                <TextInput id="budget" inputMode="decimal" placeholder="e.g. 8 000" value={form.budget} onChange={set('budget')} aria-invalid={!!errors.budget} />
              </Field>
            </div>

            <Field id="venue" label="Venue or delivery area (optional)">
              <TextInput id="venue" value={form.venue} onChange={set('venue')} />
            </Field>

            <Field id="menu_requirements" label="Menu requirements (optional)" hint="Dietary needs, favourites, colours, etc.">
              <TextArea id="menu_requirements" value={form.menu_requirements} onChange={set('menu_requirements')} />
            </Field>

            <h2 className="form-section-title">Your details</h2>
            <div className="form-row">
              <Field id="contact_name" label="Name" required error={errors.contact_name}>
                <TextInput id="contact_name" autoComplete="name" value={form.contact_name} onChange={set('contact_name')} />
              </Field>
              <Field id="contact_email" label="Email" required error={errors.contact_email}>
                <TextInput id="contact_email" type="email" autoComplete="email" value={form.contact_email} onChange={set('contact_email')} />
              </Field>
            </div>
            <Field id="contact_phone" label="Phone (optional)">
              <TextInput id="contact_phone" type="tel" autoComplete="tel" value={form.contact_phone} onChange={set('contact_phone')} />
            </Field>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? 'Sending…' : 'Request my quote'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
