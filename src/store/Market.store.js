/**
  * 파일명 : Market.store.js
  * 파일 기능 :
  * 작성자 : 이성수 외 1명
  * 최종 작성일 : 2020-10-31
  * License By Shinsegae I&C
  * 2020-10-31 change : alert => this.$alert
 **/

// import VueCookies from 'vue-cookies'
import API from '@sd-fe/cmp-core'
import i18n from '@/i18n'

export default {
  state: {
    blueprints: [],
    blueprint: {}
  },
  getters: {
    blueprints: state => {
      return state.blueprints
    },
    blueprint: state => {
      return state.blueprint
    }
  },
  actions: {
    async getBlueprint (context, payload) {
      await API.market.getBlueprint(payload.bpIdx).then((res) => {
        context.commit('setBluprint', res)
      })
    },
    async createBlueprintDesc ({ commit, dispatch, context }, payload) {
      console.log('@store createBlueprintDesc : payload : ', payload)
      const response = await API.market.createBlueprintDesc(payload)
      if (response.status === 200) {
        if (response.data) {
          this.$alert(i18n.t('common.ALERT.SERVICE.011', { name: payload.displayName }))
          dispatch('getBlueprint', payload)
        } else {
          this.$alert(i18n.t('common.ALERT.SERVICE.009', { name: payload.displayName }))
        }
      } else {
        this.$alert(response.data.message)
      }
    },
    async updateBlueprintDesc ({ commit, dispatch, context }, payload) {
      console.log('@store updateBlueprintDesc : payload : ', payload)
      const res = await API.market.updateBlueprintDesc(payload)
      if (res.status === 200) {
        if (res.data) {
          this.$alert(i18n.t('common.ALERT.SERVICE.009', { name: payload.displayName }))
          dispatch('getBlueprint', payload)
        } else {
          this.$alert(i18n.t('common.ALERT.SERVICE.008', { name: payload.displayName }))
        }
      } else {
        this.$alert(res.data.message)
      }
    },
    async updateBlueprintPub ({ commit, dispatch, context }, payload) {
      console.log('@store updateBlueprintDesc : payload : ', payload)
      const response = await API.market.updateBlueprintPub(payload)
      if (response.status === 200) {
        if (response.data) {
          dispatch('getBlueprint', payload)
        } else {
          this.$alert(i18n.t('common.ALERT.SERVICE.016'))
        }
      } else {
        this.$alert(response.data.message)
      }
    }
  },
  mutations: {
    setBluprint (state, payload) { //  detail용
      const result = { ...payload }
      const versionInfoList = result.bpDescriptions.filter(desc => desc.descKey === 'CMP_PG_VERSION')
      const iconList = result.bpDescriptions.filter(desc => desc.descKey === 'ICON_IMAGE')
      const categoryList = result.bpDescriptions.filter(desc => desc.descType === 'CATEGORY')
      const summaryList = result.bpDescriptions.filter(desc => desc.descType === 'SUMMARY')
      result.version = versionInfoList.length > 0 ? versionInfoList[0] : null
      result.iconImage = iconList.length > 0 ? iconList[0] : null
      result.category = categoryList.length > 0 ? categoryList[0] : null
      result.summary = summaryList.length > 0 ? summaryList[0] : null
      // if (result.category) this.selectedCate = result.category.descValue
      // if (result.summary) this.mpTempDesc = result.summary.descValue
      if (result.bpImg && result.bpImg.osName) result.osInfo = `${result.bpImg?.osType} ${result.bpImg?.osName} ${result.bpImg?.osBit}`
      if (result.version) result.versionInfo = result.version.descValue
      console.log('@store setBluprint : result : ', result)
      state.blueprint = result
    }
  }
}
