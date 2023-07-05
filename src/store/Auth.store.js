/**
  * 파일명 : Auth.store.js
  * 파일 기능 :
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-01
  * License By Shinsegae I&C
  * 2021-02-01 Update: admin 알림창 메세지 변경 및 enter 클릭시 팝업 겹치는 현상 해결
 **/

import VueCookies from 'vue-cookies'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default {
  state: {
    token: '',
    authed: null,
    user: {},
    perm: {},
    language: '',
    isSsg: true,
    loadedIsSsg: false,
    packageType: '', // [ 'PL', 'BS', 'STD', 'ENT' ]
    subscriptionType: null, // 구독형/구매형 타입
    expired: false, // 구독 만료 상태
    isLicenseInitialized: true, // 최초 등록 여부
    serviceList: []
  },
  getters: {
    token: state => {
      return state.token
    },
    authed: state => {
      return state.authed
    },
    user: state => {
      return state.user
    },
    perm: state => {
      return state.perm
    },
    isSsg: state => {
      return state.isSsg
    },
    packageType: state => {
      return state.packageType
    },
    loadedIsSsg: state => {
      return state.loadedIsSsg
    },
    getSubscriptionType: state => {
      return state.subscriptionType
    },
    getExpired: state => {
      return state.expired
    },
    getLicenseInitialized: state => {
      return state.isLicenseInitialized
    }
  },
  actions: {
    /**
     * 로그인
     * @param {*} loginParam 로그인 정보 ID, PW, ADMIN여부
     * @returns {void || Object} 로그인 성공 undefined / 실패 response object
     */
    async login ({ commit, dispatch }, loginParam) {
      const loginResult = await API.iam.login(loginParam)

      if (loginResult.token) {
        commit('setAuthed', true)
        commit('setToken', loginResult.token)
        VueCookies.set('Authorization', loginResult.token, 0)
        const user = {
          ...loginResult.userResDto,
          isFirstLogin: loginResult.isFirstLogin
        }
        user.userPhoto = ''
        commit('setUser', user)
        VueCookies.set('User', user, 0)
        commit('setPerm', loginResult.userPermDto)
        VueCookies.set('Perm', loginResult.userPermDto, 0)
      }
      return loginResult
    },
    logout ({ commit }) {
      VueCookies.remove('Authorization')
      VueCookies.remove('Perm')
      VueCookies.remove('User')
      VueCookies.remove('PackageType')
      localStorage.removeItem('MenuList')
      commit('setAuthed', false)
      commit('setToken', '')
      commit('setUser', '')
      commit('setPerm', '')
    },
    setLanguage ({ commit }, payload) {
      commit('setLanguage', payload)
      VueCookies.set('CMPLang', payload, '1m')
    },
    setIsSsg ({ commit }, payload) {
      commit('setIsSsg', payload)
    },
    setPackageType ({ commit }, payload) {
      console.log(payload)
      commit('setPackageType', payload)
      VueCookies.set('PackageType', payload, 0)
    },
    async setServiceList ({ state, commit }) {
      const roles = await API.iam.getTaskRole()
      const validRoleIdxs = state.user?.userPermRoleList?.map(x => x.roleUpper)
      const filteredRoles = roles.filter(x => validRoleIdxs?.includes(x.roleIdx))
      commit('setServiceList', filteredRoles)
    },
    async checkPackageType ({ dispatch, commit }) {
      // 패키지 타입 체크
      const typeMap = {
        p: 'PL',
        b: 'BS',
        s: 'STD',
        e: 'ENT'
      }
      if (process.env.NODE_ENV === 'production') {
        // Package Type 요청 API 호출
        const data = await API.license.getCurrentLicense()
        // 테스트 데이터
        // const data = {
        //   isSSG: true,
        //   packageType: {
        //     packageTypeIdx: 4,
        //     packageTypeName: 'Enterprise'
        //   },
        //   subscriptionType: 'SUBSCRIBE',
        //   companyName: '신세계 I&C',
        //   companyCode: 'prod',
        //   registerDate: '2022-01-06',
        //   purchaseDate: '2021-11-26',
        //   startDate: '2022-01-06',
        //   endDate: '2022-03-27' // 해당 값이 현재 날짜보다 작으면 만료된 상태
        // }
        // const data = {}
        if (data && data.packageType) {
          const key = data.packageType.packageTypeName.slice(0, 1).toLowerCase()
          console.log(data, key)
          // 중앙 (신세계) or 대외 세팅
          dispatch('setIsSsg', data.isSSG)
          // 패키지 타입 세팅
          dispatch('setPackageType', typeMap[key])
          commit('setLoadedIsSsg', true)

          // 구매 타입 설정
          commit('setSubscriptionType', data.subscriptionType)

          // 구독 만료 체크
          if (data.subscriptionType === 'SUBSCRIBE') {
            // 구독 만료 시점 계산
            // 3월 24일 -> 3월 25일 00시 00분 00초
            const endDate = new Date(dayjs(data.endDate).add(1, 'day').format('YYYY-MM-DD')).getTime()
            const now = Date.now()

            if (now >= endDate) {
              commit('setExpired', true)
            }
          }
          commit('setLicenseInitialized', true)
        } else if (!data) {
          commit('setLoadedIsSsg', true)
          commit('setLicenseInitialized', false)
        }
      } else {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          // local 개발 시 ENT 패키지 타입으로 default 세팅
          // localhost 일 경우에만 개발용으로 쿠키 사용
          const pType = VueCookies.get('PackageType')
          if (pType && pType !== null) {
            dispatch('setPackageType', pType)
          } else {
            dispatch('setPackageType', typeMap.e)
          }
        } else {
          if (process.env.VUE_APP_DEMO_PACKAGE_TYPE) {
            // 고객사 데모 페이지 (demo-gsitm, demo-bnk ...)
            dispatch('setPackageType', process.env.VUE_APP_DEMO_PACKAGE_TYPE)
            dispatch('setIsSsg', false)
          } else {
            // 마포 개발기에서는 도메인 주소로 패키지 타입 체크
            const hostName = window.location.hostname
            const arrUrl = hostName.split('.')
            if (arrUrl[0].indexOf('demo') > -1 && arrUrl.includes('spharoscmp')) { // Demo
              const data = await API.license.getCurrentLicense()
              if (data && data.packageType) {
                const key = data.packageType.packageTypeName.slice(0, 1).toLowerCase()
                dispatch('setPackageType', typeMap[key])
              }
            } else {
              dispatch('setPackageType', typeMap.e)
            }
          }
        }
        commit('setLoadedIsSsg', true)
      }
    }
  },
  mutations: {
    setToken (state, payload) {
      state.token = payload
    },
    setAuthed (state, payload) {
      state.authed = payload
    },
    setUser (state, payload) {
      state.user = payload
    },
    setPerm (state, payload) {
      state.perm = payload
    },
    setLanguage (state, payload) {
      state.language = payload
    },
    setIsSsg (state, payload) {
      state.isSsg = payload
    },
    setPackageType (state, payload) {
      state.packageType = payload
    },
    setLoadedIsSsg (state, loaded) {
      state.loadedIsSsg = loaded
    },
    setExpired (state, expired) {
      state.expired = expired
    },
    setSubscriptionType (state, type) {
      state.subscriptionType = type
    },
    setLicenseInitialized (state, bool) {
      state.isLicenseInitialized = bool
    },
    setServiceList (state, payload) {
      state.serviceList = payload
    }
  }
}
