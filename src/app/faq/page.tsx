import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers about ordering, payment, bakery collection, custom cakes, and subscriber coupons.',
};

const questions = [
  {
    question: 'How do I place an order?',
    answer: 'Browse the bakery, add the items you want to your shopping bag, then continue to checkout. You can add collection timing, allergy information, or cake inscription notes in the optional order notes.',
  },
  {
    question: 'How do I pay for my order?',
    answer: 'Checkout redirects you to PayFast for payment by the available secure payment methods. Your order total is checked by the server before payment is processed.',
  },
  {
    question: 'How do I collect my order?',
    answer: 'Orders are prepared fresh for bakery collection. Add your preferred collection timing at checkout. If you provide a phone number, it can be used for an SMS or WhatsApp update when your order is ready.',
  },
  {
    question: 'Can I request a custom cake or catering?',
    answer: 'Yes. Add cake inscription or special instructions to your order notes, or contact us with details about a custom cake or event so we can discuss your request.',
  },
  {
    question: 'How do subscriber discount coupons work?',
    answer: 'Join the bakery newsletter and confirm your email address to receive subscriber offers. Enter your coupon code and the verified subscriber email in your shopping bag to apply an eligible discount.',
  },
  {
    question: 'Where can I share allergy or dietary information?',
    answer: 'Use the optional order notes at checkout to tell us about allergies or dietary requirements. For advice before ordering, please contact us directly.',
  },
];

export default function FaqPage() {
  return (
    <section className="container section faq-page-section">
      <header className="faq-hero">
        <p className="eyebrow"><span className="rule" aria-hidden="true" />Here to help</p>
        <h1>Frequently Asked Questions</h1>
        <p className="muted">Quick answers about ordering fresh bakes, collection, payments, and subscriber offers.</p>
      </header>

      <div className="faq-list">
        {questions.map(({ question, answer }) => (
          <details className="faq-item" key={question}>
            <summary>{question}<span className="faq-item__toggle" aria-hidden="true" /></summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>

      <aside className="faq-contact-card">
        <div>
          <h2>Still have a question?</h2>
          <p className="muted">Send us the details and we&apos;ll help you plan your next order.</p>
        </div>
        <Link href="/contact" className="btn btn-primary">Contact the bakery</Link>
      </aside>
    </section>
  );
}
