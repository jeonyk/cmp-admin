/**
  * 파일명 : WorkMngTask.js
  * 파일 기능 :
  * 작성자 : 박경화 외 1명
  * 최종 작성일 : 2020-12-19
  * License By Shinsegae I&C
  * 2020-12-19 할일/한일 목록 권한처리
 **/

import axios from 'axios'

const config = {
  // url: 'http://localhost:20081'
  url: process.env.VUE_APP_ZUUL_URL
}

// const hd = {
//   'Content-Type': 'application/json',
//   Authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHcm93dGhTb2Z0IiwiYXVkIjoiYWRtaW4iLCJpYXQiOjE1OTU0ODAyMjZ9.RcMeRQl-ZDrd3uGvKQQbuAEql1-OfrEkgjL6VIG0FD0'
// }

export default {
  getGeneralOptions: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/task/option')
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  setGeneralOptions: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/work/task/option', payload)
      return response.data === null ? false : response.data
    } catch (error) {
      return error.response
    }
  },
  getTaskTodoList: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/task/todo', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getTaskTodo: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/work/task/todo/${payload}`)
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getTaskResult: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/work/task/todo/${payload}/run/result`)
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  runTasks: async (payload) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/work/task/todo/${payload.orderNo}/run`, payload)

      console.log('#API__runTasks', response)
      return response.data === null ? false : response.data
    } catch (error) {
      return error.response
    }
  },
  updateTodoStatus: async (payload) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/work/task/todo/${payload.orderNo}/${payload.roleIdx}/status`, payload)
      return response.data === null ? false : response.data
    } catch (error) {
      return error.response
    }
  },
  createRunTaskResultSuccess: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/work/task/todo/send', payload)
      return response.data === null ? false : response.data
    } catch (error) {
      return error.response
    }
  },
  getTaskDoneList: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/work/task/done', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  getTaskDone: async (payload) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/work/task/done/${payload}`)
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.response
    }
  },
  updateTaskTodoChkList: async payload => {
    try {
      const response = await axios.post(`${config.url}/api/cmp/v1/work/task/todo/chk`, payload)
      return response.data
    } catch (error) {
      console.error('@@@ updateTaskTodoChkList Error : ', error)
    }
  }
}
