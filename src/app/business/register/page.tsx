'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Notice } from '@/components/Notice';
import { describeError } from '@/lib/api';
import { cateringService, categoryService } from '@/lib/services';
import type { Category } from '@/lib/types';
import './register.css';

const plans = [
  { value: 'Growth', price: 'R399 / month', capacity: 'Up to 100 active products' },
  { value: 'Professional', price: 'R799 / month', capacity: 'Up to 500 active products' },
  { value: 'Business', price: 'R1,499 / month', capacity: 'Up to 2,500 active products' },
  { value: 'Scale', price: 'R2,499 / month', capacity: 'Up to 10,000 active products' },
  { value: 'Enterprise', price: 'Custom pricing', capacity: 'Flexible product capacity' },
] as const;

type FormState = {
  businessName: string;
  registrationNumber: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  requestedCategory: string;
  location: string;
  website: string;
  plan: string;
  payout: 'managed' | 'payfast';
  notes: string;
};

const initialForm: FormState = {
  businessName: '',
  registrationNumber: '',
  ownerName: '',
  email: '',
  phone: '',
  category: '',
  requestedCategory: '',
  location: '',
  website: '',
  plan: 'Professional',
  payout: 'managed',
  notes: '',
};

export default function BusinessRegisterPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoadError, setCategoryLoadError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    categoryService.list()
      .then((items) => { if (active) setCategories(items); })
      .catch(() => { if (active) setCategoryLoadError(true); });
    return () => { active = false; };
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.businessName.trim()) next.businessName = 'Enter your business name.';
    if (!form.ownerName.trim()) next.ownerName = 'Enter the primary contact name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Enter a contact number.';
    if (!form.category.trim()) next.category = 'Select or enter a business category.';
    if (!form.location.trim()) next.location = 'Enter your town or city and province.';
    if (form.category === 'Request a new category' && !form.requestedCategory.trim()) {
      next.requestedCategory = 'Tell us which category you would like us to add.';
    }
    return next;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const selectedPlan = plans.find((plan) => plan.value === form.plan);
    const message = [
      'NEW BUSINESS PARTNERSHIP APPLICATION',
      '',
      `Business name: ${form.businessName.trim()}`,
      `Company registration number: ${form.registrationNumber.trim() || 'Not provided'}`,
      `Primary contact: ${form.ownerName.trim()}`,
      `Email: ${form.email.trim().toLowerCase()}`,
      `Phone: ${form.phone.trim()}`,
      `Business category: ${form.category === 'Request a new category' ? form.requestedCategory.trim() + ' (new category requested)' : form.category}`,
      `Location: ${form.location.trim()}`,
      `Website / social link: ${form.website.trim() || 'Not provided'}`,
      `Selected plan: ${form.plan} — ${selectedPlan?.price ?? ''} (${selectedPlan?.capacity ?? ''})`,
      `Settlement preference: ${form.payout === 'managed' ? 'Nhlanganiso-managed withdrawals (4.5% of gross withdrawal)' : 'Own PayFast merchant account (0% Nhlanganiso withdrawal fee; PayFast charges may apply)'}`,
      '',
      'Additional information:',
      form.notes.trim() || 'None',
    ].join('\n');

    setSubmitting(true);
    try {
      await cateringService.createRequest({
        event_type: 'Business partnership application',
        contact_name: form.ownerName.trim(),
        contact_email: form.email.trim().toLowerCase(),
        contact_phone: form.phone.trim(),
        menu_requirements: message,
      });
      setSubmitted(true);
    } catch (error) {
      setServerError(describeError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="business-register">
        <section className="business-register__success">
          <div className="business-register__success-mark" aria-hidden="true">✓</div>
          <p className="business-register__eyebrow">APPLICATION RECEIVED</p>
          <h1>Thank you for choosing to grow with us.</h1>
          <p>
            Your business partnership application has been sent to the Nhlanganiso team.
            We’ll review your details and contact you at <strong>{form.email}</strong> about the next steps.
          </p>
          <p className="business-register__notice">
            Your business account is not active yet. Account setup and approval happen after our team reviews your application.
          </p>
          <div className="business-register__success-actions">
            <Link href="/business/pricing" className="business-register__secondary">Review plans</Link>
            <Link href="/" className="business-register__primary">Back to home <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="business-register">
      <section className="business-register__intro">
        <div className="business-register__container">
          <Link href="/business/pricing" className="business-register__back">← Back to business pricing</Link>
          <p className="business-register__eyebrow">BECOME A NHLANGANISO PARTNER</p>
          <h1>Let’s put your <span>business on the map.</span></h1>
          <p className="business-register__lead">
            Tell us about your business, choose a plan and select how you’d like to receive your sales.
            Our team will review your application and guide you through onboarding.
          </p>
          <div className="business-register__steps" aria-label="Application steps">
            <span><b>01</b> Business details</span>
            <i />
            <span><b>02</b> Choose your setup</span>
            <i />
            <span><b>03</b> Team review</span>
          </div>
        </div>
      </section>

      <section className="business-register__body">
        <div className="business-register__container business-register__layout">
          <form className="business-register__form" onSubmit={onSubmit} noValidate>
            <div className="business-register__form-heading">
              <p className="business-register__eyebrow">PARTNER APPLICATION</p>
              <h2>Business information</h2>
              <p>Fields marked with * are required.</p>
            </div>

            {serverError ? <Notice tone="error">{serverError}</Notice> : null}

            <div className="business-register__fields">
              <label className="business-register__field business-register__field--wide">
                <span>Business / trading name *</span>
                <input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="e.g. The Daily Loaf Bakery" autoComplete="organization" aria-invalid={!!errors.businessName} />
                {errors.businessName ? <small>{errors.businessName}</small> : null}
              </label>
              <label className="business-register__field">
                <span>Company registration number <em>Optional</em></span>
                <input value={form.registrationNumber} onChange={(e) => update('registrationNumber', e.target.value)} placeholder="e.g. 2024/123456/07" />
              </label>
              <label className="business-register__field">
                <span>Primary contact full name *</span>
                <input value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} placeholder="Your full name" autoComplete="name" aria-invalid={!!errors.ownerName} />
                {errors.ownerName ? <small>{errors.ownerName}</small> : null}
              </label>
              <label className="business-register__field">
                <span>Business email *</span>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@yourbusiness.co.za" autoComplete="email" aria-invalid={!!errors.email} />
                {errors.email ? <small>{errors.email}</small> : null}
              </label>
              <label className="business-register__field">
                <span>Contact number *</span>
                <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+27 00 000 0000" autoComplete="tel" aria-invalid={!!errors.phone} />
                {errors.phone ? <small>{errors.phone}</small> : null}
              </label>
              <label className="business-register__field">
                <span>Business category *</span>
                <select value={form.category} onChange={(e) => update('category', e.target.value)} aria-invalid={!!errors.category}>
                  <option value="">Choose an available category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                  <option value="Request a new category">Request a new category</option>
                </select>
                {categoryLoadError ? <small>We couldn’t load the category list. You can still request a new category below.</small> : null}
                {errors.category ? <small>{errors.category}</small> : null}
              </label>
              {form.category === 'Request a new category' ? (
                <label className="business-register__field">
                  <span>Category you want us to add *</span>
                  <input value={form.requestedCategory} onChange={(e) => update('requestedCategory', e.target.value)} placeholder="Describe your category" aria-invalid={!!errors.requestedCategory} />
                  {errors.requestedCategory ? <small>{errors.requestedCategory}</small> : null}
                </label>
              ) : null}
              <label className="business-register__field">
                <span>Town / city and province *</span>
                <input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Emalahleni, Mpumalanga" aria-invalid={!!errors.location} />
                {errors.location ? <small>{errors.location}</small> : null}
              </label>
              <label className="business-register__field business-register__field--wide">
                <span>Website or social media page <em>Optional</em></span>
                <input type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https:// or your social profile link" />
              </label>
            </div>

            <div className="business-register__section">
              <p className="business-register__eyebrow">YOUR SUBSCRIPTION</p>
              <h2>Choose a business plan</h2>
              <p className="business-register__section-copy">You can discuss a different plan with our team before activation.</p>
              <div className="business-register__plan-list">
                {plans.map((plan) => (
                  <label className={`business-register__plan${form.plan === plan.value ? ' is-selected' : ''}`} key={plan.value}>
                    <input type="radio" name="plan" value={plan.value} checked={form.plan === plan.value} onChange={() => update('plan', plan.value)} />
                    <span className="business-register__radio" aria-hidden="true" />
                    <span className="business-register__plan-main"><strong>{plan.value}</strong><small>{plan.capacity}</small></span>
                    <b className="business-register__plan-price">{plan.price}</b>
                  </label>
                ))}
              </div>
            </div>

            <div className="business-register__section">
              <p className="business-register__eyebrow">PAYMENT SETTLEMENT</p>
              <h2>How would you like to get paid?</h2>
              <div className="business-register__payout-options">
                <label className={`business-register__payout${form.payout === 'managed' ? ' is-selected' : ''}`}>
                  <input type="radio" name="payout" checked={form.payout === 'managed'} onChange={() => update('payout', 'managed')} />
                  <span className="business-register__radio" aria-hidden="true" />
                  <span><strong>Nhlanganiso-managed withdrawals</strong><small>4.5% fee on the gross withdrawal amount.</small></span>
                </label>
                <label className={`business-register__payout${form.payout === 'payfast' ? ' is-selected' : ''}`}>
                  <input type="radio" name="payout" checked={form.payout === 'payfast'} onChange={() => update('payout', 'payfast')} />
                  <span className="business-register__radio" aria-hidden="true" />
                  <span><strong>My own PayFast merchant account</strong><small>0% Nhlanganiso withdrawal fee. PayFast fees may still apply.</small></span>
                </label>
              </div>
              <p className="business-register__security-note">
                Don’t enter PayFast passwords, secret keys or banking credentials here. We’ll guide you through a secure connection after approval.
              </p>
            </div>

            <div className="business-register__section">
              <label className="business-register__field">
                <span>Anything else we should know? <em>Optional</em></span>
                <textarea rows={4} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Tell us about your products, delivery area or what you need from the platform." />
              </label>
            </div>

            <div className="business-register__submit-area">
              <p>Submitting this form sends an application for review. It does not immediately create or activate a business account.</p>
              <button type="submit" className="business-register__primary" disabled={submitting}>
                {submitting ? 'Sending application…' : 'Submit business application'} <span aria-hidden="true">→</span>
              </button>
              <small>By submitting, you agree that Nhlanganiso may contact you about this application.</small>
            </div>
          </form>

          <aside className="business-register__aside">
            <div className="business-register__aside-card">
              <p className="business-register__eyebrow">WHAT HAPPENS NEXT</p>
              <h3>A real person reviews your application.</h3>
              <ol>
                <li><b>01</b><span><strong>We review your details</strong><small>Our team checks your business information and category request.</small></span></li>
                <li><b>02</b><span><strong>We confirm your plan</strong><small>We’ll contact you if anything needs clarification.</small></span></li>
                <li><b>03</b><span><strong>We help you get set up</strong><small>Account access, catalogue setup and payment connection follow approval.</small></span></li>
              </ol>
              <Link href="/business/pricing" className="business-register__aside-link">Compare all plans <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="business-register__aside-note">
              <span aria-hidden="true">✦</span>
              <p><strong>Customers pay R0 Nhlanganiso platform fee.</strong> Your plan subscription and any payment-provider or withdrawal charges are separate.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
