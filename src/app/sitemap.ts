import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/products', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/catering', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
