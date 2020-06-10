module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true,
  },
  extends: ["plugin:react/recommended", "airbnb"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "jest"],
  rules: {
    // don't care
    quotes: "off",
    "comma-dangle": "off",
    "object-curly-newline": "off",
    "array-callback-return": "off",
    "lines-between-class-members": "off",
    "arrow-parens": "off",
    "implicit-arrow-linebreak": "off",
    // duplicates
    "no-unused-vars": "off",
    // rest
    // A temporary hack related to IDE not resolving correct package.json
    "import/no-extraneous-dependencies": "off",
    // copy from packages/web-client/.eslintrc.json
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react/no-children-prop": "off",
    "react/prop-types": "off",
    "import/order": "off",
    "import/no-cycle": "off",
    "react/destructuring-assignment": "off",
    "react/jsx-curly-newline": "off",
    "react/jsx-props-no-spreading": "off",
    "react/jsx-indent": "off",
    "react/jsx-indent-props": "off",
    "react/static-property-placement": "off",
    "react/prefer-stateless-function": "off",
    "react/no-did-update-set-state": "off",
    "react/sort-comp": [
      1,
      {
        order: [
          "static-methods",
          "instance-variables",
          "lifecycle",
          "/^on.+$/",
          "everything-else",
          "render",
        ],
      },
    ],
    // used for redux toolkit
    "no-param-reassign": "off",
    "max-classes-per-file": "off",
    "spaced-comment": "off",
    "prefer-destructuring": "off",
    "no-useless-return": "off",
    "import/prefer-default-export": "off",
    "no-underscore-dangle": "off",
    "class-methods-use-this": "off",
    // problems with this
    "prettier/prettier": "off",
    "import/no-unresolved": "off",
    "import/extensions": "off",
  },
};
