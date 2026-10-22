import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FooterGate } from '@/components/FooterGate';
import { Navbar } from '@/components/Navbar';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { Providers } from '@/components/Providers';
import { SITE_NAME, SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: '%s · Nhlanganiso',
  },
  description: 'Shop baked goods and celebration cakes from Nhlanganiso Catering & Baking, or enquire about catering for your event in South Africa.',
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: 'Baked goods, celebration cakes and catering for special moments.',
    url: SITE_URL,
  },
  icons: { icon: '/brand/mark.png' },
};

export const viewport: Viewport = {
  themeColor: '#FFFFFF',
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
          <AnnouncementBanner />
          <Navbar />
          <main id="main" className="site-main">
            {children}
          </main>
          <FooterGate />
        </Providers>
      </body>
    </html>
  );
}
