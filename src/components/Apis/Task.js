/**
  * 파일명 : Task.js
  * 파일 기능 : [업무] 관련 모든 API 모듈
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 Update: 접근불가능 페이지 입력 및 업무페이지 처리
 **/

import axios from 'axios'

const config = {
  // url: 'http://localhost'
  url: process.env.VUE_APP_ZUUL_URL
}

export default {
  getTaskPre: async payload => {
    try {
      const response = await axios.get(`${config.url}/api/cmp/v1/work/task/pre`)
      return response.data
    } catch (error) {
      console.error('@@@ getTaskPre Error : ', error)
    }
  },
  getRecentAdminUser: async (userId) => {
    try {
      const response = await axios.get(
        // 'http://localhost:60051' + '/api/cmp/v1/work/approval/user/recent/'
        config.url + '/api/cmp/v1/work/approval/admin/user/recent/' +
        userId, {}
        // config.url + '/api/cmp/v1/work/approval'

      )
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getTaskPreDetail: async orderIdx => {
    try {
      const response = await axios.get(`${config.url}/api/cmp/v1/work/task/pre/${orderIdx}`)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  taskIpCheck: async payload => {
    try {
      const response = await axios.get(`${config.url}/api/cmp/v1/work/task/pre/check`, { params: payload })
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  vmWorkingCheck: async payload => {
    try {
      // const response = await axios.get(`${config.url}/api/cmp/v1/work/check/${payload}`)
      const response = await axios.get(`${config.url}/api/cmp/v1/work/order/basket/resource/all/hostname/check/${payload}`) // 진범차장님 요청으로 변경 (21.10.07)
      return response.data
    } catch (error) {
      console.error(error)
      throw error
    }
  },
  insertTaskData: async payload => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/work/task/pre/data`, payload)
      return response.data
    } catch (error) {
      console.error('@@@ insertTaskData Error : ', error)
      throw error
    }
  },
  insertTaskPreReject: async payload => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/work/task/pre/reject`, payload)
      return response.data
    } catch (error) {
      console.error('@@@ insertTaskPreReject Error : ', error)
      throw error
    }
  },
  updateTaskPreChkList: async payload => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/work/task/pre/chk`, payload)
      return response.data
    } catch (error) {
      console.error('@@@ updateTaskPreChkList Error : ', error)
    }
  },
  insertMemo: async payload => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/work/task/pre/memo`, payload)
      return response.data
    } catch (error) {
      console.error('@@@ insertMemo Error : ', error)
    }
  },
  deleteMemo: async memoIndex => {
    try {
      const response = await axios.delete(`${config.url}/api/cmp/v1/work/task/pre/memo/${memoIndex}`)
      return response.data
    } catch (error) {
      console.error('@@@ deleteMemo Error : ', error)
    }
  },
  cancelDelete: async (params, payload) => {
    try {
      const paramKey = params.userIntResourceIdx ? 'userIntResourceIdx' : 'userIntResourceIdx'
      const response = await axios.put(
        config.url + `/api/cmp/v1/work/task/todo/delete/cancel/${params.indexType}?${paramKey}=${params[paramKey]}`, payload)
      return response
    } catch (error) {
      throw error.response
    }
  },

  // -------------------------------------
  // -------------------------------------
  // -------------------------------------
  // ------- 👇🏻 @@@@ DEPRECATED ----------
  // -------------------------------------
  // -------------------------------------
  // -------------------------------------
  // Task
  getTask: async (params) => {
    try {
      const response = await axios.get(
        // config.url + '/api/cmp/v1/task/tasks/' + taskNo
        config.url +
        // 'http://localhost:60051'
         '/api/cmp/v1/work/approval/detail', { params: params }
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getTaskAdmin: async (params) => {
    try {
      const response = await axios.get(
        // config.url + '/api/cmp/v1/task/tasks/' + taskNo
        config.url +
        // 'http://localhost:60051' +
        '/api/cmp/v1/work/approval/admin/detail', { params: params }
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getTasks: async (taskStatus) => {
    try {
      const response = await axios.get(
        // config.url + `/api/cmp/v1/task/tasks?taskStatus=${taskStatus}`, {
        config.url + '/api/cmp/v1/task/tasks', {
          params: taskStatus
        }
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getTasksDetail: async (index) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/task/tasks/${index}`
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  // Compute
  getCompute: async (orderNo) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/task/computes/${orderNo}`
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  //  Database
  getDatabase: async (orderNo) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/task/databases/${orderNo}`
      )
      return response.data
    } catch (error) {
      console.error('Error : ', error)
    }
  },
  // Storage
  getStorage: async (orderNo) => {
    try {
      const response = await axios.get(
        config.url = `/api/cmp/v1/task/storages/${orderNo}`
      )
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  // Network L4
  getL4: async (orderNo) => {
    try {
      const response = await axios.get(
        config.url = `/api/cmp/v1/task/l4s/${orderNo}`
      )
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  //  Network L7
  getL7: async (orderNo) => {
    try {
      const response = await axios.get(
        config.url = `/api/cmp/v1/task/l7s/${orderNo}`
      )
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  getTaskUser: async (params) => { // 특정 결재티켓에서 지정한 결재자가 있는지 확인
    try {
      const response = await axios.get(
        config.url +
        // 'http://localhost:60051'
         '/api/cmp/v1/work/approval/user/' + params.approvalNo + '/' + params.userId
        // 'http://localhost:60051' + `/api/cmp/v1/work/approval/user/${params.approvalNo}/${params.userId}`
        // , { params: params }
      )
      return response.data
    } catch (error) {
      console.log(error)
      return error.response
    }
  },
  getApprovalList: async (params) => {
    try {
      const response = await axios.get(
        // 'http://localhost:60051'
        config.url +
        '/api/cmp/v1/work/approval/admin', { params: params }
      )
      return response.data
    } catch (error) {
      console.error(error)
    }
  },
  updateTask: async (taskNo, userId, payload) => {
    try {
      // const response = await axios.put(config.url + '/api/cmp/v1/task/tasks/' + taskNo, payload)
      const response = await axios.put(config.url + '/api/cmp/v1/work/approval/user/confirm/' + taskNo + '/' + userId, payload)
      return response.data
    } catch (error) {
      console.error(error)
      return error.response
    }
  },
  // Security
  updateSecurity: async (payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/task/securities', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  putOrderList: async (payload) => {
    try {
      const response = await axios.put(config.url + '/api/cmp/v1/task/orders', payload)
      return response
    } catch (error) {
      return error.response
    }
  },

  // 구성관리 자원 컨트롤 ----
  // vm
  createVm: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/vm/create/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateVm: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/work/task/vm/update/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateDb: async (userDbIdx, payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/work/task/db/update/${userDbIdx}/run`, payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  deleteVm: async (payload) => { // 실시간 VM 삭제
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/vm/delete/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  deleteVmDb: async (userDbIdx, payload) => { // 실시간 DB 자원 삭제
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/work/task/db/delete/${userDbIdx}/run`, payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  deleteVmMp: async (payload) => { // 실시간 MP 자원 삭제
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/market/delete/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  forceDeleteResource: async (params) => { // 자원 바로 삭제
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/work/task/force/delete/${params.indexType}/${params.userResourceIdx}/run`
      )
      return response
    } catch (error) {
      return error.response
    }
  },
  migrateVm: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/vm/migrate/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  cloneVm: async (userVmIdx, payload) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/work/task/vm/clone/${userVmIdx}/run`, payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  convertVmPower: async (payload) => { // powerState
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/vm/power/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },

  // volume group
  createVg: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/vg/create/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateVg: async (userVgIdx, payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/work/task/vg/update/run/${userVgIdx}`, payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  deleteVg: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/work/task/vg/delete/run', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getSecurityGroupById: async (groupId) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/aws/security-group/' + groupId)
      return response
    } catch (error) {
      return error.response
    }
  },
  // EC2 시뮬레이션 ------------------
  simulateInstance: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/aws/ec2/simulation', payload)
      return response
    } catch (error) {
      throw error.response
    }
  }
}
