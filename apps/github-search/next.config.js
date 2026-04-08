const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ["@howardism/ui", "@howardism/components-common"],
};

module.exports = withBundleAnalyzer(config);
