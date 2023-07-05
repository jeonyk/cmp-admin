/**
  * 파일명 : NetworkCategory.js
  * 파일 기능 : [네트워크 카테고리] 관련 모든 API 모듈
  * 작성자 : 김예담
  * 최종 작성일 : 2020-10-22
  * License By Shinsegae I&C
  * 2020-10-22 네트워크 카테고리 작업 중
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  // 네트워크 카테고리 관리
  getNetworkCategoryTree: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/config/network/category/tree'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  createNetworkCategory: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/config/network/category', payload
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  updateNetworkCategory: async (cateIdx, payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/config/network/category/${cateIdx}`, payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  deleteNetworkCategory: async (cateIdx) => {
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/config/network/category/${cateIdx}`)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  }
  // 네트워크 카테고리 관리
}
