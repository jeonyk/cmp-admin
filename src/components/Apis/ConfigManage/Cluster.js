/**
  * 파일명 : Cluster.js
  * 파일 기능 :
  * 작성자 : 김진범
  * 최종 작성일 : 2020-10-12
  * License By Shinsegae I&C
  * 2020-10-12 구성관리-자원풀관리
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getClusterList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/clusters'
        // '/api/cmp/v1/compute/nx/clusters'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
