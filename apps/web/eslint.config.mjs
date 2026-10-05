import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import reactCompiler from "eslint-plugin-react-compiler";
import prettierConfig from "eslint-config-prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { "react-compiler": reactCompiler },
    rules: { "react-compiler/react-compiler": "error" },
  },
  prettierConfig,
];

export default eslintConfig;
