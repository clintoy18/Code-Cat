module.exports = {
  extends: [
    require.resolve('./base.cjs'),
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:react/jsx-runtime',
  ],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: true,
    },
  },
  rules: {
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/require-default-props': 'off',
  },
};
