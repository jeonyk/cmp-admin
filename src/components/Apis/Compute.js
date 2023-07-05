/**
  * 파일명 : Compute.js
  * 파일 기능 : [Compute] 관련 모든 API 모듈
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-17
  * License By Shinsegae I&C
  * 2021-02-17 fix: [자원이관 - Compute] - 선택 이미지 세팅 API 변경, External Disk 노출되지 않던 버그 픽스
 **/

import axios from 'axios'
import qs from 'qs'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}
const hd = {
  'Content-Type': 'application/json'
  // Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHcm93dGhTb2Z0IiwiYXVkIjoiYWRtaW4iLCJpYXQiOjE1OTU0ODAyMjZ9.RcMeRQl-ZDrd3uGvKQQbuAEql1-OfrEkgjL6VIG0FD0'
  // 'Access-Control-Allow-Origin': '*'
  // 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE, PUT'
  // 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  // 'Access-Control-Allow-Headers': 'Origin, Accept, X-Requested-With, Content-Type, Access-Control - Request-Method, Access-Control-Request-Headers, Authorization',
  // 'Access-Control-Allow-Credentials': 'true'
}

const paramsSerializer = (params) => {
  return qs.stringify(params, { arrayFormat: 'repeat' })
}

export default {
  getClusters: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/clusters', {
        // config.url + '/api/cmp/v1/nx/compute/clusters', {
          headers: hd
        })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getHosts: async (uuid) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/hosts`, {
        // config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/hosts`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },

  getStorageContainer: async (uuid) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/storage_containers`, {
        // config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/storage_containers`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateStorageContainer: async (params = {}) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/compute/clusters/${params.elementIdx}/storage_containers`, {
          // config.url + `/api/cmp/v1/nx/compute/clusters/${params.elementIdx}/storage_containers`, {
          storageContainerUuid: params.scUuid
        }, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateComputeOnlyIsSwTest: async (params = {}) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/nx/compute/vms/update/${params.userVmIdx}/isSwTest`, {
          isSwTest: params.isSwTest, updateUserId: params.updateUserId, updateUserName: params.updateUserName
        }, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  getNetwork: async (uuid) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/subnets`, {
        // config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/subnets`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getImages: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/central/images', { params })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getImage: async (userImageIdx) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/central/images/' + userImageIdx)
      return response.data === null ? null : response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVms: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/vms', {
        // config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/images`, {
          headers: hd,
          params: params
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getVmsName: async (params) => { // vm 이름만 조회
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/common/all/hostname', {
          params: params
        })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // //미등록 vms Excel
  getVmsExcelList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/vms/register/exl', {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  excuteExcelVm: async (userExlIdx) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/compute/vms/register/exl/exec?userExlIdx=${userExlIdx}`
      )
      return response
    } catch (error) {
      return error.response
    }
  },
  uploadExcelVm: async (file) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/vms/register/exl/upload', file)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  /// /

  getUnregistersVms: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/vms/unregister', {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },

  getUnregistersVolumeGroups: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/volumeGroups/unregister', {
        // config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/images`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getVolumeGroups: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/volumeGroups', {
        // config.url + `/api/cmp/v1/nx/compute/clusters/${uuid}/images`, {
          headers: hd,
          params: params
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getVolumeGroupDetail: async (userVgIdx, params, source) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/volumeGroups/' + userVgIdx, { params: params, cancelToken: source?.token })
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  createCluster: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/vms', payload, {
        // config.url + '/api/cmp/v1/nx/compute/vms', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  connectCluster: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/api/cmp/v1/nx/compute/connect', payload, {
        // config.url + '/api/cmp/v1/nx/compute/connect', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  regusterVm: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/vms/register', payload, {
        // config.url + '/api/cmp/v1/nx/compute/connect', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response
      // return error.response
    }
  },
  regiterNetworkCategory: async (payload) => {
    try {
      const response = await axios.post(
        // config.url + '/api/cmp/v1/nx/compute/vms/register'
        config.url + '/api/cmp/v1/nx/compute/networkCategory'
        , payload, { headers: hd })
      return response.data

      // const response = await axios.post(
      //   config.url + '/api/cmp/v1/nx/compute/vms/register', payload)
      // return response.data
    } catch (error) {
      return error.response
    }
  },
  registerVm: async (payload) => {
    try {
      const response = await axios.post(
        // config.url + '/api/cmp/v1/nx/compute/vms/register'
        config.url + '/api/cmp/v1/nx/compute/vms/register'
        , payload)
      return response.data

      // const response = await axios.post(
      //   config.url + '/api/cmp/v1/nx/compute/vms/register', payload)
      // return response.data
    } catch (error) {
      return error.response
    }
  },
  registerVolumnGroup: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/volumeGroups/register'

        , payload)
      return response.data

      // const response = await axios.post(
      //   config.url + '/api/cmp/v1/nx/compute/vms/register', payload)
      // return response.data
    } catch (error) {
      return error.response
    }
  },
  getRackData: async (paryload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/element/rack', {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getElementData: async (paryload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/element', {
        // config.url + '/api/cmp/v1/compute/nx/element', {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  saveClusterData: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/nx/compute/element/rack', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getVmConsole: async (vmUuid, params) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/nx/compute/vms/console/${vmUuid}`, {
          params: params
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },

  // ==========
  // ---- Alert
  // ==========

  getAlertCnt: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/alert/nutanix/alertCnt', { params })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  getAlertCluster: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/nx/compute/alert/nutanix/cluster', { params, paramsSerializer })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateAlertToAcknowledge: async ({ clusterUuid, alertId }, payload) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/compute/alert/nutanix/cluster/acknowledged/${clusterUuid}/${alertId}`, payload)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateAckToRsv: async ({ clusterUuid, alertId }, payload) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/nx/compute/alert/nutanix/cluster/resolve/${clusterUuid}/${alertId}`, payload)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  getVmStats: async (vmIdx, params) => {
    return axios.get(config.url + '/api/cmp/v1/nx/compute/vms/' + vmIdx + '/stat', { params })
  },
  getCommonThreshold: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/compute/vms/common/threshold')
      return response.data
    } catch (error) {
      return error
    }
  },
  updateCommonThreshold: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/nx/compute/vms/common/threshold', payload)
      return response.data
    } catch (error) {
      return error
    }
  },
  getThreshold: async (vmIdx) => {
    return axios.get(config.url + '/api/cmp/v1/nx/compute/vms/' + vmIdx + '/threshold')
  },
  setVmThreshold: async (vmIdx, body) => {
    return axios.post(config.url + '/api/cmp/v1/nx/compute/vms/' + vmIdx + '/threshold', body)
  },
  // Auto Scale List 조회
  getAutoScaleGroupList: async (params) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/compute/auto-scale', { params })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale 저장
  createAutoScaleGroup: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/nx/compute/auto-scale', payload)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale 수정
  updateAutoScaleGroup: async (payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/nx/compute/auto-scale', payload)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale 단건 조회
  getAutoScaleGroupByIdx: async (autoScaleIdx) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/compute/auto-scale/' + autoScaleIdx)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale 삭제
  deleteAutoScaleGroupByIdx: async (autoScaleIdx) => {
    try {
      const response = await axios.delete(config.url + '/api/cmp/v1/nx/compute/auto-scale/' + autoScaleIdx)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale History 조회
  getAutoScaleGroupHistory: async (autoScaleIdx, autoScalePolicyIdx) => {
    let requestUrl = config.url + '/api/cmp/v1/nx/compute/auto-scale/history/' + autoScaleIdx
    if (autoScalePolicyIdx) {
      requestUrl += '?autoScalePolicyIdx=' + autoScalePolicyIdx
    }
    try {
      const response = await axios.get(requestUrl)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale policy 저장
  createAutoScaleGroupPolicy: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/nx/compute/auto-scale/policy', payload)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale policy 수정
  updateAutoScaleGroupPolicy: async (payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/nx/compute/auto-scale/policy', payload)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // policy list 조회
  getAutoScaleGroupPolicy: async (autoScaleIdx) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/compute/auto-scale/policy/' + autoScaleIdx)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale policy 삭제
  deleteAutoScaleGroupPolicyByIdx: async (autoScalePolicyIdx) => {
    try {
      const response = await axios.delete(config.url + '/api/cmp/v1/nx/compute/auto-scale/policy/' + autoScalePolicyIdx)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // policy 단일 조회
  getAutoScaleGroupPolicyByIdx: async (autoScalePolicyIdx) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/compute/auto-scale/policy/detail/' + autoScalePolicyIdx)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // Auto Scale 에 등록된 & 전체 VM List 조회
  getAutoScaleGroupVmList: async (autoScaleIdx) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/compute/auto-scale/vm/' + autoScaleIdx)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateUnregisterVm: async (payload) => { // 미등록 자원 최초 업데이트
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/nx/compute/vms/user', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
