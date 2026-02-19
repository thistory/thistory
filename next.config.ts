import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "web-push"],

  productionBrowserSourceMaps: false,

  logging: {
    fetches: {
      fullUrl: !isProd,
    },
  },

  images: {
    remotePatterns: [],
    unoptimized: !isProd,
  },

  // Security headers — production only
  async headers() {
    if (!isProd) return [];
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  poweredByHeader: !isProd,
};

export default withNextIntl(nextConfig);
