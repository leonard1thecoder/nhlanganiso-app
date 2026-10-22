import type { Metadata } from 'next';
import { ProductCatalog } from '@/components/ProductCatalog';

export const metadata: Metadata = {
  title: 'Cakes',
  description: 'Browse celebration cakes and other cakes available from Nhlanganiso Catering & Baking.',
};

export default function CakesPage() {
  return <ProductCatalog mode="cakes" />;
}
