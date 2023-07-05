/** @type {import('vuex').Module} */
import API from '@sd-fe/cmp-core'
const CloudStore = {
  namespaced: true,
  state: () => ({
    isRenderCloudSwitch: true,
    cloudType: '', // private, public
    cloud: '', // nutanix, vmware, aws, gcp, ...
    shortlyCloud: '', // nx, vmw, aws, gcp, ...
    moduleInfo: {
      nutanix: {
        label: 'nutanix', // labemoduleInfol 소문자
        displayLabel: 'Nutanix', // 보여지는 label
        moduleType: 'NX',
        shortlyLabel: 'nx', // label 축약
        type: 'private', // public or private,
        images: ['nutanix.png'],
        serviceResources: [
          { label: 'Compute', id: 'COMPUTE', isUsedTag: true },
          { label: 'Storage', id: 'STORAGE', isUsedTag: true },
          { label: 'Database', id: 'DATABASE', isUsedTag: true },
          { label: 'NAS (Files)', id: 'FILE_SERVER', isUsedTag: true },
          { label: 'VM 템플릿', id: 'OVA' }, // VM 템플릿
          { label: '마켓플레이스', id: 'MARKET' }
        ]
      },
      vmware: {
        label: 'vmware',
        displayLabel: 'VMware',
        moduleType: 'VMWARE',
        shortlyLabel: 'vmw',
        type: 'private',
        images: ['vmware.png'],
        serviceResources: [
          { label: 'VM', id: 'VM', isUsedTag: true },
          { label: 'Storage(vSAN ISCSI)', id: 'VSAN_ISCSI', isUsedTag: true }
        ]
      },
      network: {
        label: 'network',
        displayLabel: 'Network', // 보여지는 label
        moduleType: 'NETWORK',
        shortlyLabel: 'nw', // label 축약
        type: 'private', // public or private,
        images: ['vmware.png'],
        serviceResources: [
          { label: 'L4', id: 'NETWORK_L4', isUsedTag: true },
          { label: 'L7', id: 'NETWORK_L7', isUsedTag: true },
          { label: 'Security', id: 'SECURITY', isUsedTag: true }
        ]
      },
      aws: {
        label: 'aws',
        displayLabel: 'AWS',
        shortlyLabel: 'aws',
        moduleType: 'AWS',
        type: 'public',
        images: ['aws-white.png', 'aws-black.png'],
        serviceResources: [
          { label: 'EC2', id: 'EC2', isUsedTag: true },
          { label: 'EBS', id: 'EBS', isUsedTag: false },
          { label: 'EFS', id: 'EFS', isUsedTag: true },
          { label: '보안그룹', id: 'SG', isUsedTag: true },
          { label: 'L4', id: 'NLB_L4', isUsedTag: true },
          { label: '대상그룹', id: 'TARGET_GROUP', isUsedTag: true },
          { label: 'Transit Gateway', id: 'TRANSIT_GATEWAY', isUsedTag: false }
        ]
      }
    }
  }),
  getters: {
    getCloudType (state) {
      return state.cloudType
    },
    getCloud (state) {
      return state.cloud
    },
    getShortlyCloud (state) {
      return state.shortlyCloud
    },
    getModuleInfo (state) {
      return state.moduleInfo
    },
    getPublicClouds (state) {
      return Object.values(state.moduleInfo).filter((el) => el.type === 'public')
    },
    getPrivateClouds (state) {
      return Object.values(state.moduleInfo).filter((el) => el.type === 'private')
    },
    getResourcesToCloud (state) {
      return Object.values(state.moduleInfo).find((el) => el.label === state.cloud).serviceResources
    },
    getResourcesUsedTagToCloud (state) {
      return Object.values(state.moduleInfo).find((el) => el.label === state.cloud).serviceResources.filter(el => el.isUsedTag)
    },
    getIsRenderCloudSwitch (state) {
      return state.isRenderCloudSwitch
    },
    getModuleType (state) {
      return {
        nutanix: 'NX',
        vmware: 'VMWARE',
        aws: 'AWS'
      }[state.cloud]
    }
  },
  mutations: {
    SET_CLOUD_TYPE (state, cloudType) {
      state.cloudType = cloudType
    },
    SET_CLOUD (state, cloud) {
      state.cloud = cloud
    },
    SET_SHORTLY_CLOUD (state, shortlyCloud) {
      state.shortlyCloud = shortlyCloud
    },
    SET_IS_RENDER_CLOUD_SWITCH (state, bool) {
      state.isRenderCloudSwitch = bool
    },
    SET_MODULE_INFO (state, verServiceList) {
      function removeInvalidServiceResources (objA, arrB) {
        const temp = { ...objA }
        for (const module in temp) {
          const serviceResources = temp[module].serviceResources
          temp[module].serviceResources = serviceResources.filter((resource) => {
            return arrB.some((item) => {
              return item.module.toLowerCase() === module && item.service === resource.id
            })
          })

          if (!temp[module].serviceResources.length) {
            delete temp[module]
          }
          state.moduleInfo = temp
        }
      }
      removeInvalidServiceResources(state.moduleInfo, verServiceList)
    }
  },
  actions: {
    // 클라우드 선택 변경
    changeCloud ({ commit, state }, { cloudType, cloud, shortlyCloud }) {
      // if (cloud === 'aws' || cloudType === 'public') return
      commit('SET_CLOUD_TYPE', cloudType || state.cloudType)
      commit('SET_CLOUD', cloud || state.cloud)
      commit('SET_SHORTLY_CLOUD', shortlyCloud || state.shortlyCloud)
    },
    // 최초 클라우드 선택 세팅
    initCloud ({ commit, state }) {
      commit('SET_CLOUD_TYPE', state.moduleInfo.nutanix.type)
      commit('SET_CLOUD', state.moduleInfo.nutanix.label)
      commit('SET_SHORTLY_CLOUD', state.moduleInfo.nutanix.shortlyLabel)
    },
    getServiceByCloud ({ commit, state }) {
      API.work_v3.getVersionServiceList().then((data) => {
        commit('SET_MODULE_INFO', data)
      })
    }
  }
}

export default CloudStore
