/**
  * 파일명 : ORDER.js
  * 파일 기능 : [주문] 관련 모든 API 모듈
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 보안그룹 IP할당 목록 추가 조회
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}
// const FULL_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/aws'

export default {
  getResource: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/order/basket/resource'
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  getApprovalCount: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/approval/admin/count',
        { params: params }
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  requestTask: async (payload) => {
    try {
      const response = await axios.post(
        // 'http://localhost:60051' + '/api/cmp/v1/work/task/pre/appr'
        config.url + '/api/cmp/v1/work/task/pre/appr'
        // 'http://localhost:60051' + '/api/cmp/v1/work/approval'
        , payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getAllIpRes: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/order/basket/resource/ip', { params: params }
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  getIsUseEraUserProfile: async (params) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/work/order/basket/resource/profile/${params.type}/${params.profileIdx}`
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  /**
   * 생셩 예정인 vm 의 ip 대역 반환
   */
  getUsedVipVm: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/order/basket/resource/vip/vm', { params: params }
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  createOrderBasketData: async (projectIdx, payload) => {
    try {
      console.log('payload : ', payload)
      const response = await axios.post(config.url + '/api/cmp/v1/work/order/basket/' + projectIdx, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  isExistOrderedResource: async (projectIdx, resKey, resName, workTypeList) => {
    return axios.get(config.url + `/api/cmp/v1/work/order/basket/resource/${resKey}/${resName}`, {
      params: {
        projectIdx,
        workTypeList
      }
    })
  }
}
