/** @type {import('next').NextConfig} */
const upstream = (
  process.env.API_UPSTREAM ??
  process.env.NEXT_PUBLIC_API_URL ??
  'https://fluffy-octo-computing-machine-byij.vercel.app'
).replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/catering', destination: '/contact', permanent: true },
      // Keep old newsletter links (including confirmation links with ?token=) working.
      { source: '/newsletter', destination: '/recipes', permanent: true },
    ];
  },
  // Same-origin proxy for the API so the browser never hits CORS:
  // the app calls /api/v1/* on its own origin, Next rewrites it to the Rust API.
  // Production has a safe default; API_UPSTREAM can override it per environment.
  // Local development uses API_UPSTREAM=http://localhost:8080 from .env.local.
  async rewrites() {
    if (!upstream) return [];
    return [{ source: '/api/v1/:path*', destination: `${upstream}/api/v1/:path*` }];
  },
  images: {
    remotePatterns: [
      // Product images are optional; allow any https host the API returns as image_url.
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
