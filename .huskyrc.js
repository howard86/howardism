module.exports = {
  hooks: {
    "pre-commit": "lint-staged",
    "pre-push": "yarn type-check && yarn build",
  },
};
