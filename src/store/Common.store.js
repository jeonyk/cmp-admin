/**
  * 파일명 : Common.store.js
  * 파일 기능 :
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-16
  * License By Shinsegae I&C
  * 2021-02-16 Update: 관리자 pdf 추출 방식 변경
 **/

import API from '@sd-fe/cmp-core'
export default {
  namespaced: true,
  state: {
    rootGroup: '',
    sidenavExpanded: false,
    breadcrumbs: [],
    menuList: {},
    userMenuList: [],
    changeMonitoringLogging: null,
    company: [],
    lang: ''
  },
  getters: {
    rootGroup: state => {
      return state.rootGroup
    },
    breadcrumbs: state => {
      return state.breadcrumbs
    }
  },
  mutations: {
    SET_ROOT_GROUP (state, payload) {
      state.rootGroup = payload
    },
    SET_SIDENAV_EXPAND (state, payload) {
      state.sidenavExpanded = payload
    },
    SET_BREADCRUMBS (state, payload) {
      state.breadcrumbs = payload
    },
    /**
     * @function - 특정 param이 있는 페이지에 breadcrumbs의 마지막의 font-weight 를 조절합니다.
     * @return {void}
     */
    ADD_PARAMETERS (state, payload) {
      state.breadcrumbs[state.breadcrumbs.length - 1].path = true
      state.breadcrumbs.push(payload)
    },
    MOD_LAST_PARAMETERS (state, payload) {
      state.breadcrumbs.splice(-1, 1)
      state.breadcrumbs[state.breadcrumbs.length - 1].path = true
      state.breadcrumbs.push(payload)
    },
    SET_MENU_LIST  (state, payload) {
      state.menuList = payload
    },
    SET_USER_MENU_LIST  (state, payload) {
      state.userMenuList = payload
    },
    SET_ALL_COMPANY (state, payload) {
      state.company = payload
    },
    SET_LANGUAGE (state, payload) {
      state.lang = payload
    }
  },
  actions: {
    async setRootGroup ({ commit }, payload) {
      const resDetail = await API.config.getCodeList({ codeType: 'GROUP_TOP' })
      if (resDetail.length > 0) commit('SET_ROOT_GROUP', resDetail[0].codeName)
    },
    setBreadcrumbs ({ commit }, payload) {
      commit('SET_BREADCRUMBS', payload)
    },
    setChangeMonitoringLogging ({ state }, payload) {
      state.changeMonitoringLogging = payload
    },
    async getSimpleCompanyList ({ commit }) {
      const response = await API.iam.getSimpleList()
      const result = []
      if (response !== undefined) {
        // 관계사 코드
        for (const group in response.groupMap) {
          const data = {
            label: response.groupMap[group],
            field: Number.parseInt(group)
          }
          result.push(data)
        }
        commit('SET_ALL_COMPANY', result)
      }
    },
    setMenuList ({ commit }, payload) {
      localStorage.setItem('MenuList', payload)
      commit('SET_MENU_LIST', payload)
    }
  }
}
