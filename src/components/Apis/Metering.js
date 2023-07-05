/**
  * 파일명 : Metering.js
  * 파일 기능 : [미터링] 관련 모든 API 모듈
  * 작성자 : 정재은 외 5명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 Update: 대시보드 > 자원현황 API endpoint 변경
 **/

import axios from 'axios'

const config = {
  // url: 'http://localhost'
  url: process.env.VUE_APP_ZUUL_URL
}

const hd = {
  'Content-Type': 'application/json'
}

export default {
  getMeteringStatus: async (params) => {
    try {
      // if (!pageNo) {
      const response = await axios.get(config.url + '/api/cmp/v1/metering/status/vms', { params: params })
      return response.data
      // } else {
      //   const response = await axios.get(config.url + '/api/cmp/v1/metering/status/vms/' + pageNo)
      //   return response.data
      // }
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  scheduleHandle: async (date, payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/metering/status/vms/schedule', payload, { headers: hd })
      return response.data
    } catch (error) {
      console.log(error)
      throw error.response.data
    }
  },
  getVcpuRate: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/metering/cpuRate')
      return response
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getMemRate: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/metering/memRate')
      return response
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getTrend: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/metering/trend')
      return response
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getTrendHour: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/metering/trend/hour')
      return response
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getSwList: async (params) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v3/metering/sw', { params })
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  insertSw: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v3/metering/sw', payload, { headers: hd })
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  updateSw: async (payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v3/metering/sw', payload, { headers: hd })
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  deleteSw: async (swIdx) => {
    try {
      const response = await axios.delete(config.url + '/api/cmp/v3/metering/sw?idx=' + swIdx, { headers: hd })
      return response.data
    } catch (error) {
      console.log(error)
      throw error.response.data
    }
  },
  getSwHistList: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/metering/sw/getSwHist/${payload}`, { headers: hd })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getAllUseSw: async (swIdx) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/metering/sw/getAllUseSw?swIdx=' + swIdx, { headers: hd })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getUsedSw: async (swIdx) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/metering/sw/getUsedSw?swIdx=' + swIdx, { headers: hd })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  updateIsAssert: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/metering/sw/updateIsAssert', payload, { headers: hd })
      // 'http://localhost' + '/api/cmp/v1/metering/sw/updateIsAssert', payload, { headers: hd })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getVmHistoryList: async (vmUuid) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/metering/status/vm/history', { params: vmUuid })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getMeteringCategory: async () => {
    try {
      const { data } = await axios.get(
        config.url + '/api/cmp/v1/metering/enum/category'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  getMeteringLicenseType: async () => {
    try {
      const { data } = await axios.get(
        config.url + '/api/cmp/v1/metering/enum/license/type'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  getScheduleStatus: async () => {
    try {
      const { data } = await axios.get(
        config.url + '/api/cmp/v1/metering/status/vms/schedule/status'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  }
}
