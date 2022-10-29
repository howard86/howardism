module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "simple-import-sort"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "plugin:@next/next/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
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
    "import/no-extraneous-dependencies": 0,
    "import/no-relative-packages": 0,
    "import/extensions": 0,
    "import/no-import-module-exports": [
      2,
      {
        exceptions: ["**/*/jest.config.ts"],
      },
    ],
    "import/prefer-default-export": 0,
    "global-require": 0,
    "no-param-reassign": [
      2,
      {
        props: true,
        ignorePropertyModificationsFor: ["state", "req"],
      },
    ],
    "no-restricted-syntax": [2, "ForInStatement", "LabeledStatement", "WithStatement"],
    "no-underscore-dangle": 0,
    "react/jsx-props-no-spreading": 0,
    "react/react-in-jsx-scope": 0,
    "react/require-default-props": 0,
    "simple-import-sort/imports": [
      2,
      {
        groups: [
          [
            "^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)",
          ],
          ["^react", "^@?\\w"],
          ["^(@|@company|@ui|components|utils|config|vendored-lib)(/.*|$)"],
          ["^\\u0000"],
          ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
          ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          ["^.+\\.s?css$"],
        ],
      },
    ],
    "@typescript-eslint/no-var-requires": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
