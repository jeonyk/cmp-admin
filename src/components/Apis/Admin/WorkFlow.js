/**
  * 파일명 : WorkFlow.js
  * 파일 기능 :
  * 작성자 : 전경열
  * 최종 작성일 : 2020-11-23
  * License By Shinsegae I&C
  * 2020-11-23 워크 플로우 수정
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
  // url: 'http://localhost:10021'
}

export default {
  getWorkFlowCheckList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/flow/check'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  upsertWorkFlowCheckList: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/flow/check', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteWorkFlowCheck: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/work/flow/check/' + payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getWorkFlowTaskList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/flow/task'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getWorkFlow: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/flow', { params: payload }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  createWorkFlow: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/flow', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
