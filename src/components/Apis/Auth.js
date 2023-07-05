/**
  * 파일명 : Auth.js
  * 파일 기능 : [로그인/인증] 관련 모든 API 모듈
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 add: 비밀번호 찾기 페이지 추가
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL,
  // url: 'https://api-s.growthsoft.co.kr',
  // url: 'https://192.168.1.21:10021',
  // url: 'https://localhost:10021',
  authUri: '/api/cmp/v1/iam/auth'
}

export default {
  checkExistEmail: async (params) => {
    try {
      const { data } = await axios.get(config.url + config.authUri + '/check/email', { params: { ...params, isAdmin: false } })
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  getAuthGroups: async (payload) => {
    try {
      const response = await axios.get(config.url + config.authUri + '/group', { params: payload })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  login: async payload => {
    try {
      const response = await axios.post(config.url + config.authUri + '/login', payload)
      return response.data
    } catch (error) {
      console.error(error)
      return error.response.data
    }
  },
  verifyToken: async (payload) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/iam/auth/verify', { params: payload })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      return error.response.data
    }
  },
  findId: async (payload) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/iam/auth/findId', { params: payload })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  createCertNumber: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/iam/auth/certification', payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  confirmCertNumber: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/iam/auth/certification/confirm', payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  updateUserPw: async (payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/iam/auth/password/' + payload.userId + '/true', payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error.response.data
    }
  },
  updateUserPwd: async (params, payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/iam/auth/password/' + params.userId + '/' + params.isAdmin, payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error.response.data
    }
  }
}
