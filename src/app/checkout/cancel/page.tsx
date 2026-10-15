import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <section className="container section center">
      <p className="eyebrow">Payment cancelled</p>
      <h1>No worries — nothing was charged</h1>
      <p className="muted">
        Your cart is still saved. You can review it and complete your payment whenever you are ready.
      </p>
      <div className="cta-row">
        <Link href="/cart" className="btn btn-primary">Back to cart</Link>
        <Link href="/products" className="btn btn-outline">Keep shopping</Link>
      </div>
    </section>
  );
}
