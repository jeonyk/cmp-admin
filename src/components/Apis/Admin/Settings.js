/**
  * 파일명 : Settings.js
  * 파일 기능 :
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-23
  * License By Shinsegae I&C
  * 2021-02-23 Update: 파일업로드 기능 완료
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  // TODO 나중에 변경 된다
  getNetworkCategoryTree: async () => {
    try {
      const headers = {}
      headers.Authorization = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHcm93dGhTb2Z0IiwiYXVkIjoiYWRtaW4iLCJpYXQiOjE1OTU0ODAyMjZ9.RcMeRQl-ZDrd3uGvKQQbuAEql1-OfrEkgjL6VIG0FD0'
      const response = await axios.get(
        // '/api/cmp/v1/config/network/category/tree'
        config.url + '/api/cmp/v1/config/network/category/tree', null, { headers }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getCentralList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/central'
        // '/api/cmp/v1/nx/compute/central'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getCentralConfig: async (centralIdx, payload = {}) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/compute/central/otp/${centralIdx}`, payload
      )
      if (response.data === null || !response.data.isOtpAuth) {
        throw new Error()
      }
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  },
  createCentral: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/central'
        // '/api/cmp/v1/nx/compute/central'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  connectionTestCentral: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/central/test', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateCentral: async (centralIdx, payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/nx/compute/central/' + centralIdx
        // '/api/cmp/v1/nx/compute/central/' + centralIdx
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteCentral: async (centralIdx, payload) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/nx/compute/central/' + centralIdx
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getElementList: async (params) => {
    try {
      const response = await axios.get(
        // config.url + '/api/cmp/v1/compute/nx/element', { params: params }
        config.url + '/api/cmp/v1/nx/compute/element', { params: params }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getElementConfig: async (elementIdx, payload = {}) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/compute/element/otp/${elementIdx}`, payload
      )
      if (response.data === null || !response.data.isOtpAuth) {
        throw new Error()
      }
      return response.data
    } catch (error) {
      throw new Error(error)
    }
  },
  connectionTestElement: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/element/test'
        // '/api/cmp/v1/nx/compute/element/test'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  syncElement: async (elementIdx) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/element/' + elementIdx + '/sync'
        // '/api/cmp/v1/nx/compute/element/test'
        , {})
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  syncCentral: async (centralIdx) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/central/' + centralIdx + '/sync'
        // '/api/cmp/v1/nx/compute/element/test'
        , {})
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  createElement: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/element'
        // '/api/cmp/v1/nx/compute/element'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateElement: async (elementIdx, payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/nx/compute/element/' + elementIdx
        // '/api/cmp/v1/nx/compute/element/' + elementIdx
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteElement: async (elementIdx) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/nx/compute/element/' + elementIdx
        // '/api/cmp/v1/nx/compute/element/' + elementIdx
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getCentralImageList: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/central/images'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  createCmpImageMeta: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/central/images'
        , payload
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  createCmpFile: async (payload, userImageIdx) => {
    try {
      const response = await axios.post(
        config.url + '/zuul/api/cmp/v1/nx/compute/central/images/upload?userImageIdx=' + userImageIdx, payload, { // 대용량 파일 업로드 시 url 앞에 /zuul/ 추가
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  createNxImageMeta: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/central/images/remote'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateCmpImageMeta: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/nx/compute/central/images/' + payload.userImageIdx
        , payload
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteCentralImage: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/nx/compute/central/images/' + payload.userImageIdx
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getApprovalSetting: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/approval/settings'
      )
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateApprovalSetting: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/work/approval/settings'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }

    // try {
    //   const response = await axios.put(
    //     config.url + '/api/cmp/v1/work/approval/settings'
    //     , payload
    //   )
    //   // const response = await axios.put(
    //   //   config.url + '/api/cmp/v1/work/approval/settings'
    //   //   , payload
    //   // )
    //   return response.data
    // } catch (error) {
    //   console.error(error)
    //   throw error
    // }
  }
}
