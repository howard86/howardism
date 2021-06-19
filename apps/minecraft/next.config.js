const withTM = require("next-transpile-modules")(["three"]);

module.exports = withTM({
  reactStrictMode: true,
  webpack5: true,
});
