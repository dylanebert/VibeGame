import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        HTMLElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        WheelEvent: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebGLSync: 'readonly',
        process: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        MutationObserver: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        DOMParser: 'readonly',
        Input: 'readonly',
        Event: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-case-declarations': 'off',
      'no-console': 'off',
      'import/no-namespace': [
        'error',
        { ignore: ['three', '@dimforge/rapier3d-compat'] },
      ],
      'import/export': 'error',
    },
  },
  // Plugins: now use relative imports internally
  {
    files: ['src/plugins/**/*.ts', '!src/plugins/**/index.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '.',
              message:
                'Do not import from barrel files - use direct imports like "./components"',
            },
          ],
          patterns: [
            {
              group: ['vibegame', 'vibegame/*'],
              message:
                'Internal plugin files should use relative imports, not package imports',
            },
          ],
        },
      ],
    },
  },
  // Core: allow internal cross-imports within core, but no barrel imports
  {
    files: ['src/core/**/*.ts', '!src/core/**/index.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '.',
              message:
                'Do not import from barrel files - use direct imports like "./types"',
            },
            {
              name: '..',
              message:
                'Do not import from parent barrel - use direct imports like "../ecs/types"',
            },
          ],
          patterns: [
            {
              group: ['vibegame', 'vibegame/*'],
              message:
                'Internal core files should use relative imports, not package imports',
            },
          ],
        },
      ],
    },
  },
  // Plugin index files: no wildcard exports for better tree shaking
  {
    files: ['src/plugins/**/index.ts', 'src/core/**/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message:
            'Do not use wildcard exports (export *) - use named exports for better tree shaking',
        },
      ],
    },
  },
  // Main entry files (builder, runtime, index)
  {
    files: ['src/index.ts', 'src/builder.ts', 'src/runtime.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['vibegame', 'vibegame/*'],
              message:
                'Entry files should use relative imports to internal modules',
            },
          ],
        },
      ],
    },
  },
  // Test files: can import from vibegame package
  {
    files: ['tests/**/*.ts', '**/__tests__/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*/src/*', '../src/*', '../../src/*'],
              message:
                'Tests should import from vibegame package, not source files directly',
            },
          ],
        },
      ],
    },
  },
  // JavaScript files (for create-vibegame script)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        URL: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  // Template files are examples, not part of the main codebase
  {
    files: ['create-vibegame/template/**/*'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'examples/**',
      '**/*.test.js',
      'packages/**/dist/**',
    ],
  },
  // Workspace packages: can import from vibegame package
  {
    files: ['packages/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
];
