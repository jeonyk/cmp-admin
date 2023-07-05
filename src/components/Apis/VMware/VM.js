import axios from 'axios'

const VMWARE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/vmware'

export default {
  getVmwareVmList: async (params) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/vm', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getVmwareHostnameList: async (params) => { // vm 호스트 명 조회 API
    try {
      const response = await axios.get(
        VMWARE_URL + '/vm/host-name', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getVmwareRunningVmList: async (params) => { // 작업 중인 자원 조회 => 사용하지 않음 (22.09.16)
    try {
      const response = await axios.get(
        VMWARE_URL + '/request', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getVmwareVmDetail: async (userVmIdx, source) => {
    try {
      const response = await axios.get(
        VMWARE_URL + `/vm/${userVmIdx}`,
        { cancelToken: source?.token }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  createVmwareVm: async (payload) => {
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/create',
        payload
      )
      return response?.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVmwareGuestOSList: async (params) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/vm/create/guest-os', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  updateVmwareVm: async (payload) => {
    try {
      const response = await axios.put(
        VMWARE_URL + '/vm/update',
        payload
      )
      return response?.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  forceDeleteVmwareVm: async (payload) => { // 강제 삭제
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/delete', payload)
      return response?.data
    } catch (error) {
      console.error(error?.response)
      throw error
    }
  },

  // 이관, 복제
  migrateVmwareVm: async (payload) => {
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/migrate', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  cloneVmwareVm: async (userVmIdx, payload) => {
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/clone/list', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },

  // VM Power ON/OFF
  powerOffVm: async (payload) => { // off (다건)
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/power/off/list', payload)
      return response?.data
    } catch (error) {
      console.error(error.response)
      throw error
    }
  },
  powerOnVm: async (payload) => { // on (다건)
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/power/on/list', payload)
      return response?.data
    } catch (error) {
      console.error(error.response)
      throw error
    }
  },
  powerRebootGuestVm: async (payload) => { // powerState
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/power/reboot-guest', payload)
      return response?.data
    } catch (error) {
      console.error(error.response)
      throw error
    }
  },

  // 호스트
  getSingleHostList: async (params) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/host/single-connect', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  // 모니터링 차트
  getPerfCounter: async (params) => { // [1시간 이내] 모니터링 차트 노출 항목 조회
    try {
      const response = await axios.get(
        VMWARE_URL + '/perf-counter', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getPerfInterval: async (params) => { // [1시간 이후] 모니터링 차트 노출 인터벌, 항목 조회
    try {
      const response = await axios.get(
        VMWARE_URL + '/perf-interval', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getVmStats: async (payload) => { // 모니터링 차트 타점을 조회합니다.
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/stats',
        payload
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
