import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

const baseRules = js.configs.recommended.rules;

export default defineConfig([
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
      reportUnusedInlineConfigs: 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...baseRules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
]);
