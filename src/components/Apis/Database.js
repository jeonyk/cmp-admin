/**
  * 파일명 : Database.js
  * 파일 기능 : [Database] 관련 모든 API 모듈
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2020-12-02
  * License By Shinsegae I&C
  * 2020-12-02 Add: database 중간저장
 **/

import axios from 'axios'

const config = {
  // url: 'http://localhost:20021'
  url: process.env.VUE_APP_ZUUL_URL
}
// const hd = {
//   'Content-Type': 'application/json',
//   Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHcm93dGhTb2Z0IiwiYXVkIjoiYWRtaW4iLCJpYXQiOjE1OTU0ODAyMjZ9.RcMeRQl-ZDrd3uGvKQQbuAEql1-OfrEkgjL6VIG0FD0'
// }

export default {
  /**
   * 어드민 관리 > 환경설정 > 뉴타닉스 설정(Era)
   * EraController
   */
  getEraConfigs: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/era')
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getEraConfig: async (eraIdx, payload = {}) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/database/era/otp/${eraIdx}`, payload)
      if (response.data === null || !response.data.isOtpAuth) {
        throw new Error()
      }
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  },
  createEraConfig: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/database/era', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateEraConfig: async (payload) => {
    console.log('## updateEraConfig > payload : ', payload)
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/database/era/${payload.eraIdx}`, payload.req)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteEraConfig: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/nx/database/era/${payload}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  connectionTest: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/database/era/test', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  syncEraData: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/era/${payload}/sync`)
      return response
    } catch (error) {
      return error.response
    }
  },

  /**
   * 자원 > Database > Profile
   * ProfileController
   */
  getProfiles: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/profile', { params: payload })
      return response
    } catch (error) {
      return error.response
    }
  },
  getProfilesByCluster: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/profile/era/${payload}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getProfile: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/profile/${payload}/versions`)
      return response
    } catch (error) {
      return error.response
    }
  },
  getVersion: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/profile/${payload}`)
      return response
    } catch (error) {
      return error.response
    }
  },
  getUserProfiles: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/profile/user')
      return response
    } catch (error) {
      return error.response
    }
  },
  getUserProfile: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/profile/user/${payload}`)
      return response
    } catch (error) {
      return error.response
    }
  },
  createUserProfile: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/database/profile/user', payload)
      return response
    } catch (error) {
      return error.response
    }
  },
  updateUserProfile: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/database/profile/user/${payload.userProfIdx}`, payload.req)
      return response
    } catch (error) {
      return error.response
    }
  },
  deleteUserProfile: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/nx/database/profile/user/${payload}`)
      return response
    } catch (error) {
      return error.response
    }
  },
  getUserProfilePopUp: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/profile/user/${payload.userProfIdx}/info`)
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  /**
   * 자원 > Database
   * DatabaseController
   */
  getDatabases: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/db')
      return response
    } catch (error) {
      return error.response
    }
  },
  getDatabasesSimple: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/db/simple', {
          params: payload
        })
      return response.data === null ? {} : response.data
    } catch (error) {
      return error.response
    }
  },
  getDatabase: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/database/db/${payload}`)
      return response
    } catch (error) {
      return error.response
    }
  },
  provisionNewDatabase: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/database/db', payload)
      return response
    } catch (error) {
      return error.response
    }
  },
  deleteDatabase: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/nx/database/db/${payload}`)
      return response
    } catch (error) {
      return error.response
    }
  },
  transferDatabase: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/database/db/pid/${payload.projectIdx}`, payload.req)
      return response
    } catch (error) {
      return error.response
    }
  },
  getEraClusters: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/cluster')
      return response === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getUnregistersDatabase: async (payload) => { // 미등록 DB 조회
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/db/unregister')
      return response.data
    } catch (error) {
      throw error.response
    }
  },

  getEngineType: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/database/db/engine', {
          params: payload
        })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error.response)
      throw error
    }
  },
  checkDatabaseName: async (name) => {
    return axios.get(config.url + '/api/cmp/v1/nx/database/db/unique', {
      params: { databaseName: name }
    })
  }
}
