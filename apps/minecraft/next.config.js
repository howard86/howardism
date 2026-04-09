const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  transpilePackages: ["three"],
};

module.exports = withBundleAnalyzer(config);
