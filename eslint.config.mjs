import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import noGenericNames from "./.eslint-rules/no-generic-names.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.react,
        React: "readonly", // For Next.js/React 17+ auto-import
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
      "@eslint-community/eslint-comments": eslintComments,
      custom: {
        rules: {
          "no-generic-names": noGenericNames,
        },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Custom rules
      "custom/no-generic-names": "error",
      "@eslint-community/eslint-comments/no-use": [
        "error",
        {
          allow: ["eslint-disable", "eslint-enable", "eslint-disable-next-line"],
        },
      ],

      // No comments - forces self-documenting code
      "no-warning-comments": "error",
      "multiline-comment-style": "error",
      "capitalized-comments": "error",
      "no-inline-comments": "error",
      "spaced-comment": "error",

      // Basic strictness
      "prefer-const": "error",
      "no-var": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "VariableDeclaration[kind='let']",
          message: "Use const. Avoid mutation.",
        },
      ],

      // Complexity
      complexity: ["error", 12],
      "max-depth": ["error", 3],
      "max-lines": ["error", { max: 400, skipBlankLines: true, skipComments: true }],

      // Naming Conventions
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase"],
        },
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "objectLiteralProperty",
          format: null,
        },
      ],

      // TypeScript overrides
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-expect-error": "allow-with-description",
          "ts-ignore": true,
          "ts-nocheck": true,
          "ts-check": false,
        },
      ],

      // Next.js specific tweaks
      "@next/next/no-html-link-for-pages": ["error", dirname(__filename)],
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-head-element": "error",
      "@next/next/inline-script-id": "error",
      "@next/next/no-page-custom-font": "error",
    },
  },
  {
    files: ["src/__tests__/**/*.ts", "src/__tests__/**/*.tsx", "**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-empty-function": "error",
      "custom/no-generic-names": "error",
      "@eslint-community/eslint-comments/disable-enable-pair": "error",
      "@next/next/no-img-element": "error",
      "no-restricted-syntax": "error",
    },
  },
  {
    // Special config for JS rules files to avoids parser.project errors
    files: [".eslint-rules/*.js", "*.config.mjs", "*.config.ts"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      ".lintstagedrc.js",
      "global.d.ts",
      "next-env.d.ts",
      "jest.setup.js",
      "**/dist",
      "**/out-tsc",
    ],
  },
];

export default eslintConfig;
