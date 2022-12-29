/** @type {import('prettier').Config} */
module.exports = {
  printWidth: 100,
  singleQuote: false,
  semi: false,
  plugins: [require("prettier-plugin-tailwindcss")],
  tailwindConfig: "./apps/blog/tailwind.config.js",
}
