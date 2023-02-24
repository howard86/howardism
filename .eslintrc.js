/** @type{import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "simple-import-sort", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:@next/next/recommended",
    "prettier",
  ],
  parserOptions: {
    sourceType: "module",
    project: "./tsconfig.eslint.json",
    tsconfigRootDir: __dirname,
  },
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ["**/*.spec.ts", "**/*.spec.tsx"],
      plugins: ["jest"],
      extends: ["plugin:jest/all", "plugin:testing-library/react"],
      rules: {
        "jest/no-hooks": 0,
      },
    },
  ],
  rules: {
    "global-require": 0,
    "import/extensions": 0,
    "import/order": 0,
    // TODO: fix when updating eslint config
    // Reference: https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-extraneous-dependencies.md#options
    "import/no-extraneous-dependencies": 0,
    "import/no-import-module-exports": 0,
    "import/no-relative-packages": 0,
    "import/prefer-default-export": 0,
    "import/first": 2,
    "import/newline-after-import": 2,
    "import/no-duplicates": 2,
    // TODO: move to app level config
    "no-underscore-dangle": 0,
    "no-plusplus": [2, { allowForLoopAfterthoughts: true }],
    "no-param-reassign": [2, { props: true, ignorePropertyModificationsFor: ["state", "req"] }],
    "no-restricted-syntax": [2, "ForInStatement", "LabeledStatement", "WithStatement"],
    "react/jsx-props-no-spreading": 0,
    "react/react-in-jsx-scope": 0,
    "react/require-default-props": 0,
    "simple-import-sort/imports": 2,
    "simple-import-sort/exports": 2,
    "@typescript-eslint/no-var-requires": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}
