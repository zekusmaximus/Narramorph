/* eslint-env node */
module.exports = {
  root: true,
  env: {
    es2023: true,
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.eslint.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
      },
    },
    'import/core-modules': ['three'],
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports',
    'prettier',
    'react',
    'react-hooks',
    'react-refresh',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'coverage/',
    'node_modules/',
    '**/*.d.ts',
    '*.config.js',
    '*.config.cjs',
    '*.config.mjs',
    '*.config.ts',
    'tools/conversion/**/generated/**',
    'archive/**',
  ],
  rules: {
    // bug risk
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    // maintainability / hygiene
    eqeqeq: ['error', 'smart'],
    curly: ['error', 'all'],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'react/no-unknown-property': [
      'error',
      {
        ignore: [
          'args',
          'attach',
          'position',
          'rotation',
          'scale',
          'intensity',
          'color',
          'castShadow',
          'receiveShadow',
          'geometry',
          'material',
          'object',
          'primitive',
          'transparent',
          'opacity',
          'side',
          'depthWrite',
        ],
      },
    ],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    'prettier/prettier': 'warn',
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      },
    },
    {
      files: ['**/*.test.*', '**/__tests__/**'],
      env: {
        jest: true,
      },
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['tools/**/*.js', 'tools/**/*.ts', 'archive/**/*.js'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
