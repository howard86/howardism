const PRETTIER_COMMAND = "prettier --write --list-different";

module.exports = {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", PRETTIER_COMMAND],
  "*.{json,md}": [PRETTIER_COMMAND],
};
