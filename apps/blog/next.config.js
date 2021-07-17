const withTM = require("next-transpile-modules")(["@howardism/components-common"]);

module.exports = withTM({
  reactStrictMode: true,
  webpack5: true,
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/",
        permanent: true,
      },
    ];
  },
});
