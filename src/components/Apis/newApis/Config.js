/**
  * 파일명 : Config.js
  * 파일 기능 : [Config] 관련 모든 API 모듈
  * 작성자 : 정재은 외 4명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 Update: 어드민관리 차단 페이지 추가
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL,
  // url: 'https://api-s.growthsoft.co.kr',
  // url: 'https://192.168.1.21:10021',
  // url: 'https://localhost:20171',
  configUri: '/api/cmp/v1/config'
}

export default {
  config: {
    /* ------------------------------ SECTION 인사조직 스케줄링 API ----------------------------- */
    // POST) 스케줄링 시간 설정
    setScheduler: async (payload) => {
      return await axios.post(config.url + config.configUri + '/scheduler', payload)
    },
    // GET) 스케줄링 시간 리스트 조회
    getSchedulerList: async () => {
      return axios.get(config.url + config.configUri + '/scheduler/list')
    },
    // PUT) 스케줄링 시간 업데이트
    updateScheduler: async (idx, payload) => {
      return axios.put(config.url + config.configUri + `/scheduler/${idx}`, payload)
    },
    // DELETE) 스케줄링 삭제
    deleteScheduler: async (idx) => {
      return axios.delete(config.url + config.configUri + `/scheduler/${idx}`)
    },

    // PUT) 스케줄링 ON/OFF 기능 추가
    updateActiveScheduler: async (idx, isActive) => {
      return axios.put(config.url + config.configUri + `/scheduler/${idx}`,
        {
          params: { isActive }
        })
    }
    /* -------------------------------- !SECTION -------------------------------- */
  }

}
