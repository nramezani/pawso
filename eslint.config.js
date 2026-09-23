const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*'],
  },
  {
    rules: {
      // Stylistic-only rule; raw apostrophes in JSX text (e.g. "don't") are not a real bug.
      'react/no-unescaped-entities': 'off',
    },
  },
];
