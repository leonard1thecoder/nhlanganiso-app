import type { Metadata } from 'next';
import { ProductCatalog } from '@/components/ProductCatalog';

export const metadata: Metadata = {
  title: 'Bakery',
  description: 'Browse celebration cakes and other cakes available from Nhlanganiso Catering & Baking.',
};

export default function BakeryPage() {
  return <ProductCatalog mode="cakes" />;
}
