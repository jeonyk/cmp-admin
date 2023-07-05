/**
  * 파일명 : Billing.js
  * 파일 기능 : [빌링] 관련 모든 API 모듈
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 Update: 빌링 접근차단 페이지 추가
 **/

import axios from 'axios'

const config = {
  // url: 'http://localhost'
  url: process.env.VUE_APP_ZUUL_URL
}

const hd = {
  'Content-Type': 'application/json'
}

const FULL_URL = config.url + '/api/cmp/v1/billing'

export default {
  getModelList: async () => {
    try {
      const reponse = await axios.get(config.url + '/api/cmp/v1/billing/modelList')
      return reponse.data
    } catch (error) {
      console.log(error)
      return error.reponse
    }
  },
  getService: async (optionId) => {
    try {
      const response = await axios.get(config.url + `/api/cmp/v1/billing/getService/${optionId}`)
      return response.data
    } catch (error) {
      console.log(error)
      throw error.response
    }
  },
  getBillingDashboard: async (date) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/billingVmInfo/billingDashboard/${date}`, { headers: hd })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  insertModel: async (name) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/model', name, { headers: hd })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  insertService: async (service) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/service', service, { header: hd })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateService: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/price', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  updateIsActive: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/isActive', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  updateIsActiveById: async (id) => {
    try {
      const { data } = await axios.put(
        config.url + '/api/cmp/v1/billing/isActive/' + id
      )
      return data
    } catch (error) {
      throw new Error(error.reponse)
    }
  },
  deleteService: async (serviceId) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/billing/dropService/${serviceId}`)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  getSwList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/metering/sw')
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getDistModel: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/distribute/models', {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getDistProject: async (id) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/distribute/projects/' + id, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getDistGroupList: async (id) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/distribute/groups', {
          params: {
            id: id
          },
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  getGroupModel: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/correction/getGroupModel', {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getGroupInfo: async (modelId) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/correction/getGroupCorInfo/${modelId}`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getServerInfo: async (modelId) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/correction/getServerCorInfo/${modelId}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getServerModel: async () => {
    try {
      const response = await axios.get(config.url + '/api/cmp/v1/billing/correction/getServerModel', {
        header: hd
      })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getDashboardAdmin: async (date) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/dashboardCalcul/${date}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getRecentVmList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/recentVmList', {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getListById: async (id) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/listById?id=' + id, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getYearVmList: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/yearVmList', {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getVmListByDate: async (date) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/listByDate?date=' + date, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getVmListById: async (id) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/listById?id=' + id, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getRecentGroupVmList: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/billingVmInfo/group/recent', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getLastMonthGroupVmList: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/billingVmInfo/group/lastMonth', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getGroupVmList: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/billingVmInfo/group', payload)
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getGroupVms: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/group', { params: payload })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getBillingReportByDate: async (date) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/billingVmInfo/listByDate/${date}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getGroupBillingReportByDate: async (date) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/groupBillingReport/${date}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  // getReportRange: async (date) => {
  //   try {
  //     const response = await axios.get(
  //       config.url + '/api/cmp/v1/billing/report/renage', {
  //     })
  //     return response.data
  //   } catch (error) {
  //     return error.response
  //   }
  // },
  getMonthBeforeGroupBilling: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/report/ownerCompany/now', {
          header: hd
        })
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  getReportOwnerCompanyNow: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/report/ownerCompany/now', {
          header: hd
        })
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  getRecentGroupBilling: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/groupBillingReport/recent', {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getYearGroupBilling: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/groupBillingReport/year', {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getPeriodGroupBilling: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/groupBillingReport/period', payload, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getTotPriceBilling: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/groupBillingReport/totPriceSum', payload, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  getTotPriceByGroup: async (id) => {
    try {
      const response = await axios.get(
        config.url + `/api/cmp/v1/billing/groupBillingReport/getTotPriceByGroup/${id}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  insertServerCorrectModel: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/correction/insertServerModel', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  insertGroupCorrectModel: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/correction/insertGroupModel', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  insertGroupCorrectionInfo: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/correction/insertGroupInfo', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  insertServerCorrectionInfo: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/correction/insertServerInfo', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  insertDistModel: async (payload) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/distribute/model', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response
    }
  },
  insertCopyCorServerModel: async (modelId) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/billing/correction//postServerModelCopy/${modelId}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  insertCopyCorGroupModel: async (modelId) => {
    try {
      const response = await axios.post(
        config.url + `/api/cmp/v1/billing/correction//postGroupModelCopy/${modelId}`, {
          header: hd
        })
      return response.data
    } catch (error) {
      return error.response
    }
  },
  deleteDistModel: async (id) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/billing/distribute/model/' + id, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  deleteModel: async (id) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/billing/dropModel/${id}`)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateGroupCorModelName: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/correction/putGroupCorrModelName', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateServerCorModelName: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/correction/putServerCorrModelName', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateDistModelName: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/distribute/modelName', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // 서버별 보정 모델 업데이트
  updateServerCorrectionInfo: async (payload, id) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/billing/correction/serverInfo/${id}`, payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  // 관계사별 보정 모델 업데이트
  updateGroupCorrectionInfo: async (payload, id) => {
    try {
      const response = await axios.put(
        config.url + `/api/cmp/v1/billing/correction/groupInfo/${id}`, payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },

  updateModelName: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/modelName', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  updateDistProject: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/distribute/project/distInfo', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  deleteDistProject: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/distribute/project/deleteDistInfo', payload, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  deleteAllDistProject: async (projectIdx) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/billing/distribute/project/distInfo/' + projectIdx, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  deleteCorGroupModel: async (id) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/billing/correction/dropGroupModel/${id}`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.reponse.data
    }
  },
  deleteCorServerModel: async (id) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/billing/correction/dropServerModel/${id}`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.reponse.data
    }
  },
  deleteCorGroupInfo: async (id) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/billing/correction/dropGroupInfo/${id}`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  deleteCorServerInfo: async (id) => {
    try {
      const response = await axios.delete(
        config.url + `/api/cmp/v1/billing/correction/dropServerInfo/${id}`, {
          headers: hd
        })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },
  getBillingBatchData: async () => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/batch/list')
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  batchBillingModel: async (id, name, date, batchId) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/batch/billingModel', {
          id: id,
          date: date,
          name: name,
          batchId: batchId
        })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  batchServerCorrectModel: async (id, name, date, batchId) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/batch/serverCorrection', {
          id: id,
          date: date,
          name: name,
          batchId: batchId
        })
      return response.data
    } catch (error) {
      throw error.reponse
    }
  },
  batchGroupCorrectModel: async (id, name, date, batchId) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/batch/groupCorrection', {
          id: id,
          date: date,
          name: name,
          batchId: batchId
        })
      return response.data
    } catch (error) {
      throw error.reponse
    }
  },
  batchDistModel: async (id, name, date, batchId) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/batch/distModel', {
          id: id,
          date: date,
          name: name,
          batchId: batchId
        })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  confirmBatchModel: async (payload) => {
    try {
      const response = await axios.put(
        config.url + '/api/cmp/v1/billing/batch/confirm', payload)
      return response
    } catch (error) {
      throw error.response
    }
  },
  createBatchModel: async (date) => {
    try {
      const response = await axios.post(
        config.url + '/api/cmp/v1/billing/batch', { date: date })
      return response.data
    } catch (error) {
      return error.reponse
    }
  },
  // 대시보드에서 사용할 BillingReportController를 새롭게 만듬 3개
  getBillingReportNow: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/report/now', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.reponse
    }
  },
  getBillingReportCompare: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/report/compare', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.reponse
    }
  },

  getOwnerCompanyBillingReportRange: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/report/ownerCompany/range', { params: payload })
      return response.data === null ? [] : response.data
    } catch (err) {
      throw err.response
    }
  },
  getBillingReportRange: async (payload) => {
    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/report/range', { params: payload })
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.reponse
    }
  },
  // getBillingReportExcel: async (date) => {
  //   const formatDate = `${new Date(date).getFullYear()}-${new Date(date).getMonth() + 1}`
  //   try {
  //     axios({
  //       method: 'GET',
  //       url: config.url + '/api/cmp/v1/billing/billingVmInfo/report.xlsx?date=' + date,
  //       responseType: 'blob' // MUST NEED
  //     }).then(response => {
  //       console.log('getBillingReportExcel RESPONSE', response)
  //       // #1 Here, I designate type with response header, however, you can specify 'application/vnd.ms-excel'
  //       const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }))
  //       const link = document.createElement('a')
  //       link.href = url
  //       link.setAttribute('download', `Billing_Report_${formatDate}.xlsx`)
  //       document.body.appendChild(link)
  //       link.click()
  //     })
  //   } catch (error) {
  //     return error.reponse
  //   }
  // },
  getBillingReportExcelById: async (payload) => {
    // try {
    //   axios({
    //     method: 'GET',
    //     url: config.url + '/api/cmp/v1/billing/billingVmInfo/report.xlsx?id=' + payload.id,
    //     responseType: 'blob' // MUST NEED
    //   }).then(response => {
    //     console.log('getBillingReportExcel RESPONSE', response)
    //     // #1 Here, I designate type with response header, however, you can specify 'application/vnd.ms-excel'

    //     return response
    //   })
    // } catch (error) {
    //   return error.reponse
    // }

    try {
      const response = await axios.get(
        config.url + '/api/cmp/v1/billing/billingVmInfo/report.xlsx?id=' + payload.id,
        { responseType: 'blob' })
      return response
    } catch (error) {
      return error.reponse
    }
  },
  billingBatchReset: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/billing/batch/reset/' + payload)
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.reponse
    }
  },
  deleteBillingBatch: async (payload) => {
    try {
      const response = await axios.delete(
        config.url + '/api/cmp/v1/billing/batch/' + payload)
      return response.data === null ? [] : response.data
    } catch (error) {
      return error.reponse
    }
  },
  getModelInfo: async (payload) => {
    try {
      const reponse = await axios.get(config.url + '/api/cmp/v1/billing/model/' + payload)
      return reponse.data || { optionList: [] }
    } catch (error) {
      console.log(error)
      return error.reponse
    }
  },
  getBillUnits: async () => {
    try {
      const { data } = await axios.get(
        config.url + '/api/cmp/v1/billing/enum/unit/type'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  // 빌링 1차 개선 변경 API
  /**
   * @API BM-001
   * 과금 모델 그룹 리스트 조회
   */
  getModelGroups: async () => {
    try {
      const { data } = await axios.get(FULL_URL + '/model-groups')
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-002
   * 과금 모델 그룹 리스트 조회(전체 과금모델 영역)
   */
  getModelGroupsNonApply: async (isBilling = 2) => {
    try {
      const { data } = await axios.get(
        FULL_URL + `/model-groups/non-apply/is-billing/${isBilling}`
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-003
   * 과금모델 그룹 등록
   */
  addModelGroups: async (newData) => {
    try {
      const { data } = await axios.post(
        FULL_URL + '/model-groups',
        newData
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-004
   * 과금모델 그룹 수정
   */
  updateModelGroups: async (updateData) => {
    try {
      const { data } = await axios.put(
        FULL_URL + '/model-groups',
        updateData
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-006
   * 과금 서비스 리스트 카테고리별 조회
   * 선택된 과금모델에 대한 하드웨어/소프트웨어/L4/L7/FIREWALL 목록
   * 키워드로 검색
   */
  getServicesByCategory: async (id, code, keyword) => {
    try {
      const { data } = await axios.get(
        FULL_URL + `/models/${id}/services/category/${code}`,
        { params: { keyword } }
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-007
   * 과금 서비스 조회
   */
  getServices: async (id) => {
    try {
      const { data } = await axios.get(
        FULL_URL + `/services/${id}`
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-008
   * 과금 서비스 수정
   */
  updateServices: async (updateData) => {
    try {
      const { data } = await axios.put(
        FULL_URL + '/services',
        updateData
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-009
   * 과금 서비스 삭제
   */
  deleteServices: async (id) => {
    try {
      const { data } = await axios.delete(
        FULL_URL + '/services/' + id
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-005
   * 전체 과금모델의 APPLY 기능
   */
  applyModelGroup: async (id) => {
    try {
      const { data } = await axios.put(
        FULL_URL + `/model-groups/${id}/is-apply`
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-010
   * 소프트웨어 조회
   */
  getSoftwares: async () => {
    try {
      const { data } = await axios.get(
        FULL_URL + '/services/sw'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  /**
   * @API BM-011
   * 사용중인 서비스 조회
   */
  getUsedSoftwares: async () => {
    try {
      const { data } = await axios.get(
        FULL_URL + '/services'
      )
      return data
    } catch (error) {
      throw error.response.data
    }
  },
  deleteModelGroup: async (id) => {
    try {
      await axios.delete(
        FULL_URL + '/model-groups/' + id
      )
      return true
    } catch (error) {
      throw error.response.data
    }
  },
  // 엑셀 업로드 (과금모델)
  uploadExcel: async (file) => {
    try {
      const { data } = await axios.post(
        FULL_URL + '/excel',
        file
      )
      return data
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  getApplyModelGroup: async () => {
    try {
      const { data } = await axios.get(
        FULL_URL + '/model-groups/is-apply'
      )
      return data[0]
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
  getDistributeGroup: (projectIdx) => {
    return axios.get(FULL_URL + '/distribute/project/group', { params: { projectIdx } })
  },
  updateApply: (body) => {
    return axios.put(FULL_URL + '/distribute/model/apply', body)
  },
  getDistributeDetailModel: (id) => {
    return axios.get(FULL_URL + '/distribute/models/' + id)
  },
  getApplyDistModel: () => {
    return axios.get(FULL_URL + '/distribute/model/is-apply')
  },
  getModelHistory: (id) => {
    return axios.get(FULL_URL + '/distribute/hist/models?modelId=' + id)
  },
  updateDistModel: (payload) => {
    return axios.put(FULL_URL + '/distribute/model', payload)
  }
}
