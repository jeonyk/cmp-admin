/**
  * 파일명 : Network.js
  * 파일 기능 : [네트워크] 관련 모든 API 모듈
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Update: IP 대역항목/상세 Excel 업로드 기능 추가 완료
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  // L4
  getVrserverDetail: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/lb/vrserver/${payload}`
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  createVrserver: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/lb/vrserver', payload)
      return response
    } catch (error) {
      throw error.response
    }
  },
  updateVrserver: async (vrserveIdx, payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/network/lb/vrserver/${vrserveIdx}`, payload
      )
      return response
    } catch (error) {
      throw error.response
    }
  },
  deleteL4Switch: async (vrserverIdx) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/network/lb/vrserver/${vrserverIdx}`
      )
      return response
    } catch (error) {
      console.error('deleteL4Switch Error : ', error)
    }
  },

  // L7
  getCsvrserverDetail: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/lb/csvrserver/${payload}`
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  getCsvrserver: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/csvrserver/register', { params: params }
      )
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  createCsvrserver: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/network/lb/csvrserver', payload
      )
      return response
    } catch (error) {
    //   const errorCode = error.response?.data?.code
    //   if (errorCode) {
    //     console.error(error)
    //     return { errorCode }
    //   }
    //   return console.error('createL7Switch Error : ', error)
      throw error.response
    }
  },
  updateCsvrserver: async (csVrserverIdx, payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/network/lb/csvrserver/${csVrserverIdx}`, payload
      )
      return response
    } catch (error) {
      // const errorCode = error.response?.data?.code
      // if (errorCode) {
      //   console.error(error)
      //   return { errorCode }
      // }
      // return console.error('updateL7Switch Error : ', error)
      throw error.response
    }
  },
  deleteCsvrserver: async (csVrserverIdx) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/network/lb/csvrserver/${csVrserverIdx}`
      )
      return response
    } catch (error) {
      console.error('deleteL7Switch Error : ', error)
    }
  },
  ipCheck: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/manage/category/band/ipcheck', { params: params }
      )
      return response.data
    } catch (error) {
      throw error.response
    }
  },

  // L4 기등록 자원 조회
  getVrserver: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/vrserver/register', { params: params }
      )
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  // L7 미등록 자원 조회
  getUnregistersCsvrserver: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/csvrserver/unregisters', {
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  // [자원 운용] L4 기등록 + 미등록 자원 조회
  getAllVrserver: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/vrserver/all', { params: params }
      )
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  // [자원 운용] L7 기등록 + 미등록 자원 조회
  getAllCsvrserver: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/csvrserver/all', { params: params }
      )
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  getSgGroup: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/sg/group/register', { params: params })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getSgGroupDetail: async (params) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/sg/group/${params}`
      )
      return response.data
    } catch (error) {
      return error.response
    }
  },
  createSgGroup: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/network/sg/group/', payload
      )
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getUnregistersVrserver: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/vrserver/unregisters', {
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getUnregistersgroup: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/sg/group/unregisters', {
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getUnregistersVms: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/lb/vrserver/unregisters', {
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  registerGroup: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/network/sg/group/unregisters'
        , payload)
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  registerCsvrserver: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/network/lb/csvrserver/unregisters'
        , payload)
      return response.data
    } catch (error) {
      throw error.response
      // return error.response
    }
  },
  registerVrserver: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/network/lb/vrserver/unregisters'
        , payload)
      return response.data
    } catch (error) {
      throw error.response
    }
  },

  // 스위치 이름 생성
  createLbName: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/lb/name', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },

  // IP 관리 - 시작
  getIpCategories: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/manage/category',
        { params: params }
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  // getIpCategoryTree: async () => {
  //   try {
  //     const response = await axios.get(
  //       config.url + '/api/cmp/v1/network/manage/category/tree'
  //     )
  //     return response.data
  //   } catch (error) {
  //     console.log(error)
  //     throw error
  //   }
  // },
  getNetworkCategoryTree: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/manage/category/tree'
      )
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  getNetworkCategoryDetail: async (ipCategoryIdx) => { // 네트워크 카테고리 상세 조회
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/manage/category/${ipCategoryIdx}`
      )
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  createIpCategory: async (payload) => { // 네트워크 카테고리 생성
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/manage/category', payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  updateIpCategory: async (ipCategoryIdx, payload) => { // 네트워크 카테고리 수정
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/manage/category/${ipCategoryIdx}`, payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  deleteIpCategory: async (ipCategoryIdx) => { // 네트워크 카테고리 삭제
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/network/manage/category/${ipCategoryIdx}`)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  getIpBands: async (ipCategoryIdx) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/manage/category/band/${ipCategoryIdx}`
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  createIpBand: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/manage/category/band', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  updateIpBand: async (payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/manage/category/band/${payload.ipBandIdx}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  deleteIpBand: async (ipBandIdx) => {
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/network/manage/category/band/${ipBandIdx}`)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  getProjectIps: async (params) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/network/manage/category/band/ip', { params: params })
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  getIps: async (ipBandIdx) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/manage/category/band/ip/${ipBandIdx}`
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  createIp: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/manage/category/band/ip', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  updateIp: async (ipIdx, payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/manage/category/band/ip/${ipIdx}`, payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  deleteIp: async (ipIdx) => {
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/network/manage/category/band/ip/${ipIdx}`)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  // 보안그룹 > 출발지, 목적지에 ip 직접 입력시, 해당 ip 사용 가능 여부를 판단
  getSecurityIpList: async (params) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/network/manage/category/band/fw/ip', { params: params })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  checkUsableIpAddr: async (params) => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/network/manage/category/band/fw/ip/check', { params: params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response.data
    }
  },

  // IP 관리 - 종료
  // 경유지 관리 - 시작
  getPolicyRoads: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/sg/road'
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  createPolicyRoad: async (payload) => { // 경유지 관리 > 항목 추가
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/sg/road', payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  updatePolicyRoad: async (roadIdx, payload) => { // 경유지 관리 > 변경
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/sg/road/${roadIdx}`, payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  deletePolicyRoad: async (payload) => { // 경유지 관리 > 삭제
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/sg/road/delete', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  uploadRoadExcel: async (file) => { // 경유지 Excel 업로드
    try {
      const response = await axios.post(
        `${config.url}/api/cmp/v1/network/sg/road/upload`, file)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },

  // 경유지 상세
  getPolicyRoadDetails: async (roadIdx) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/sg/road/${roadIdx}/detail`
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  createPolicyRoadDetail: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/sg/road/detail', payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  updatePolicyRoadDetail: async (roadIdx, routeName, payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/sg/road/${roadIdx}/detail/${routeName}`, payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  deletePolicyRoadDetail: async (roadIdx, routeName) => {
    try {
      const response = await axios.delete(encodeURI(config.url + `/api/cmp/v1/network/sg/road/${roadIdx}/detail/${routeName}`))
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  uploadRoadDetailExcel: async (file) => { // 경유지 상세 Excel 업로드
    try {
      const response = await axios.post(
        `${config.url}/api/cmp/v1/network/sg/road/detail/upload`, file)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },

  createPolicy: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/sg/road/policy', payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },

  // 경유지 관리 - 종료
  // 네트워크 관리 - 시작
  getEquipNetworks: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/equip'
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  getCertEquipNetworks: async (payload, idx) => {
    try {
      const response = await axios.post(config.url + `/api/cmp/v1/network/equip/${idx}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  createEquipNetwork: async (payload) => { // 네트워크 장비 정보 > 항목 추가
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip', payload)
      return response.data
    } catch (error) {
      const errorCode = error.response?.data?.code
      if (errorCode) {
        console.error(error)
        return { errorCode }
      }
      return console.log(error)
    }
  },
  updateEquipNetwork: async (netIdx, payload) => { // 네트워크 장비 정보 > 수정
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/equip/${netIdx}`, payload)
      return response.data
    } catch (error) {
      const errorCode = error.response?.data?.code
      if (errorCode) {
        console.error(error)
        return { errorCode }
      }
      return console.log(error)
    }
  },
  deleteEquipNetwork: async (payload) => { // 네트워크 장비 정보 > 삭제
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip/delete', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  checkEquipLogin: async (payload) => { // 장비 계정 정보 Validation
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip/check', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  // 네트워크 장비 정보 관리 - 종료
  // 스위치 장비 정보 관리 - 시작
  getEquipSwitchs: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/equip/switch'
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  getEquipDetailSwitchs: async (params) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/equip/switch/${params}`
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  createEquipSwitch: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip/switch', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  updateEquipSwitch: async (switchIdx, payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/equip/switch/${switchIdx}`, payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  deleteEquipSwitch: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip/switch/delete', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  // 스위치 장비 정보 관리 - 종료
  // VDOM 장비 정보 관리 - 시작
  getEquipVdoms: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/equip/vdom'
      )
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  createEquipVdom: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip/vdom', payload)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  updateEquipVdom: async (vdomIdx, payload) => {
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/network/equip/vdom/${vdomIdx}`, payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  deleteEquipVdom: async (payload) => {
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/network/equip/vdom/delete', payload)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },
  uploadVdomExcel: async (file) => { // VDOM 방화벽 Excel 업로드
    try {
      const response = await axios.post(
        `${config.url}/api/cmp/v1/network/equip/vdom/upload`, file)
      return response.data
    } catch (error) {
      if (error?.response?.data?.code) return { errorCode: error.response.data.code }
      else console.error(error)
      throw error
    }
  },
  // VDOM 장비 정보 관리 - 종료

  getNetworkCategory: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/manage/category',
        { params: params }
      )
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },

  // 업무 -> 네트워크 조회
  getNetworkManage: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/manage/category/band/company/',
        { params: params }
      )
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  getIpList: async (params) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/network/manage/category/iprange', { params: params }
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  getCompanyIps: async (companyIdx) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/network/manage/category/band/company/ip/${companyIdx}`)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },

  // -==========
  // -==========
  // -==========
  // -==========
  // -==========
  // -==========
  // -==========
  // -==========
  // -==========

  // IP Excel 업로드
  uploadIPBandExcel: async (file) => { // IP 대역 업로드
    try {
      const response = await axios.post(
        `${config.url}/api/cmp/v1/network/manage/category/band/upload`, file)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getIPBandTest: async (companyIdx) => { // IP 대역 조회 - 테스트
    try {
      const response = await axios.get(
        `${config.url}/api/cmp/v1/network/manage/category/band/upload/test`)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  uploadIPExcel: async (file) => { // IP 업로드
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/network/manage/category/ip/upload', file,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getIP: async (companyIdx) => { // IP 조회
    try {
      const response = await axios.get(
        `${config.url}/api/cmp/v1/network/manage/category/band/ip/test`)
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
