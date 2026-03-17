import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "careo",
  project: "careo-nextjs",
  silent: true, // CI/CDでのログを抑制
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
