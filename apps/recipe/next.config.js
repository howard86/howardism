const withTM = require("next-transpile-modules")([
  "@howardism/components-common",
  "@howardism/login-form",
]);

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["res.cloudinary.com"],
  },
};

module.exports = withTM(config);
