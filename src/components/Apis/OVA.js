/**
  * 파일명 : OVA.js
  * 파일 기능 : OVA 관련 API 호출 파일
  * 작성자 : 이경환
  * 최종 작성일 : 2021-12-13
  * License By Shinsegae I&C
 **/
import axios from 'axios'

const NUTANIX_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/nx'
// eslint-disable-next-line
const WORK_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/work'

export const getOVAList = (params) => {
  return axios.get(NUTANIX_URL + '/compute/central/ova', { params })
}
export const getRunningOVAList = (params) => {
  return axios.get(NUTANIX_URL + '/compute/task', { params })
}

export const exportOVA = (vmUuid, body) => {
  return axios.post(WORK_URL + `/task/ova/${vmUuid}/export/run`, body)
}

export const updateOVA = (vmUuid, body) => {
  return axios.put(NUTANIX_URL + `/compute/central/ova/${vmUuid}/info`, body)
}
export const deleteOVA = (ovaUuid, body) => {
  return axios.post(WORK_URL + `/task/ova/${ovaUuid}/delete/run`, body)
}

export const getDetailOVA = (ovaUuid) => {
  return axios.get(NUTANIX_URL + `/compute/central/ova/${ovaUuid}`)
}

export const addDescOVA = (ovaUuid, body) => {
  return axios.post(NUTANIX_URL + `/compute/central/ova/${ovaUuid}/desc`, body)
}
export const updateOVAName = (ovaUuid, body) => {
  return axios.put(NUTANIX_URL + `/compute/central/ova/${ovaUuid}/rename`, body)
}
