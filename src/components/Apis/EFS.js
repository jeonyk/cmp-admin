import axios from 'axios'

const EFS_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/efs'

export default {
  getEFSList: async (payload) => {
    try {
      const response = await axios.get(
        EFS_URL, {
          params: payload
        }
      )
      return response.data
    } catch (error) {
      console.error('Get EFS List Error : ', error)
      throw error
    }
  },
  getEFSDetail: async (fileSystemId) => {
    try {
      const response = await axios.get(
        EFS_URL + `/${fileSystemId}`
      )
      return response.data
    } catch (error) {
      console.error('Get EFS Info Error : ', error)
      throw error
    }
  }
}
