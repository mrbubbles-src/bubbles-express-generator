import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';

const baseRules = js.configs.recommended.rules;

export default defineConfig([
  {
    ignores: ['node_modules/', 'tests/test-projects/'],
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
      reportUnusedInlineConfigs: 'warn',
    },
  },
  {
    files: ['cli/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...baseRules,
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      ...baseRules,
    },
  },
]);
