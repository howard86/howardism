/** @type{import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["simple-import-sort", "import"],
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
  },
  env: {
    es6: true,
    browser: true,
    node: true,
    jest: true,
  },
  overrides: [
    {
      files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.test.ts", "**/*.test.tsx"],
      plugins: ["jest", "testing-library"],
      extends: ["plugin:jest/all", "plugin:testing-library/react"],
      rules: {
        "jest/no-hooks": 0,
      },
    },
  ],
  rules: {
    "import/extensions": 0,
    "import/first": 2,
    "import/newline-after-import": 0,
    "import/no-duplicates": 2,
    "import/no-extraneous-dependencies": 0,
    "import/order": 0,
    "import/prefer-default-export": 0,
    "no-param-reassign": [
      2,
      {
        props: true,
        ignorePropertyModificationsFor: ["state", "req"],
      },
    ],
    "no-plusplus": [2, { allowForLoopAfterthoughts: true }],
    "no-restricted-syntax": [2, "ForInStatement", "LabeledStatement", "WithStatement"],
    "no-underscore-dangle": 0,
    "global-require": 0,
    "react/jsx-props-no-spreading": 0,
    "react/react-in-jsx-scope": 0,
    "react/require-default-props": 0,
    "simple-import-sort/imports": 2,
    "simple-import-sort/exports": 2,
    "sort-imports": 0,
    "@typescript-eslint/no-var-requires": 0,
    "@next/next/no-html-link-for-pages": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
}
