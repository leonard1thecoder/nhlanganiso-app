import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container section center">
      <p className="eyebrow">Error 404</p>
      <h1>We couldn&apos;t find that page</h1>
      <p className="muted">It may have been moved, or the link might be out of date.</p>
      <div className="cta-row">
        <Link href="/products" className="btn btn-primary">Browse the shop</Link>
        <Link href="/" className="btn btn-outline">Go home</Link>
      </div>
    </section>
  );
}
