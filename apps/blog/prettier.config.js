/** @type {import('prettier').Config} */
module.exports = {
  ...require("../../prettier.config"),
  plugins: [require("prettier-plugin-tailwindcss")],
}
