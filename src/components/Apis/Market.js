/**
  * 파일명 : Market.js
  * 파일 기능 : [마켓플레이스] 관련 모든 API 모듈
  * 작성자 : 정재은 외 5명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 Update: 마켓플레이스 접근불가능 페이지 핸들링
 **/

import axios from 'axios'

const config = {
  // url: 'http://localhost:20001'
  url: process.env.VUE_APP_ZUUL_URL
}
// const hd = {
//   'Content-Type': 'application/json',
//   Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHcm93dGhTb2Z0IiwiYXVkIjoiYWRtaW4iLCJpYXQiOjE1OTU0ODAyMjZ9.RcMeRQl-ZDrd3uGvKQQbuAEql1-OfrEkgjL6VIG0FD0'
// }

export default {
  getBlueprints: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/market/product', {
          params: {
            os: payload?.os?.join(','),
            svc: payload?.svc?.join(','),
            pub: payload?.pub?.join(','),
            bpName: payload.bpName
          }
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getBlueprint: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/market/product/${payload}`)
      return response.data
    } catch (err) {
      return err.response.data
      // return error.response
    }
  },
  updateBlueprintPub: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/market/product/${payload.bpIdx}`, payload)
      return response
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  launchBlueprint: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/market/product/', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateBlueprintInfo: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/market/product/${payload.bpIdx}/info`, payload)
      return response
    } catch (error) {
      throw error.response.data
    }
  },
  createBlueprintDesc: async (payload) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/market/product/${payload.bpIdx}/desc`, payload.req)
      return response
    } catch (error) {
      return error.response
    }
  },
  updateBlueprintDesc: async (payload, idx) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/market/product/${idx}/desc`, payload.req)
      return response
    } catch (error) {
      return error.response
    }
  },
  // deleteBlueprintDesc: async (payload) => {
  //   try {
  //     const response = await axios.delete(
  //       config.url + `/api/cmp/v1/nx/market/product/${payload.bpIdx}/desc/${payload.bpDescIdx}`, {
  //         headers: hd
  //       })
  //     return response.data
  //   } catch (error) {
  //     return error.response
  //   }
  // },
  deleteBlueprintDescType: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/nx/market/product/${payload.bpIdx}/desc/type/${payload.descTypeIdx}`)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getProduct: async (uuid, params) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/market/product/uuid/' + uuid, { params: params })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateBlueprintPubForSwLicense: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/market/product/license/${payload.bpIdx}`, payload)
      return response
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  updateProductDescOrder: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/market/product/${payload.bpIdx}/desc/order`, payload.req)
      return response
    } catch (error) {
      return error.response
    }
  },
  getMarketDescType: async () => {
    try {
      const { data } = await axios.get(
        config.url + '/api/cmp/v1/nx/market/type'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  updateMarketTemplate: async (payload, idx) => {
    try {
      const { data } = await axios.post(
        config.url + `/api/cmp/v1/nx/market/product/${idx}/desc`,
        payload
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  updateMarketCodeType: async (payload, idx) => {
    try {
      await axios.put(
        config.url + `/api/cmp/v1/nx/market/type/${idx}`,
        payload
      )
      return true
    } catch (error) {
      throw error.response.data
    }
  },
  createMarketCodeType: async (payload) => {
    try {
      await axios.post(
        config.url + '/api/cmp/v1/nx/market/type',
        payload
      )
      return true
    } catch (error) {
      throw error.response.data
    }
  },
  deleteMarketTemplate: async (bpIdx, descTypeIdx) => {
    try {
      await axios.delete(
        config.url + `/api/cmp/v1/nx/market/product/${bpIdx}/desc/type/${descTypeIdx}`
      )
      return true
    } catch (error) {
      throw error.response.data
    }
  },
  deleteMarketCodeType: async (typeIdx) => {
    try {
      await axios.delete(
        config.url + `/api/cmp/v1/nx/market/type/${typeIdx}`
      )
      return true
    } catch (error) {
      throw error.response.data
    }
  }
}
