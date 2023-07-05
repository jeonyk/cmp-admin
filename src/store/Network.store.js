/**
  * 파일명 : Network.store.js
  * 파일 기능 :
  * 작성자 : cdj0927
  * 최종 작성일 : 2020-10-14
  * License By Shinsegae I&C
  * 2020-10-14 IP 관리대장 기능 추가중
 **/

import API from '@sd-fe/cmp-core'
export default {
  namespaced: true,
  state: {
    ipBands: [],
    networkCategoryList: []
  },
  getters: {
    getIpBands (state) {
      return state.ipBands
    }
  },
  mutations: {
    setIpBands (state, ipBands) {
      state.ipBands = ipBands
    },
    setNetworkCategoryList (state, payload) {
      state.networkCategoryList = payload
    }
  },
  actions: {
    setIpBands ({ commit }, data) {
      commit('setIpBands', data)
    },
    async getNetworkCategoryList ({ commit }, param) {
      console.log(param)
      const response = await API.network.getNetworkCategory(param)
      if (response) commit('setNetworkCategoryList', response)
    }
  }
}
