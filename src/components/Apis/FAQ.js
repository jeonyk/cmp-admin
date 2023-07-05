/**
  * 파일명 : FAQ.js
  * 파일 기능 : [FAQ] 관련 모든 API 모듈
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-11-06
  * License By Shinsegae I&C
  * 2020-11-06 Fix: 테스트 수정사항 반영
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getFaqList: async payload => {
    try {
      const response = await axios.get(`${config.url}/api/cmp/v1/config/support/faq`, { params: payload })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  postFaq: async (payload) => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/config/support/faq`, payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  modifyFaq: async (payload) => {
    try {
      const response = await axios.put(`${config.url}/api/cmp/v1/config/support/faq`, payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  deleteFaq: async (index) => {
    try {
      const response = await axios.delete(`${config.url}/api/cmp/v1/config/support/faq`, { params: index })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  }
}
