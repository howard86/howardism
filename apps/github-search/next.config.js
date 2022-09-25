const withTM = require("next-transpile-modules")([
  "@howardism/theme",
  "@howardism/components-common",
]);

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withTM(config);
