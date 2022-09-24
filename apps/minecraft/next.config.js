const withTM = require("next-transpile-modules")(["three"]);

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = withTM(config);
