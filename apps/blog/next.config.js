const withTM = require("next-transpile-modules")(["@howardism/components-common"]);
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  redirects: () => [
    {
      source: "/blog",
      destination: "/",
      permanent: true,
    },
  ],
  experimental: {
    newNextLinkBehavior: true,
    scrollRestoration: true,
  },
};

module.exports = withTM(withBundleAnalyzer(config));
