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
  getCatalogFlavor: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/config/catalog/flavor', {

      })
      return response.data
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getCodeList: async payload => {
    try {
      const response = await axios.get(config.url + config.configUri + '/code', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getOSTypeList: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/nx/enum/os-type')
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteCode: async payload => {
    try {
      const response = await axios.delete(config.url + config.configUri + '/code', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  createCode: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/code', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateCode: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/code', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getTypeList: async payload => {
    try {
      const response = await axios.get(config.url + config.configUri + '/type', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  createType: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/type', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateType: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/type', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  deleteType: async payload => {
    try {
      const response = await axios.delete(config.url + config.configUri + '/type', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getInstallList: async payload => {
    try {
      const response = await axios.get(config.url + config.configUri + '/install', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getInstanceList: async payload => {
    try {
      const response = await axios.get(config.url + config.configUri + '/catalog/flavor', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  deleteInstance: async payload => {
    try {
      const response = await axios.delete(config.url + config.configUri + '/catalog/flavor', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  insertInstance: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/catalog/flavor', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateInstance: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/catalog/flavor/' + payload.flavorIdx, payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getHrJdbc: async (payload) => {
    try {
      const response = await axios.get(config.url + config.configUri + '/hr/jdbc/' + payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getCertHrJdbc: async (payload, params = {}) => {
    try {
      const { data } = await axios.post(config.url + config.configUri + '/hr/jdbc/' + payload, params)
      return data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  insertHrJdbc: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/hr/jdbc', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  updateHrJdbc: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/hr/jdbc', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  getCertHrItsm: async (payload, params = {}) => {
    try {
      const { data } = await axios.post(config.url + config.configUri + '/hr/itsm/' + payload, params)
      return data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  insertHrItsm: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/hr/itsm/', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateHrItsm: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/hr/itsm', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  deleteHr: async payload => {
    try {
      const response = await axios.delete(config.url + config.configUri + '/hr/' + payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getInquiryList: async payload => {
    try {
      const response = await axios.get(config.url + config.configUri + '/support/inquiry/list', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getInquiry: async payload => {
    try {
      const response = await axios.get(config.url + config.configUri + '/support/inquiry', { params: payload })
      return response.data === null ? {} : response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  inquiryAnswer: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/support/inquiry/answer', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getMonitoringServerList: async () => {
    try {
      const response = await axios.get(config.url + config.configUri + '/monitoring')
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getCertMonitoringServerList: async (payload = {}) => {
    try {
      const { data } = await axios.post(config.url + config.configUri + '/monitoring/cert', payload)
      return data === null ? [] : data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  createMonitoringServer: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/monitoring', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateMonitoringServer: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/monitoring', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  deleteMonitoringServer: async payload => {
    try {
      const response = await axios.delete(config.url + config.configUri + '/monitoring', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getLoggingServerList: async () => {
    try {
      const response = await axios.get(config.url + config.configUri + '/logging')
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getCertLoggingServerList: async (payload = {}) => {
    try {
      const { data } = await axios.post(config.url + config.configUri + '/logging/cert', payload)
      return data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  createLoggingServer: async payload => {
    try {
      const response = await axios.post(config.url + config.configUri + '/logging', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateLoggingServer: async payload => {
    try {
      const response = await axios.put(config.url + config.configUri + '/logging', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  deleteLoggingServer: async payload => {
    try {
      const response = await axios.delete(config.url + config.configUri + '/logging', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getSwLicenseList: async payload => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/metering/sw', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  // ---------------------------------
  // ---- 서비스 카탈로그 > 설치프로그램
  // ---------------------------------
  // sw-management-controller
  uploadFile: async (fileKey, payload, handler, userIdx) => { // 파일 업로드
    try {
      const response = await axios.post(config.url + `/zuul/api/cmp/v1/sw/files?fileKey=${fileKey}`, payload, { // 대용량 파일 업로드 시 url 앞에 /zuul/ 추가
        onUploadProgress: handler,
        headers: { userIdx }
      })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getUploadProcess: async fileKey => { // 파일 읽기 ❌
    try {
      const response = await axios.post(config.url + `/api/cmp/v1/sw/files/size?fileKey=${fileKey}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // POST /api/cmp/v1/sw/install/after-creating-vm VM 생성 직후 프로그램 설치 (nutanix module에서 사용할 API) 🧐

  getAddableSwList: async payload => { // 추가 가능한 라이선스
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/licenses/addable', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  programSetUp: async ({ payload, userIdx }) => { // 다수 VM 에 프로그램 설치
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/sw/setup', payload, {
        headers: { userIdx }
      })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  simulation: async ({ userIdx, payload }) => { // 시뮬레이션
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/sw/simulate', payload, {
        headers: { userIdx }
      })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getTestVMList: async params => { // TEST VM 목록 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/vms/test-type', { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // sw-management-user-controller
  searchSW: async payload => { // SW 검색 정보 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/user/sw')
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVMStatusIndiv: async id => { // SW 구동 여부, 설치 여부 개별 조회
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/sw/user/sw/${id}/status`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVMStatusAll: async payload => { // SW 구동 여부, 설치 여부 목록 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/user/sw/status')
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // sw-script-management-controller
  addScript: async payload => { // SW Script 등록
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/sw/softwares/versions/scripts', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateScript: async payload => { // SW Script 수정
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/sw/softwares/versions/scripts', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getScriptDetail: async id => { // 스크립트 상세 조회
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/sw/softwares/versions/scripts/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteScript: async (id, payload) => { // SW Script 삭제
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/sw/softwares/versions/scripts/${id}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateScriptDetail: async payload => { // SW Script 상세 수정
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/sw/softwares/versions/scripts/details', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  uploadScriptDetailFile: async (id, fileId, payload) => { // SW Script 상세 파일 추가 (사용 X)
    try {
      const response = await axios.post(config.url + `/api/cmp/v1/sw/softwares/versions/scripts/details/${id}/file/${fileId}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateScriptDetailFile: async (id, payload) => { // 스크립트 상세 파일 수정 (사용 X)
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/sw/softwares/versions/scripts/details/files', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteScriptDetailFile: async (id, payload) => { // 스크립트 상세 파일 삭제 (사용 X)
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/sw/softwares/versions/scripts/details/files/${id}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // sw-software-management-controller

  getinstallProgramSwList: async payload => { // 설치프로그램 관리 목록 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getSwInfo: async id => { // 설치프로그램 관리 단일 목록 조회
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/sw/softwares/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteSw: async id => { // 설치프로그램 삭제
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/sw/softwares/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getSwnewCnt: async payload => { // 추가 가능한 설치프로그램 수
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/addable-count', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getSwHistory: async payload => { // 설치프로그램 설치 이력 목록 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/historys/installed', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // sw-version-management-controller
  getVersionLists: async (id, payload) => { // 버전 목록 조회
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/sw/softwares/${id}/versions`, { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVersionScript: async (id, payload) => { // 버전 불러오기 (소프트웨어의 버전 내 특정 스크립트를 불러옵니다.)
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/sw/softwares/${id}/versions/scripts`, { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  addSwVersion: async payload => { // SW 버전 등록
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/sw/softwares/versions', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateSwVersion: async payload => { // SW 버전 수정
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/sw/softwares/versions', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getSwVersion: async id => { // 버전 조회
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/sw/softwares/versions/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteSwVersion: async id => { // SW 버전 삭제
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/sw/softwares/versions/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  versionFileUpload: async ({ fileId, fileType, id }) => { // 버전 파일 추가 (버전에 파일을 추가합니다.)
    try {
      const response = await axios.post(config.url + `/api/cmp/v1/sw/softwares/versions/files?fileId=${fileId}&fileType=${fileType}&id=${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  versionFileUpdate: async ({ fileType, oldFileId, newFileId = 0 }) => { // 버전 파일 수정
    try {
      const response = await axios.put(config.url + `/api/cmp/v1/sw/softwares/versions/files?fileType=${fileType}&newFileId=${newFileId}&oldFileId=${oldFileId}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  versionFileDelete: async (id) => { // 버전 파일 삭제
    try {
      const response = await axios.delete(config.url + `/api/cmp/v1/sw/softwares/versions/files/${id}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  checkTestSuccess: async (params) => { // 해당 버전의 시뮬레이션을 성공한 MINION 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/versions/test-success', { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVmLists: async params => { // VM Install 목록 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/vms/install', { params: params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getVmInstalledLists: async params => { // VM Installed 목록 조회
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/vms/installed', { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getUpdateList: async params => { // 업데이트 지원 버전
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/vms/updateList', { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getInstallProgress: async params => { // 설치 프로세스 확인
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/vms/install/state', { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  getUsableInstallList: async params => { // 사용자 화면에서 버전 정보가 추가된 설치프로그램 목록을 조회합니다.
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/sw/softwares/infoes', { params })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // VM List / VM 설치 리스트
  installSimulation: async payload => { // SW 시뮬레이션 설치
    try {
      const response = await axios.post(config.url + '/api/cmp/v1/sw/simulate', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },

  getServiceType: async () => { // WAS, WEB
    try {
      const response = await axios.get(config.url + config.configUri + '/code?codeType=SWITCH_TYPE')
      return response.data === null ? [] : response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  },

  // 자료실 API
  getRefList: (params) => {
    return axios.get(config.url + config.configUri + '/referenceRoom', {
      params: {
        ...params,
        nowPage: params.nowPage || 1,
        perPage: params.perPage || 10
      }
    })
  },
  getRefDetail: (idx) => {
    return axios.get(config.url + config.configUri + '/referenceRoom/' + idx)
  },
  uploadRefFile: (files) => {
    return axios.post(config.url + config.configUri + '/referenceRoom/file/upload', files)
  },
  uploadRefStaticFile: (files) => {
    return axios.post(config.url + config.configUri + '/referenceRoom/file/upload/static', files)
  },
  updateRef: (payload) => {
    return axios.put(config.url + config.configUri + '/referenceRoom', payload)
  },
  createRef: (payload) => {
    return axios.post(config.url + config.configUri + '/referenceRoom', payload)
  },
  removeRef: (idx) => {
    return axios.delete(config.url + config.configUri + '/referenceRoom/' + idx)
  },
  getNewsList: (params) => {
    return axios.get(config.url + config.configUri + '/news', { params })
  },
  getNewsDetail: (idx) => {
    return axios.get(config.url + config.configUri + '/news/' + idx)
  },
  createNews: (payload) => {
    return axios.post(config.url + config.configUri + '/news', payload)
  },
  uploadNewsStatic: (payload) => {
    return axios.post(config.url + config.configUri + '/news/file/upload/static', payload)
  },
  removeNews: (idx) => {
    return axios.delete(config.url + config.configUri + '/news/' + idx)
  },
  updateNews: (payload) => {
    return axios.put(config.url + config.configUri + '/news', payload)
  }
}
