import axios from 'axios'

const config = {
  url: process.env.VUE_APP_ZUUL_URL,
  // url: 'http://192.168.11.74:8080',
  // url: 'https://api-s.growthsoft.co.kr',
  // url: 'https://192.168.1.21:10021',
  // url: 'https://localhost:20171',
  configUri: '/api/cmp/v1/vmware'
}

export default {
  /* ---------------------------- SECTION EXSi(호스트) --------------------------- */

  vmware: {
    /** (GET) EXSi(호스트)의 리스트를 가져옵니다.
     * @return {object} response.data
     */
    getExsiList: async () => {
      try {
        const response = await axios.get(config.url + config.configUri + '/host/connect', {
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (POST) EXSi(호스트) 항목 저장(생성)
     * @param {object} payload
     * @return {object} response.data
     */
    createTheExsi: async (payload) => {
      try {
        const response = await axios.post(config.url + config.configUri + '/host/connect', {
          ...payload
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (PUT) EXSi(호스트) 업데이트
     * @param {object} payload
     * @return {object} response.data
     */
    updateTheExsi: async (payload) => {
      try {
        const response = await axios.put(config.url + config.configUri + '/host/connect', {
          ...payload
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /**  (DELETE) EXSi(호스트) 삭제
     * @param {Number} idx
     */
    deleteTheExsi: async (idx) => {
      try {
        const response = await axios.delete(config.url + config.configUri + `/host/connect/${idx}`, {
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    }, /** (GET) EXSi(호스트) 항목 저장(생성)
    * @param {string} hostUuid
    * @return {object} response.data
    */
    runSyncTheEXSi: async (hostUuid) => {
      try {
        const response = await axios.get(config.url + config.configUri + `/host/sync/${hostUuid}`)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },

    /** (POST) OTP 인증 비밀번호 조회
     * @param idx
     * @param otpReq
     */
    checkTheHostOTP: async (idx, otpReq) => {
      try {
        const response = await axios.post(config.url + config.configUri + `/host/connect/${idx}`, otpReq)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },

    /** (POST) 연결테스트
     * @param idx
     * @param otpReq
     */
    checkConnectHostTest: async (connection) => {
      try {
        const response = await axios.post(config.url + config.configUri + '/host/connect/test', connection)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (POST) OTP 인증 비밀번호 조회
     * @param idx
     * @param otpReq
     */
    checkTheExsiOTP: async (idx, otpReq) => {
      try {
        const response = await axios.post(config.url + config.configUri + `/host/connect/otp/${idx}`, otpReq)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /* --------------------------- !SECTION EXSi(호스트) -------------------------- */

    /* ----------------------------- SECTION vCenter ---------------------------- */
    // vCenter 리스트를 가져옵니다.
    getVcenterConnectList: async () => {
      try {
        const response = await axios.get(config.url + config.configUri + '/vcenter/connect')
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (POST) EXSi(호스트) 항목 저장(생성)
     * @param {object} payload
     * @return {object} response.data
     */
    createTheVcenter: async (payload) => {
      try {
        const response = await axios.post(config.url + config.configUri + '/vcenter/connect', {
          ...payload
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (PUT) EXSi(호스트) 업데이트
     * @param {object} payload
     * @return {object} response.data
     */
    updateTheVcenter: async (payload) => {
      try {
        const response = await axios.put(config.url + config.configUri + '/vcenter/connect', {
          ...payload
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /**  (DELETE) EXSi(호스트) 삭제
     * @param {Number} idx
     */
    deleteTheVcenter: async (idx) => {
      try {
        const response = await axios.delete(config.url + config.configUri + `/vcenter/connect/${idx}`, {
        })
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (POST) OTP 인증 비밀번호 조회
     * @param idx
     * @param otpReq
     */
    checkTheVcenterOTP: async (idx, otpReq) => {
      try {
        const response = await axios.post(config.url + config.configUri + `/vcenter/connect/otp/${idx}`, otpReq)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    checkConnectVcenterTest: async (connection) => {
      try {
        console.log('API 연동중')
        const response = await axios.post(config.url + config.configUri + '/vcenter/connect/test', connection)
        console.log(response.data)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /** (GET) vCenter(호스트) 수동 동기화
    * @param {string} idx
    * @return {object} response.data
    */
    runSyncTheVcenter: async (idx) => {
      try {
        const response = await axios.get(config.url + config.configUri + `/vcenter/sync/${idx}`)
        return response.data
      } catch (error) {
        console.error('Error : ', error)
        throw error
      }
    },
    /* ------------------------------ SECTION 렉 관리 API ----------------------------- */
    /** (GET) VMware 렉 리스트 조회
     * @description 해당 응답데이터에는 렉이 가지고있는 블록 리스트를 포함합니다.
     * @return {Array} response.data
     */
    getVmwareRackList: async () => {
      try {
        const response = await axios.get(config.url + config.configUri + '/rack')
        return response.data
      } catch (error) {
        console.log('Error :', error)
        throw error
      }
    },
    changeVmwareRackList: async (payload) => {
      try {
        const response = await axios.put(config.url + config.configUri + '/rack', payload)
        return response.data
      } catch (error) {
        console.log('Error :', error)
      }
    }
  /* ----------------------------- !SECTION 렉 관리 API ----------------------------- */
  }
  /* ---------------------------- !SECTION vCenter ---------------------------- */

}
