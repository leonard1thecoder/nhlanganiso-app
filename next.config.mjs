/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The storefront talks to the Rust API directly from the browser (see src/lib/api.ts),
  // so no rewrites/proxy are needed here. CORS is configured on the API via CORS_ALLOWED_ORIGINS.
  images: {
    remotePatterns: [
      // Product images are optional; allow any https host the API returns as image_url.
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
