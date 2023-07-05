import axios from 'axios'

const VMWARE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/vmware'

export default {
  getDatastoreList: async (params) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/datastore', {
          params
        }
      )
      return response?.data || []
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getDatastorePath: async (params) => {
    try {
      const response = await axios.get(
        VMWARE_URL + '/datastore/file', {
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
