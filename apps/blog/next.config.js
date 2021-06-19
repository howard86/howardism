module.exports = {
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
};
