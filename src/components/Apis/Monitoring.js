import axios from 'axios'
// import Store from '../../store/'

const MONITORING_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/monitoring'

// const userId = Store.state.auth.user?.userId
// const userName = Store.state.auth.user?.userName

export default {
  getElasticsearchLog: async (payload) => { // 엘라스틱 서치 로그 조회
    try {
      const response = await axios.post(
        MONITORING_URL + '/logging/elasticsearch'
        , payload
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  loggingConnectTest: async (payload) => { // 로깅 서버 연결 테스트
    try {
      const response = await axios.post(
        MONITORING_URL + '/logging/server/connect/test'
        , payload
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Test Error : ', error)
      throw error
    }
  },

  // 로깅 서버
  getLoggingServerList: async (params) => {
    try {
      const response = await axios.get(
        MONITORING_URL + '/logging/server '
        , { params: params }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  createLoggingServer: async (payload, loggingType) => {
    try {
      const response = await axios.post(
        MONITORING_URL + `/logging/server/${loggingType}`, payload
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateLoggingServer: async (payload, loggingType) => {
    try {
      const response = await axios.put(MONITORING_URL + `/logging/server/${loggingType}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteLoggingServer: async (payload, loggingType) => {
    try {
      const response = await axios.delete(MONITORING_URL + `/logging/server/${loggingType}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getCertLoggingServerList: async (payload = {}) => {
    try {
      const { data } = await axios.post(
        MONITORING_URL + '/logging/server/cert', payload
      )
      return data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  }

}
