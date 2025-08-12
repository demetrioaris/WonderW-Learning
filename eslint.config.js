// eslint.config.js (ESLint v9 - Flat config)
import js from "@eslint/js";
import globals from "globals";

export default [
  // Ignore specific folders and files
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "**/*.min.js",
      "src/assests/**"
    ]
  },

  // Base ESLint recommended configuration
  js.configs.recommended,

  // Project-specific configuration
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.browser // Allows browser globals like window, document, etc.
      }
    },
    rules: {
      "semi": ["error", "always"],        // Require semicolons
      "quotes": ["error", "double"],      // Enforce double quotes
      "no-unused-vars": "warn",           // Warn if variables are declared but not used
      "no-undef": "error",                // Disallow use of undeclared variables
      "indent": ["error", 2],             // Enforce 2-space indentation
      "no-console": "off",                // Allow console.log during development
      "eqeqeq": ["error", "always"],      // Require === and !== instead of == and !=
      "curly": ["error", "all"]           // Require curly braces for all control statements
    }
  }
];
