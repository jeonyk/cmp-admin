module.exports = {
  root: true,
  env: {
    node: true,
    jest: true
  },
  extends: [
    'plugin:vue/strongly-recommended',
    '@vue/standard'
  ],
  parserOptions: {
    sorceType: 'module',
    parser: 'babel-eslint'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },
  ignorePatterns: ['node_modules', '../**/*']
  // overrides: [
  //   {
  //     files: [
  //       '**/__tests__/*.{j,t}s?(x)',
  //       '**/tests/unit/**/*.spec.{j,t}s?(x)'
  //     ],
  //     env: {
  //       jest: true
  //     }
  //   }
  // ]
}
