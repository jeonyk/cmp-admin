/**
  * 파일명 : Notice.js
  * 파일 기능 : [공지사항] 관련 모든 API 모듈
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 Update: 어드민관리 차단 페이지 추가
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getNoticeInfo: async payload => {
    try {
      const response = await axios.get(`${config.url}/api/cmp/v1/config/notice`, { params: payload })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  postNotice: async (payload) => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/config/notice`, payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  modifyNotice: async (payload) => {
    try {
      const response = await axios.put(`${config.url}/api/cmp/v1/config/notice`, payload)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  deleteNotice: async (index) => {
    try {
      const response = await axios.delete(`${config.url}/api/cmp/v1/config/notice`, { params: index })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  }
}
