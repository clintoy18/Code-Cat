module.exports = {
  root: false,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    tsconfigRootDir: process.cwd(),
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'airbnb-typescript/base',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
  rules: {
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/test/**',
          '**/*.config.ts',
          '**/*.config.tsx',
          '**/vite.config.ts',
          '**/vitest.config.ts',
        ],
      },
    ],
    'class-methods-use-this': 'off',
    '@typescript-eslint/lines-between-class-members': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
      },
    ],
    '@typescript-eslint/no-redeclare': [
      'error',
      {
        builtinGlobals: false,
      },
    ],
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
};
