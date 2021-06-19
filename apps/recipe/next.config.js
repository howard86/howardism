const withTM = require("next-transpile-modules")(["@howardism/login-form"]);

module.exports = withTM({
  reactStrictMode: true,
  webpack5: true,
  images: {
    domains: ["res.cloudinary.com"],
  },
});
