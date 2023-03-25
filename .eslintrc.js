/** @type{import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: ["howardism"],
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
  },
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
}
