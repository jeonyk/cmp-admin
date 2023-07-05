/**
  * 파일명 : Alarm.js
  * 파일 기능 : [알람] 관련 모든 API 모듈
  * 작성자 : cdj0927
  * 최종 작성일 : 2020-10-20
  * License By Shinsegae I&C
  * 2020-10-20 네트워크, 스위치, VDOM, 알람 서버 화면 기능 추가
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  // 알람 정보 관리 - 시작
  // OTP 인증 후 알람 서버 데이터 가져오기
  getAlarmInfoCert: async (payload, alarmType) => {
    try {
      const { data } = await axios.post(config.url + `/api/cmp/v1/alarm/info/${alarmType}`, payload)
      return data
    } catch (error) {
      console.log(error)
      throw new Error(error)
    }
  },
  getAlarmInfo: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/alarm/info'
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  createAlarmInfo: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/alarm/info', payload)
      return response
    } catch (error) {
      const errorCode = error.response?.data?.code
      if (errorCode) {
        console.error(error)
        return { errorCode }
      }
      return console.error(error)
    }
  },
  updateAlarmInfo: async (alarmType, payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/alarm/info/${alarmType}`, payload)
      return response.data
    } catch (error) {
      const errorCode = error.response?.data?.code
      if (errorCode) {
        console.error(error)
        return { errorCode }
      }
      return console.error(error)
    }
  },
  deleteAlarmInfo: async (alarmType) => {
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/alarm/info/${alarmType}`)
      return response
    } catch (error) {
      console.error(error)
    }
  },
  send: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/alarm/send', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  }
  // 알람 정보 관리 - 종료
}
