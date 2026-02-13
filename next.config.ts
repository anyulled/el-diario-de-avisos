import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Config options here */
};

export default withSentryConfig(nextConfig, {
  silent: false,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});

