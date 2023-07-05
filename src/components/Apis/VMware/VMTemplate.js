import axios from 'axios'

const VMWARE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/vmware'

export default {
  getVmwareTemplateList: async (params) => { // 템플릿 리스트 조회
    try {
      const response = await axios.get(
        VMWARE_URL + '/vm/template/list', {
          params
        }
      )
      return response
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  getVmwareTemplateDetail: async (params) => { // 텦플릿 단건 조회
    try {
      const response = await axios.get(
        VMWARE_URL + '/vm/template', {
          params
        }
      )
      return response
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  createVmwareTemplate: async (payload) => { // 템플릿 export
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/template/create',
        payload
      )
      return response
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  updateVmwareTemplate: async (payload) => {
    try {
      const response = await axios.post(
        VMWARE_URL + '/vm/template/update',
        payload
      )
      return response
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  },
  changeVmwareTemplateName: async (payload) => {
    try {
      const response = await axios.put(
        VMWARE_URL + '/vm/template/rename',
        payload
      )
      return response
    } catch (error) {
      console.error('Error : ', error)
      throw error
    }
  }
}
