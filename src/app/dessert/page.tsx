import type { Metadata } from 'next';
import { ProductCatalog } from '@/components/ProductCatalog';

export const metadata: Metadata = {
  title: 'Desserts',
  description: 'Browse desserts available from Nhlanganiso Catering & Baking, grouped by live bakery collections.',
};

export default function DessertPage() {
  return <ProductCatalog mode="desserts" />;
}
