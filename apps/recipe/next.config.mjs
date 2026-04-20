import {
  DEFAULT_CSP_DIRECTIVES,
  getSecurityHeaders,
} from "@howardism/security-headers";
import nextBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Recipe serves Cloudinary-hosted images and talks to a CMS over https via
// axios; default CSP covers both via `https:` in img-src / connect-src.
const securityHeaders = getSecurityHeaders({
  geolocation: "()",
  contentSecurityPolicy: DEFAULT_CSP_DIRECTIVES,
});

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [{ hostname: "res.cloudinary.com" }],
  },
  transpilePackages: [
    "@howardism/components-common",
    "@howardism/login-form",
    "@howardism/ui",
  ],
};

export default withBundleAnalyzer(config);
