const withTM = require("next-transpile-modules")(["three"]);

module.exports = withTM({
  reactStrictMode: true,
  future: {
    webpack5: true,
  },
});
