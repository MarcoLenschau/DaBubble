import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "max-lines-per-function": ["error", {max: 14, skipBlankLines: true, skipComments: true},],
      "max-lines": ["error", { max: 300 }],
      "semi": ["error", "always"],
      "no-console": ["error"],
      "prefer-const": ["warn"],
      "jsdoc/require-jsdoc": ["warn", 
        { "require": {
            "FunctionDeclaration": true,
            "MethodDefinition": true,
            "ArrowFunctionExpression": true,
            "FunctionExpression": true
          }
        }
      ],
    },
    plugins: {
      jsdoc: jsdoc
    }
  },
]);
