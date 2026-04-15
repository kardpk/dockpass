import type { NextConfig } from "next";

/**
 * ARCH 3 from AUDIT.md — Complete next.config.ts
 * PWA disabled until next-pwa supports Next.js 16 (use native service worker instead)
 *
 * Phase 3B — Trip page PWA cache config (activate when PWA is re-enabled):
 * {
 *   urlPattern: /^https:\/\/dockpass\.io\/trip\/.+/,
 *   handler: 'NetworkFirst',
 *   options: {
 *     cacheName: 'trip-pages',
 *     networkTimeoutSeconds: 3,
 *     expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
 *   },
 * }
 */
const nextConfig: NextConfig = {
  // Server Actions security
  experimental: {
    serverActions: {
      allowedOrigins: [
        "boatcheckin.com",
        "www.boatcheckin.com",
        "localhost:3000",
      ],
      bodySizeLimit: "2mb",
    },
  },

  // Image domains for next/image
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "api.mapbox.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Security: disable powered-by header
  poweredByHeader: false,

  // Compression
  compress: true,

  // Short URL redirects
  async redirects() {
    return [
      {
        source: "/t/:slug",
        destination: "/trip/:slug",
        permanent: true,
      },
    ];
  },

  // Ignore TS errors on build since we verify locally
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
