/**
  * 파일명 : IAM.js
  * 파일 기능 : [IAM] 관련 모든 API 모듈
  * 작성자 : 김예담 외 5명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 프로젝트 생성/변경/삭제 작업 중
 **/

import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL,
  // url: 'https://api-s.growthsoft.co.kr',
  // url: 'http://192.168.1.21:10021',
  // url: 'http://localhost:10021',
  iamUri: '/api/cmp/v1/iam'
}

export default {
  config,
  getUserMergedList: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/user/merge', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getUserList: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/user', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getGroupList: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/group', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getGroupManageTree: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/group/manage/tree', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getGroupRoleList: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/group/role', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getRole: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/role/' + payload.roleIdx,
        { params: payload.params })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getRoleList: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/role/list', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getTaskRoleList: async () => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/role/task')
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getUserInfo: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/user/detail', { params: payload })
      return response.data === null ? {} : response.data[0]
    } catch (error) {
      console.error(error)
    }
  },

  getProjectResource: async payload => { // 프로젝트 하위에 자원이 존재 하는지 (존재하면 false 반환)
    try {
      const response = await axios.get(config.url + config.iamUri + '/project/resource/' + payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getUserPage: async (params) => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/user/ad/page', { params: params })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  findUserId: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/auth/findId', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  createRole: async payload => {
    try {
      const response = await axios.post(config.url + config.iamUri + '/role', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response
    }
  },
  createUser: async payload => {
    try {
      const response = await axios.post(config.url + config.iamUri + '/user', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response.data
    }
  },
  getProject: async (params) => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/project', {
        params: {
          ...params
          // isAdmin: params.isAdmin || true
        }
      })
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  createProject: async (payload, qs) => {
    try {
      const response = await axios.post(config.url + config.iamUri + '/project' + qs, payload)
      return response.data
    } catch (error) {
      // const errorCode = error.response.data.code
      // if (errorCode === 'IAM033') return { errorCode }
      // else console.error(error)
      throw error.response.data
    }
  },

  updateUser: async payload => {
    try {
      const response = await axios.put(config.url + config.iamUri + '/user', payload)
      return response.data
    } catch (error) {
      // console.error(error)
      throw error.response.data
    }
  },
  updateProject: async (payload, qs) => {
    try {
      const response = await axios.put(config.url + config.iamUri + '/project' + qs, payload)
      return response.data
    } catch (error) {
      // const errorCode = error.response.data.code
      // if (errorCode === 'IAM033') return { errorCode }
      // else console.error(error)
      throw error.response.data
    }
  },
  deleteProject: async (payload, qs) => {
    try {
      const response = await axios.delete(config.url + config.iamUri + '/project/' + payload + qs)
      return response.data
    } catch (error) {
      // console.error(error)
      throw error.response.data
    }
  },
  deleteUser: async (qs, payload) => {
    try {
      const response = await axios.delete(config.url + config.iamUri + '/user/' + payload + '?isAdmin=' + qs)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateRole: async payload => {
    try {
      const response = await axios.put(config.url + config.iamUri + '/role', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error.response.data
    }
  },
  deleteRole: async payload => {
    try {
      const response = await axios.delete(config.url + config.iamUri + '/role/' + payload.roleIdx)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getRoleManageList: async payload => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/role/' + payload.roleIdx)
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getTaskRole: async () => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/role/task')
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  createGroup: async payload => {
    try {
      const response = await axios.post(config.url + config.iamUri + '/group', payload)
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  updateGroup: async payload => {
    try {
      const response = await axios.put(config.url + config.iamUri + '/group', payload)
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  deleteGroup: async payload => {
    try {
      const response = await axios.delete(config.url + config.iamUri + '/group', { params: payload })
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  projectMove: async payload => {
    try {
      const response = await axios.put(config.url + config.iamUri + '/project/move', payload)
      return response.data
    } catch (error) {
      const errorCode = error.response?.data?.code
      if (errorCode) {
        console.error(error)
        return { errorCode }
      }
      console.error(error)
    }
  },
  userMove: async payload => {
    try {
      const response = await axios.put(config.url + config.iamUri + '/user/move', payload)
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  checkDeleteGroup: async payload => {
    try {
      const response = await axios.delete(config.url + config.iamUri + '/group/check', { params: payload })
      return response.data === null ? 0 : response.data
    } catch (error) {
      console.error(error)
    }
  },
  getSimpleList: async () => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/group/simple')
      return response.data === null ? [] : response.data
    } catch (error) {
      console.error(error)
    }
  },
  syncAll: async () => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/ad/sync/all')
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getUserLoginToken: async (userId) => {
    try {
      const response = await axios.get(config.url + config.iamUri + '/auth/encrypt/user', { params: { userId } })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },

  // API 탬플릿 관련
  getAuthority: async (payload) => { // API 권한 조회
    try {
      const response = await axios.get(config.url + config.iamUri + '/authority', { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  addAuthority: async ({ authorities, isAdmin, userIdx }) => { // API 권한 조회 (탬플릿조회)
    try {
      const response = await axios.post(config.url + config.iamUri + '/authority',
        authorities,
        {
          headers: { isAdmin, userIdx }
        })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  getAuthorityTemplate: async (idx) => { // API 권한 조회 (탬플릿조회)
    try {
      const response = await axios.get(config.url + config.iamUri + `/authority/${idx}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  updateAuthority: async ({ idx, payload }) => { // API 권한 수정
    try {
      const response = await axios.put(config.url + config.iamUri + `/authority/${idx}`, payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  deleteAuthority: async (idx) => { // API 권한 삭제
    try {
      const response = await axios.delete(config.url + config.iamUri + `/authority/${idx}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  copyAuthority: async payload => { // API 권한 개별 복사
    try {
      const response = await axios.post(config.url + config.iamUri + '/authority/copy', payload)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  uploadExcelAccount (file) {
    return axios.post(config.url + config.iamUri + '/ad/excel/upload', file, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // IAM에 파일을 업로드합니다.
  iamProjectUpload: async (file) => {
    try {
      const response = await axios.post(config.url + config.iamUri + '/project/file', file)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  createADUser: (payload) => {
    return axios.post(config.url + config.iamUri + '/user/ad/insert', payload)
  }
}
