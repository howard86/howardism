import {
  DEFAULT_CSP_DIRECTIVES,
  getSecurityHeaders,
} from "@howardism/security-headers";
import nextBundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = nextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// GitHub Search talks to the GitHub GraphQL API and uses Apollo Client; the
// CSP is widened to allow that single origin for connect-src while keeping
// the default restrictions elsewhere.
const securityHeaders = getSecurityHeaders({
  geolocation: "()",
  contentSecurityPolicy: {
    ...DEFAULT_CSP_DIRECTIVES,
    "connect-src": ["'self'", "https://api.github.com"],
  },
});

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  transpilePackages: ["@howardism/ui", "@howardism/components-common"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default withBundleAnalyzer(config);
