const withTM = require("next-transpile-modules")(["@howardism/components-common"]);

/** @type{import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  redirects: () => [
    {
      source: "/blog",
      destination: "/",
      permanent: true,
    },
  ],
};

module.exports = withTM(config);
