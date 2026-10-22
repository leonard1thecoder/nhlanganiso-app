import type { Metadata } from 'next';
import CateringPage from '@/app/catering/page';

export const metadata: Metadata = {
  title: 'Contact & Catering Enquiries',
  description: 'Contact Nhlanganiso Catering & Baking about a celebration cake or catering for your event.',
};

export default function ContactPage() {
  return <CateringPage />;
}
