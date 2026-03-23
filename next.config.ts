import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "careo-sigma.vercel.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "careo",
  project: "careo-nextjs",
  silent: true, // CI/CDでのログを抑制
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
