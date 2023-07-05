module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/tests/unit/styleMock.js',
    '^~/(.*)': '<rootDir>/node_modules/@sd-fe/cmp-core/src/$1',
    '^axios$': 'axios/dist/axios.js'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!@sd-fe/cmp-core/)'

  ],
  setupFiles: ['jest-canvas-mock', './tests/setup.js'],
  globals: {
    window: {}
  }
}
