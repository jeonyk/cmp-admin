<!--
  * 파일명 : App.vue
  * 파일 기능 :
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 add: 비밀번호 찾기 페이지 추가
 -->

<template>
  <div id="app">
    <router-view />
    <expire-badge v-if="isShowExpiredBadge" />
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import VueCookies from 'vue-cookies'
import API from '@sd-fe/cmp-core'
import ExpireBadge from './components/Package/License/ExpireBadge.vue'
import onActiveTab from '@/utils/tab_active'

export default {
  components: {
    ExpireBadge
  },
  name: 'App',
  provide () {
    return {
      coreTheme: 'dark'
    }
  },
  async created () {
    await this.authCheck()
    this.enableInterceptors()
    this.langCheck()
    this.licenseInitCheck()
    onActiveTab.call(this)

    // 로그인 상황에서만 패키지 타입 체크
    const token = VueCookies.get('Authorization')
    if (token && token !== null) {
      this.$store.dispatch('checkPackageType')
      this.$store.dispatch('setServiceList')
    }
    if (!this.cloudState.cloudType && !this.cloudState.cloud && !this.cloudState.shortlyCloud) {
      this.initCloud()
    }
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType,
      cloudState: state => state.cloud,
      rootGroup: state => state.common.rootGroup
    }),
    ...mapGetters(['authed', 'token', 'user', 'perm']),
    ...mapGetters({
      subscriptionType: 'getSubscriptionType',
      expired: 'getExpired',
      isLicenseInitialized: 'getLicenseInitialized',
      loadedIsSsg: 'loadedIsSsg'
    }),
    // 구독 만료 뱃지 보이는 조건
    isShowExpiredBadge () {
      return this.subscriptionType === 'SUBSCRIBE' && this.expired
    }
  },
  watch: {
    authed (newval) {
      // console.log('@Watch: authed ', newval)
      this.getServiceByCloud()
      // 비밀번호 초기화 페이지에서 새로고침할 경우 로그인 페이지로 이동시키지 않기
      const isFindPage = window.location.href.endsWith('/main/find')
      if (newval === false && !isFindPage) {
        // 세션만료인지 / 직접 url로 접근했는지 / 일반 로그아웃인지 구분이 필요함...
        this.$router.push({ name: 'user-login' })
      }
      if (newval) this.$store.dispatch('common/setRootGroup')
    },
    '$route' (to) {
      return this.packageBasedRoute(to)
    },
    '$route.path' (path) {
      this.licenseInitCheck()
    }
  },
  methods: {

    ...mapActions({
      initCloud: 'cloud/initCloud',
      getServiceByCloud: 'cloud/getServiceByCloud'
    }),
    licenseInitCheck () {
      if (this.authed && !this.isLicenseInitialized && !this.$route.path !== '/') {
        this.$router.push({ name: 'license-initialize' })
      }
    },
    /**
     * 패키지가 BASIC, STANDARD 는 MP, DB 접근이 불가능하게 차단
     */
    packageBasedRoute (to) {
      if (!this.loadedIsSsg) return
      const packageType = this.packageType
      if (packageType !== '') {
        const regex = {
          PL: /task|mp-template|resource\/(switch|security|database)|account\/user|notice|indiv-inquiry|set-faq|work-flow|configure\/(network-routing|network-equip|switch-equip|firewall-vdom|monitoring-server|logging-server|org|approval)/gi,
          BS: /mp-template|resource\/database|configure\/(monitoring-server|logging-server)/gi,
          STD: /mp-template|resource\/database/gi
        }[packageType]

        if (regex && regex.test(to.path)) {
          // console.clear()
          // console.log(regex.test(to.path))
          return this.$router.replace({ name: 'not-found' })
        }
      }
    },
    async authCheck () {
      const token = VueCookies.get('Authorization')
      if (token && token !== null) {
        this.axios.defaults.headers.common.Authorization = token
        const res = await API.iam.verifyToken()
        if (res.code === 'IAM020' || res.code === 'IAM016') {
          this.$nextTick(() => {
            setTimeout(() => {
              const isFirstLogin = (res.code === 'IAM016')
              const message = isFirstLogin ? this.$t('common.ALERT.LOGIN.014') : this.$t('common.ALERT.LOGIN.013')
              return this.$route.path !== '/chg-pwd' ? this.$alert(message, {
                dangerouslyUseHTMLString: true,
                callback: () => {
                  this.$router.push({
                    name: 'change-password',
                    params: { firstLogin: isFirstLogin }
                  })
                }
              }) : null
            }, 100)
          })
        // eslint-disable-next-line
        } /* else if (res.code === 'IAM002') {
          this.$store.commit('setAuthed', false)
          this.$store.commit('setToken', '')
          this.$store.commit('setUser', '')
          this.$store.commit('setPerm', '')
        } */ else {
          this.$store.commit('setAuthed', true)
          this.$store.commit('setToken', token)
          this.$store.commit('setUser', VueCookies.get('User'))
          this.$store.commit('setPerm', VueCookies.get('Perm'))
        }
      } else {
        this.$store.commit('setAuthed', false)
        this.$store.commit('setToken', '')
        this.$store.commit('setUser', '')
        this.$store.commit('setPerm', '')

        // CMPLang 는 제외하고 쿠키 비우기
        const arrCookies = VueCookies.keys()
        const index = arrCookies.indexOf('CMPLang')
        if (index > -1) arrCookies.splice(index, 1)
        arrCookies.forEach((cookie) => VueCookies.remove(cookie))
      }
    },
    enableInterceptors () {
      this.axios.interceptors.request.use((req) => {
        const token = VueCookies.get('Authorization')
        if (token) { req.headers.Authorization = token }
        return new Promise((resolve) => resolve(req))
      }, (error) => {
        return Promise.reject(error)
      })

      this.axios.interceptors.response.use((res) => {
        if (res.headers.authorization) {
          VueCookies.set('Authorization', res.headers.authorization, 0)
          this.$store.commit('setToken', res.headers.authorization)
        }
        return new Promise((resolve) => resolve(res))
      }, (error) => {
        if (error.__CANCEL__) return

        const response = error.response
        let message = response?.data?.message
        if (response?.status >= 500) {
          message = this.$t('common.ALERT.BASE.061')
        } else {
          if (!message && response?.status !== 404) {
            message = this.$t('common.ALERT.BASE.062')
            this.$router.replace({ name: 'not-found' })
          }
        }

        const reason = ['IAM002', 'IAM003', '4001']

        if (reason.includes(response?.data?.code)) {
          this.$store.dispatch('logout')
          this.$router.replace({ name: 'user-login', params: { code: response?.data?.code } })
          return new Promise(() => {}) // Promise Chain 끊음
        } else if (response?.data?.code === 'IAM001') {
          this.$store.dispatch('logout')
          this.$router.replace({ name: 'user-login', params: { code: response?.data?.code } })
        }
        return Promise.reject(error)
      })
    },
    langCheck () {
      const locale = VueCookies.get('CMPLang')
      this.$store.dispatch('setLanguage', locale || 'ko')
      this.$i18n.locale = locale || 'ko'
    }
  }
}
</script>
