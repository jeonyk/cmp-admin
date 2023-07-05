// import VueCookies from 'vue-cookies'
import API from '@sd-fe/cmp-core'
// import axios from 'axios'

export default {
  namespaced: true,
  state: {
    NUTANIX: {}, // COMPUTE, STORAGE, DATABASE, MARKET, FILE_SERVER
    VMWARE: {}, // VM, VSAN_ISCSI
    NETWORK: {} // NETWORK_L4, NETWORK_L7, SECURITY,
  },
  getters: {

  },
  mutations: {
    SET_SERVICE_META_FORM (state, { csp, service, dataForm }) {
      state[csp][service] = JSON.parse(dataForm)
    }
  },
  actions: {
    // 서비스별 메타데이터 폼 조회(단건)
    async getMetaDataForm ({ dispatch }, { csp, service }) {
      if (!csp || !service) return

      try {
        const result = await API.work_v3.getMetadataForm(
          csp,
          service
        )

        dispatch('setServiceMetaForm', {
          csp,
          service,
          dataForm: result.dataForm || []
        })

        console.log('⭐️ 모듈:: ', csp)
        console.log('⭐️ 서비스:: ', service)
      } catch (error) {
        console.error('메타데이터 조회 에러: ', error)
      }
    },
    // 전체 서비스 메타데이터 폼 조회(다건)
    async getAllMetaDataForm ({ dispatch }) {
      try {
        const all = await API.work_v3.getAllMetadataForm()

        all.forEach(({ module: csp, service, dataForm = [], ...data }) => {
          dispatch('setServiceMetaForm', {
            csp,
            service,
            dataForm
          })
        })
      } catch (error) {
        console.error('메타데이터 조회 에러: ', error)
      }
    },
    setServiceMetaForm ({ commit }, payload) {
      commit('SET_SERVICE_META_FORM', payload)
    }
  }
}
