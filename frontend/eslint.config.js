import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // '._*' are macOS AppleDouble metadata shadow files (this repo lives on
  // an exFAT drive) - not source, must never be linted.
  globalIgnores(['.next', 'out', 'next-env.d.ts', '**/._*']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Allow `const { a, b, ...rest } = values` where `a`/`b` are only
      // there to exclude them from `rest` - a common, intentional pattern,
      // not an oversight.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
    },
  },
])
