module.exports = {
  "**/*.{ts,tsx}": [
    (filenames) => filenames.map((filename) => `prettier '${filename}' --write`),
    (filenames) => (filenames.length > 10 ? "pnpm lint" : `eslint ${filenames.join(" ")}`),
  ],
};
