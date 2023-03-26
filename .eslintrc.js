/** @type{import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: ["howardism"],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
}
