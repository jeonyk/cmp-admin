import Vue from 'vue'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import filters from './filters'
import store from './store'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueCookie from 'vue-cookies'
import Codemirror from 'vue-codemirror'

import '@mdi/font/scss/materialdesignicons.scss'
import '@/style/style.scss'
import '@/style/mixins.scss'
import '@/style/table.scss'
import ElementUI from 'element-ui'
import koLocale from 'element-ui/lib/locale/lang/ko'
import enLocale from 'element-ui/lib/locale/lang/en'
import 'element-ui/lib/theme-chalk/index.css'
import 'codemirror/lib/codemirror.css'
import VueAnime from 'vue-animejs'

import './wijmo'

// vue-slick-carousel
// https://github.com/gs-shop/vue-slick-carousel/blob/master/LICENSE - 라이선스(무료)
// https://gs-shop.github.io/vue-slick-carousel/#/api - API
// https://gs-shop.github.io/vue-slick-carousel/?ref=madewithvuejs.com#/
import VueSlickCarousel from 'vue-slick-carousel'
import 'vue-slick-carousel/dist/vue-slick-carousel.css'
// import 'vue-slick-carousel/dist/vue-slick-carousel-theme.css'

// global Component
// import GTab from '@/components/common/g-tab/g-tab'

import * as CoreProject from '@sd-fe/cmp-core'

import TotalCount from '@/components/cmp-components/TotalCount.vue'
// import CmpGrid from '@/components/Wijmo/CMP/CMPGrid'
import CMPTree from '@/components/Wijmo/CMPTree/CMPTree'
import CMPChart from '@/components/Wijmo/CMPChart/CMPChart'
import CMPPieChart from '@/components/Wijmo/CMPChart/CMPPieChart'
import Directives from './directives'
// import CustomDialog from '@/components/CustomElementUI/Dialog.vue'
import CustomInputNumber from '@/components/CustomElementUI/InputNumber.vue'

import './utils/setup'

CoreProject.i18nHelperSetup(Vue, i18n)

const locale = VueCookie.get('CMPLang')

const setLocale = {
  ko: koLocale,
  en: enLocale
}

Vue.use(ElementUI, { locale: setLocale[locale || 'ko'] })
Vue.use(VueAxios, axios)
Vue.use(VueAnime)
Vue.use(Directives)
Vue.use(Codemirror)

Vue.component('slick-carousel', VueSlickCarousel)

Vue.use(CoreProject)

// Vue.component('cmp-grid', CmpGrid)
Vue.component('cmp-tree', CMPTree)
Vue.component('cmp-chart', CMPChart)
Vue.component('cmp-pie-chart', CMPPieChart)
Vue.component('total-count', TotalCount)
// Vue.component('el-dialog', CustomDialog)
Vue.component('el-input-number', CustomInputNumber)

// Vue.use(VueLodash, { name: 'custom', lodash: lodash })
Vue.config.productionTip = false

new Vue({
  router,
  store,
  filters,
  process,
  i18n,
  render: h => h(App)
}).$mount('#app')
