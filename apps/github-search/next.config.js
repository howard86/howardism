const withTM = require("next-transpile-modules")([
  "@howardism/theme",
  "@howardism/components-common",
]);
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withTM(withBundleAnalyzer(config));
