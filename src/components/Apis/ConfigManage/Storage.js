/**
  * 파일명 : Storage.js
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-17
  * License By Shinsegae I&C
  * 2021-01-17 fix: [구성관리-스토리지] get > params 추가
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getVolumeGroupsList: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/volumeGroups', { params: params }
        // '/api/cmp/v1/nx/compute/clusters'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getStorageContainersList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/storageContainers'
        // '/api/cmp/v1/nx/compute/clusters'
      )
      return !response.data ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
