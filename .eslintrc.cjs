module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  ignorePatterns: ['dist/', 'coverage/'],
  extends: ['eslint:recommended'],
  overrides: [
    {
      files: ['test/**/*.ts'],
      env: {
        node: true
      }
    }
  ]
};
