const PRETTIER_COMMAND = (module.exports = {
  "*": "prettier --write --list-different",
  "*.{js,jsx,ts,tsx}": "eslint --fix",
})
