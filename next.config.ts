import type { NextConfig } from "next";

/** Separate Vercel project that owns the Social Media dashboard UI/API. */
const SOCIAL_MEDIA_ORIGIN =
  process.env.SOCIAL_MEDIA_ORIGIN?.replace(/\/+$/, "") ||
  "https://social-media-dashboard-seven-omega.vercel.app";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/staff/social-media-responses",
        destination: `${SOCIAL_MEDIA_ORIGIN}/staff/social-media-responses`,
      },
      {
        source: "/staff/social-media-responses/:path*",
        destination: `${SOCIAL_MEDIA_ORIGIN}/staff/social-media-responses/:path*`,
      },
      {
        source: "/api/social-media",
        destination: `${SOCIAL_MEDIA_ORIGIN}/api/social-media`,
      },
      {
        source: "/api/social-media/:path*",
        destination: `${SOCIAL_MEDIA_ORIGIN}/api/social-media/:path*`,
      },
    ];
  },
};

export default nextConfig;
