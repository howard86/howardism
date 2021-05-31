const withTM = require("next-transpile-modules")(["@howardism/login-form"]);

module.exports = withTM({
  reactStrictMode: true,
  future: {
    webpack5: true,
  },
  images: {
    domains: ["res.cloudinary.com"],
  },
});
