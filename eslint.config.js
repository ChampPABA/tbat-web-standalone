import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import next from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'out/**/*',
      'dist/**/*',
      'build/**/*',
      'coverage/**/*',
      '**/*.config.js',
      '**/*.config.ts',
      '**/scripts/**/*',
      '**/tests/load/**/*'
    ]
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      '@next/next': next,
      'react-hooks': reactHooks,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': 'off', // Allow unused vars in development
      '@typescript-eslint/no-explicit-any': 'off', // Allow any type in rapid prototyping
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': 'off', // Turn off base rule as we use @typescript-eslint version
      'no-undef': 'off', // Allow undefined vars for global types
    },
  },
];