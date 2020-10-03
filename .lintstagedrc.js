module.exports = {
  "**/*.{ts,tsx}": [
    (filenames) => filenames.map((filename) => `prettier '${filename}' --write`),
    (filenames) => (filenames.length > 1 ? "yarn lint" : `eslint ${filenames.join(" ")}`),
  ],
};
