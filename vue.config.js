// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const { VUE_APP_IS_LOCAL, npm_lifecycle_event: npmLifecycleEvent } = process.env
const isLocalAndServe = VUE_APP_IS_LOCAL && npmLifecycleEvent === 'serve'
const path = require('path')

module.exports = {
  transpileDependencies: ['@sd-fe/cmp-core'],
  configureWebpack: {
    resolve: {
      mainFields: ['wj-esm5', 'module', 'main'],
      symlinks: false,
      alias: {
        vue$: 'vue/dist/vue.esm',
        '~': path.resolve(__dirname, 'node_modules', '@sd-fe/cmp-core', 'src')
      }
    },
    plugins: [
      // new BundleAnalyzerPlugin()
    ]
  },
  css: {
    sourceMap: false,
    loaderOptions: {
      sass: {
        prependData: `
          @import '@/style/global.scss';
          @import '@/style/mixins.scss';
          @import '@/style/table.scss';
        `
      }
    },
    // 로컬 환경에서 css extract 옵션을 false로 변경
    // https://cli.vuejs.org/config/#css-extract
    // Extracting CSS is disabled by default in development mode
    // since it is incompatible with CSS hot reloading.
    // However, you can still enforce extraction in all cases
    // by explicitly setting the value to true.
    extract: isLocalAndServe ? false : { ignoreOrder: true }
  }
  // devServer: { // 로컬호스트 미들웨어
  //   proxy: {
  //     '/api': {
  //       target: 'https://api-s.growthsoft.co.kr/',
  //       // pathRewrite: { '^/api': '' },
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   }
  // }
}
