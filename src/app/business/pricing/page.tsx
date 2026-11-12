import type { Metadata } from 'next';
import Link from 'next/link';
import './pricing.css';

export const metadata: Metadata = {
  title: 'Business pricing',
  description:
    'Choose a Nhlanganiso business plan that fits your product catalogue. Transparent monthly pricing for growing South African food businesses.',
};

const plans = [
  {
    name: 'Growth',
    price: '399',
    products: '100',
    description: 'A focused start for small bakeries and food businesses.',
    featured: false,
  },
  {
    name: 'Professional',
    price: '799',
    products: '500',
    description: 'More room for a growing range of products.',
    featured: true,
  },
  {
    name: 'Business',
    price: '1,499',
    products: '2,500',
    description: 'Built for established businesses with bigger catalogues.',
    featured: false,
  },
  {
    name: 'Scale',
    price: '2,499',
    products: '10,000',
    description: 'High-capacity product listings for ambitious teams.',
    featured: false,
  },
] as const;

const included = [
  'Business product catalogue',
  'Product capacity based on your plan',
  'A place in the Nhlanganiso marketplace',
];

export default function BusinessPricingPage() {
  return (
    <div className="business-pricing">
      <section className="business-pricing__hero">
        <div className="business-pricing__container">
          <div className="business-pricing__eyebrow">
            <span aria-hidden="true" />
            PARTNER WITH NHLANGANISO
          </div>
          <h1>
            Your business deserves
            <br />
            <span>more room to grow.</span>
          </h1>
          <p className="business-pricing__intro">
            Put your products in front of more customers. Choose a plan that
            matches the size of your catalogue, with clear monthly pricing and
            no platform fee for your customers.
          </p>
          <div className="business-pricing__hero-note">
            <span className="business-pricing__check" aria-hidden="true">✓</span>
            Straightforward monthly plans. No confusing percentage-based customer fees.
          </div>
          <a className="business-pricing__scroll" href="#plans">
            Explore plans <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="business-pricing__orb business-pricing__orb--one" aria-hidden="true" />
        <div className="business-pricing__orb business-pricing__orb--two" aria-hidden="true" />
      </section>

      <section className="business-pricing__plans" id="plans">
        <div className="business-pricing__container">
          <div className="business-pricing__section-heading">
            <p className="business-pricing__eyebrow">SIMPLE, TRANSPARENT PRICING</p>
            <h2>Choose your growth plan</h2>
            <p>Every plan is billed monthly and is based on the number of active products you can list.</p>
          </div>

          <div className="business-pricing__grid">
            {plans.map((plan) => (
              <article
                className={`business-plan-card${plan.featured ? ' business-plan-card--featured' : ''}`}
                key={plan.name}
              >
                {plan.featured ? <div className="business-plan-card__ribbon">A great fit for growing teams</div> : null}
                <div className="business-plan-card__top">
                  <p className="business-plan-card__name">{plan.name}</p>
                  <p className="business-plan-card__description">{plan.description}</p>
                </div>
                <div className="business-plan-card__price">
                  <span className="business-plan-card__currency">R</span>
                  <strong>{plan.price}</strong>
                  <span className="business-plan-card__period">/ month</span>
                </div>
                <div className="business-plan-card__capacity">
                  <span className="business-plan-card__capacity-icon" aria-hidden="true">▦</span>
                  <span><strong>{plan.products}</strong> active products</span>
                </div>
                <div className="business-plan-card__divider" />
                <p className="business-plan-card__included-label">PLAN HIGHLIGHTS</p>
                <ul className="business-plan-card__features">
                  {included.map((item) => (
                    <li key={item}><span aria-hidden="true">✓</span>{item}</li>
                  ))}
                </ul>
                <Link
                  className={`business-plan-card__cta${plan.featured ? ' business-plan-card__cta--featured' : ''}`}
                  href="/business/register"
                >
                  Become a partner <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}

            <article className="business-plan-card business-plan-card--enterprise">
              <div className="business-plan-card__top">
                <p className="business-plan-card__name">Enterprise</p>
                <p className="business-plan-card__description">
                  Need more capacity or a tailored arrangement? Let’s build the right fit.
                </p>
              </div>
              <div className="business-plan-card__price business-plan-card__price--custom">
                <strong>Custom</strong>
              </div>
              <div className="business-plan-card__capacity">
                <span className="business-plan-card__capacity-icon" aria-hidden="true">✦</span>
                <span><strong>Flexible</strong> product capacity</span>
              </div>
              <div className="business-plan-card__divider" />
              <p className="business-plan-card__included-label">LET’S DISCUSS</p>
              <ul className="business-plan-card__features">
                <li><span aria-hidden="true">✓</span>Custom catalogue requirements</li>
                <li><span aria-hidden="true">✓</span>Tailored business arrangements</li>
                <li><span aria-hidden="true">✓</span>Speak with our team</li>
              </ul>
              <Link className="business-plan-card__cta" href="/contact">
                Contact our team <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
          <p className="business-pricing__fine-print">
            Prices are in South African rand (ZAR). Product capacity refers to active listings.
            Your plan and entitlements are confirmed by the Nhlanganiso platform.
          </p>
        </div>
      </section>

      <section className="business-pricing__settlement">
        <div className="business-pricing__container">
          <div className="business-pricing__settlement-heading">
            <p className="business-pricing__eyebrow">PAYMENTS & SETTLEMENTS</p>
            <h2>Choose how your business gets paid.</h2>
            <p>Your subscription is separate from payment-provider charges and settlement fees.</p>
          </div>
          <div className="business-pricing__settlement-grid">
            <article className="settlement-card">
              <div className="settlement-card__icon" aria-hidden="true">↗</div>
              <p className="settlement-card__label">OPTION 01</p>
              <h3>Nhlanganiso-managed withdrawals</h3>
              <p className="settlement-card__rate"><strong>4.5%</strong><span>of the gross withdrawal amount</span></p>
              <p className="settlement-card__copy">
                When you use the Nhlanganiso-managed withdrawal option, a 4.5% banking and
                withdrawal fee applies to the amount requested.
              </p>
            </article>
            <article className="settlement-card settlement-card--gold">
              <div className="settlement-card__icon" aria-hidden="true">⌁</div>
              <p className="settlement-card__label">OPTION 02</p>
              <h3>Use your own PayFast merchant account</h3>
              <p className="settlement-card__rate"><strong>0%</strong><span>Nhlanganiso withdrawal fee</span></p>
              <p className="settlement-card__copy">
                Connect your own PayFast merchant account and receive settlements through
                PayFast. PayFast’s own processing, refund or payout charges may still apply.
              </p>
            </article>
          </div>
          <div className="business-pricing__fee-note">
            <span className="business-pricing__fee-note-icon" aria-hidden="true">✓</span>
            <p><strong>Customers pay R0 Nhlanganiso platform fee.</strong> Payment-provider charges and business settlement fees are separate and are not added as a default customer surcharge.</p>
          </div>
        </div>
      </section>

      <section className="business-pricing__cta-section">
        <div className="business-pricing__container">
          <p className="business-pricing__eyebrow">READY TO GET STARTED?</p>
          <h2>Let’s get your business out there.</h2>
          <p>Tell us about your bakery or food business and our team will help you take the next step.</p>
          <Link className="business-pricing__final-cta" href="/contact">
            Become a bakery partner <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
