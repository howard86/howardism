/** @type{import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: ["howardism"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.eslint.json",
  },
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
}
