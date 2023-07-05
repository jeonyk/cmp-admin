import axios from 'axios'

const ENUM_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/nx/enum'

export default {
  getOsTypes: async (params) => {
    try {
      const response = await axios.get(
        ENUM_URL + '/os-type '
        , { params: params }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getOsTypeGroup: async (params) => {
    try {
      const response = await axios.get(
        ENUM_URL + '/os-type/group '
        , { params: params }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }

}
