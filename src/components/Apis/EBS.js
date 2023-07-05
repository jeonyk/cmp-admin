import axios from 'axios'

const EBS_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws/ebs'

export default {
  getEBSList: async (payload) => {
    try {
      const response = await axios.get(
        EBS_URL, {
          params: payload
        }
      )
      return response.data
    } catch (error) {
      console.error('Get EBS Info Error : ', error)
      throw error
    }
  },
  getEBSDetail: async (volumeId) => {
    try {
      const response = await axios.get(
        EBS_URL + `/${volumeId}`
      )
      return response.data
    } catch (error) {
      console.error('Get EBS Info Error : ', error)
      throw error
    }
  }

}
