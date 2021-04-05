module.exports = {
  reactStrictMode: true,
  future: {
    webpack5: true,
  },
  async redirects() {
    return [
      {
        source: "/blog",
        destination: "/",
        permanent: true,
      },
    ];
  },
};
