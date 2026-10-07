const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  globalIgnores(["dist/*", ".expo/*", "ios/*", "android/*", "node_modules/*"]),
]);
