module.exports = {
  extends: ["eslint:recommended"],
  env: {
    browser: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  }
};
