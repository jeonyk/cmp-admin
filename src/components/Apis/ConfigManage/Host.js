/**
  * 파일명 : Host.js
  * 파일 기능 :
  * 작성자 : 김진범
  * 최종 작성일 : 2020-12-16
  * License By Shinsegae I&C
  * 2020-12-16 권한 처리 중
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getHostList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/hosts'
        // '/api/cmp/v1/compute/nx/clusters'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getSingleHost: async (hostUuid) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/compute/hosts/${hostUuid}`
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
