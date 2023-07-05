/**
  * 파일명 : Work.js
  * 파일 기능 : [Work] 관련 API 모듈
  * 작성자 : 김예담
  * 최종 작성일 : 2021-11-05
  * License By Shinsegae I&C
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL,
  workUrl: '/api/cmp/v1/work'
}

export default {
  getItsm: async () => { // itsm 설정 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/task/itsm/setting`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateItsm: async payload => { // itsm 설정 저장
    try {
      const response = await axios.post(`${config.url}${config.workUrl}/task/itsm/setting`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteItsm: async param => { // itsm 설정 삭제
    try {
      const response = await axios.delete(`${config.url}${config.workUrl}/task/itsm/setting/${param}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getTransBasket: async (userId) => { // 이관 장바구니 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/transfer/${userId}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getTransBasketOtherUser: async (userId) => { // 타 최고 관리자 계정의 이관 장바구니 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/transfer/${userId}/ne`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getTransBasketCount: async (userId) => { // 이관 장바구니 count 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/transfer/${userId}/count`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getTransBasketHistory: async (userId) => { // 이관 장바구니 히스토리 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/transfer/${userId}/history`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateTransBasket: async (userId, payload) => { // 이관 장바구니 수정
    try {
      const response = await axios.put(`${config.url}${config.workUrl}/transfer/${userId}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteTransBasket: async (userId, params) => { // 이관 장바구니에서 자원을 삭제합니다.
    try {
      const response = await axios.delete(`${config.url}${config.workUrl}/transfer/${userId}`, { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // 이관 장바구니에 자원 저장
  saveTransResource: async (userId, field, payload) => { // 이관 장바구니 저장 (VM)
    try {
      const response = await axios.post(`${config.url}${config.workUrl}/transfer/${userId}/${field}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  runTransResource: async (userId, payload) => { // 이관 실행
    try {
      const response = await axios.post(`${config.url}${config.workUrl}/transfer/${userId}/run`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getExcelList: async (param) => { // 미등록 Excel 파일 리스트 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/transfer/excel/${param.userId}/${param.workType}`)
      return response.data
    } catch (error) {
      return error.response.data
    }
  },
  getExcelColumns: async (param) => { // 미등록 Excel 컬럼 정보 조회
    try {
      const response = await axios.get(`${config.url}${config.workUrl}/transfer/excel/column/${param}`)
      return response.data
    } catch (error) {
      return error.response.data
    }
  },
  uploadUnregistExcelFile: async (file, param) => { // 미등록 Excel 파일 업로드
    try {
      const response = await axios.post(`${config.url}${config.workUrl}/transfer/excel/upload/${param.userId}/${param.workType}`, file, { headers: { 'Content-Type': 'multipart/form-data' } })
      return response.data
    } catch (error) {
      return error.response.data
    }
  },
  excuteExcelVm: async (fileIdx) => { // 미등록 Excel - 작업 실행
    try {
      const response = await axios.post(`${config.url}${config.workUrl}/transfer/excel/run/${fileIdx}`)
      return response.data
    } catch (error) {
      return error.response.data
    }
  },

  // ================
  // ================
  // ===== AWS ======
  // ================
  // ================

  checkKey: async payload => { // [사전협의 > AWS 프로젝트 생성시] 프로젝트 키 확인
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/aws/project/check-key`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  saveKey: async payload => { // [사전협의 > AWS 프로젝트 생성시] 프로젝트 키 저장
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/work/task/pre/data`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
