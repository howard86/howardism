const withTM = require("next-transpile-modules")([
  "@howardism/components-common",
  "@howardism/login-form",
]);
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["res.cloudinary.com"],
  },
};

module.exports = withTM(withBundleAnalyzer(config));
