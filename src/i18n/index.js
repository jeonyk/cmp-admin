import Ko from './ko.js'
import En from './en.js'
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import VueCookies from 'vue-cookies'

Vue.use(VueI18n)

const messages = {
  ko: Ko,
  en: En
}

const locale = VueCookies.get('CMPLang')

export default new VueI18n({
  locale: locale || 'ko',
  fallbackLocale: 'en',
  messages: messages
})
