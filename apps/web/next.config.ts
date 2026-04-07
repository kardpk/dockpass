import type { NextConfig } from "next";

/**
 * ARCH 3 from AUDIT.md — Complete next.config.ts
 * PWA disabled until next-pwa supports Next.js 16 (use native service worker instead)
 */
const nextConfig: NextConfig = {
  // Server Actions security
  experimental: {
    serverActions: {
      allowedOrigins: [
        "dockpass.io",
        "www.dockpass.io",
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
};

export default nextConfig;
