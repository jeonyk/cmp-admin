import axios from 'axios'

const VMWARE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/vmware'

export default {
  getVmThreshold: async (userVmIdx) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/monitoring/threshold/vm/' + userVmIdx
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  updateVmThreshold: async (userVmIdx, payload) => {
    try {
      const response = await axios.post(
        VMWARE_URL + '/monitoring/threshold/vm/' + userVmIdx,
        payload
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
