/** @type {import('next').NextConfig} */
const upstream = (
  process.env.API_UPSTREAM ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8080'
).replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/catering', destination: '/contact', permanent: true }];
  },
  // Same-origin proxy for the API so the browser never hits CORS:
  // the app calls /api/v1/* on its own origin, Next rewrites it to the
  // Rust API. Set API_UPSTREAM (server-only) or NEXT_PUBLIC_API_URL to the
  // API base (no trailing slash, no /api/v1). Falls back to localhost:8080.
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
