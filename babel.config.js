const plugins = [
  [
    'component',
    {
      libraryName: 'element-ui',
      styleLibraryName: 'theme-chalk'
    }
  ],
  ['lodash', { id: 'lodash-compat' }]
]
if (
  process.env.NODE_ENV === 'production' &&
  !process.env.VUE_APP_ZUUL_URL.includes('test') &&
  !process.env.VUE_APP_ZUUL_URL.includes('stg')
) {
  plugins.push(['transform-remove-console'])
}
module.exports = {
  presets: [
    '@vue/app'
  ],
  plugins
}
