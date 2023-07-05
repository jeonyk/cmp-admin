import axios from 'axios'

const VMWARE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/vmware'

export default {
  getVmwareHostList: async (params) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/host', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
