/**
  * 파일명 : Vms.js
  * 파일 기능 :
  * 작성자 : 김진범
  * 최종 작성일 : 2020-10-22
  * License By Shinsegae I&C
  * 2020-10-22 네트워크 카테고리 작업 중
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getVmList: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/vms'
        // '/api/cmp/v1/nx/compute/clusters'
        , { params: params }
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getVm: async (userVmIdx, params, source) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/vms/' + userVmIdx,
        { params: params, cancelToken: source?.token }
        // '/api/cmp/v1/nx/compute/clusters'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Request canceled', error.message)
      } else {
        console.error('Error : ', error)
        throw error
      }
    }
  }
}
