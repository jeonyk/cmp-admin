import axios from 'axios'

const BASE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1'

export const getAudit = params => {
  return axios.get(BASE_URL + '/audit', {
    params: {
      ...params,
      nowPage: params.nowPage || 1,
      perPage: params.perPage || 10
    }
  })
}

export const getAuditDetail = id => {
  return axios.get(BASE_URL + '/audit/' + id)
}
