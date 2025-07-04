module.exports = {
  extends: ["eslint:recommended"],
  env: {
    node: true,
    es6: true
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js"]
};
