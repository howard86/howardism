module.exports = {
  "**/*.ts": [
    (filenames) => filenames.map((filename) => `prettier '${filename}' --write`),
    (filenames) =>
      filenames.length > 10
        ? "eslint . --ext .ts,.tsx"
        : `eslint ${filenames.join(" ")} --ext .ts,.tsx`,
  ],
};
