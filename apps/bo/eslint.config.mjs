import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [{ pattern: "@/**", group: "internal" }],
        },
      ],
    },
  },
  prettierConfig,
]);
