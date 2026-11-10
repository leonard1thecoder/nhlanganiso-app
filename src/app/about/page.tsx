import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'Meet Nhlanganiso Catering & Baking and explore the bakery, celebration cakes and catering services.',
};

const GALLERY_PHOTOS = [
  {
    src: '/brand/gallery/cupcakes-cooling.jpg',
    alt: 'Chocolate cupcakes cooling on a wire rack',
  },
  {
    src: '/brand/gallery/cupcakes-frosted.jpg',
    alt: 'Chocolate cupcake topped with caramel swirl frosting and gold pearls',
  },
];

// The strip repeats the photos so it always fills wide screens. The second copy
// of the run is hidden from assistive tech so the images aren't announced twice.
const GALLERY_RUN = Array.from({ length: 5 }, () => GALLERY_PHOTOS).flat();

function GalleryRun({ hidden }: { hidden: boolean }) {
  return (
    <ul className="gallery__set" aria-hidden={hidden || undefined}>
      {GALLERY_RUN.map((photo, i) => {
        const isFirstCopy = i < GALLERY_PHOTOS.length;
        return (
          <li key={`${hidden ? 'b' : 'a'}-${i}`}>
            <Image
              src={photo.src}
              alt={!hidden && isFirstCopy ? photo.alt : ''}
              width={960}
              height={1280}
              sizes="(max-width: 960px) 200px, 300px"
            />
          </li>
        );
      })}
    </ul>
  );
}

export default function AboutPage() {
  return (
    <section className="container section">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / Our Story</nav>
      <header className="page-head">
        <div>
          <p className="eyebrow"><span className="rule" aria-hidden="true" />About the bakery</p>
          <h1>{SITE_NAME}</h1>
          <p className="lead">Baked goods, celebration cakes and catering for moments worth sharing.</p>
        </div>
      </header>
      <section className="owner-story" aria-labelledby="owner-heading">
        <figure className="owner-story__photo">
          <Image
            src="/brand/owner-director.jpg"
            alt="The owner and director of Nhlanganiso Catering & Baking"
            width={1080}
            height={1440}
            sizes="(max-width: 960px) 100vw, 40vw"
          />
        </figure>
        <div className="card owner-story__body">
          <p className="eyebrow"><span className="rule" aria-hidden="true" />About the owner</p>
          <h2 id="owner-heading" className="card__title">Owner &amp; Director</h2>
          <p>Our owner and director leads the bakery and its catering services, from everyday baked goods to celebration cakes for the moments that matter.</p>
        </div>
      </section>
      <section className="gallery" aria-labelledby="gallery-heading">
        <div className="section__head">
          <h2 id="gallery-heading">Gallery</h2>
        </div>
        <div className="gallery__viewport">
          <div className="gallery__track">
            <GalleryRun hidden={false} />
            <GalleryRun hidden />
          </div>
        </div>
      </section>
      <div className="two-col">
        <article className="card">
          <h2 className="card__title">A bakery for everyday and special occasions</h2>
          <p>Explore the Nhlanganiso bakery for baked goods, or get in touch about a celebration cake or catering for your event.</p>
          <p>Use the shop to browse current products and prices. For a tailored event menu, send an enquiry with your date, guest numbers and requirements.</p>
          <div className="cta-row">
            <Link href="/products" className="btn btn-primary">Browse baked goods</Link>
            <Link href="/contact" className="btn btn-outline">Enquire about catering</Link>
          </div>
        </article>
        <aside className="card">
          <h2 className="card__title">How to order</h2>
          <ol>
            <li>Browse available products and add your selection to the cart.</li>
            <li>Review your cart and continue to checkout.</li>
            <li>For catering, share your event details through the enquiry form.</li>
          </ol>
        </aside>
      </div>
    </section>
  );
}
