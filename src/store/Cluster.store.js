/**
  * 파일명 : Cluster.store.js
  * 작성자 : 염창윤
  * 최종 작성일 : 2023-04-11
  * License By Shinsegae I&C
 **/

import API from '@sd-fe/cmp-core'
export default {
  namespaced: true,
  state: {
    clusterList: []
  },
  getters: {
  },
  mutations: {
    setClusterList (state, payload) {
      state.clusterList = payload
    }
  },
  actions: {
    async getClusters ({ commit }, keys) {
      const response = await API.compute.getClusters()
      let result
      if (response) {
        if (keys) {
          result = response.map(cl => {
            const obj = keys.reduce((acc, key) => {
              acc[key] = cl[key]
              return acc
            }, {})
            return obj
          })
        } else {
          result = response
        }
        commit('setClusterList', result)
      }
    }
  }
}
