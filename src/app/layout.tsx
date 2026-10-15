import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { Providers } from '@/components/Providers';
import { SITE_NAME, SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: '%s · Nhlanganiso',
  },
  description: 'Freshly baked bread, pastries and catering for weddings, corporate events and celebrations.',
  icons: { icon: '/brand/mark.png' },
};

export const viewport: Viewport = {
  themeColor: '#5b2a17',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA">
      <body>
        <Providers>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="site-main">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
