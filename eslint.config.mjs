import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import perfectionist from 'eslint-plugin-perfectionist'
import globals from 'globals'

export default [
  { ignores: ['docs/', 'playwright-report/', 'test-results/', 'patches/'] },
  js.configs.recommended,
  prettier,
  {
    files: ['playwright.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    plugins: { perfectionist },
    rules: {
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
      ],
      'lines-between-class-members': ['error', 'always'],
      'perfectionist/sort-classes': 'error',
      'perfectionist/sort-imports': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
]
