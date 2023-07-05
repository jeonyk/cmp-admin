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
  iam: {
  // IAM uri를 조직계정에서 불러오기위해 임포트합니다.
    config,

    /**  **********조직-계정 엑셀파일 업로드 APIs **************
   ** 조직관리에서 조직계정 Excel 파일 업로드 모달팝업에서 사용될 API 입니다.
   */

    /** (1) [GET]  최신 조직-계정 파일 다운로드(조직-계정 파일)
   */
    downloadLastedOrganAccExcel: async () => {
      try {
        const response = await axios.get(config.url + config.iamUri + '/ad/excel/recent/download', { responseType: 'blob' })
        return response
      } catch (error) {
        throw error.response
      }
    },
    /** (2) [POST]  엑셀 업로드 (조직-계정 파일)
   *  @param {file} file 파일 데이터
   */
    uploadOrganAccExcel: async (file) => {
      try {
        const response = await axios.post(config.url + config.iamUri + '/ad/excel/upload', file)
        return response.data
      } catch (error) {
        throw error.response.data
      }
    },
    /** (3) [POST]  작업실행(조직-계정 파일)
   * @method runTaskToOrganAccExcel
   * @param {number} fileIdx 파일 인덱스 번호
   */
    runTaskOrganAccExcel: async (fileIdx) => {
      try {
        const response = await axios.post(config.url + config.iamUri + `/ad/excel/run/${fileIdx}`)
        return response.data
      } catch (error) {
        throw error.response.data
      }
    },
    /** (4) [GET]  조직계정 Excel 파일 리스트 가져오기(조직-계정 파일)
   */
    getListOrganAccExcel: async () => {
      try {
        const response = await axios.get(config.url + config.iamUri + '/ad/excel/fileList')
        return response.data
      } catch (error) {
        throw error.response.data
      }
    },
    /** (5) [GET]  엑셀 파일 개별 조회(조직-계정 파일)
   * @param {number} fileIdx 파일 인덱스 번호
   */
    getEachOrganAccExcel: async (fileIdx) => {
      try {
        const response = await axios.get(config.url + config.iamUri + `/ad/excel/file/${fileIdx}`)
        return response.data
      } catch (error) {
        throw error.response.data
      }
    },
    /** (6) [GET]  단일 엑셀 다운로드(조직-계정 파일)
   * @param {number} fileIdx 파일 인덱스 번호
  */
    downloadEachOrganAccExcel: async (fileIdx) => {
      try {
        const response = await axios.get(config.url + config.iamUri + '/ad/excel/download/', {
          params: {
            fileIdx: fileIdx
          },
          responseType: 'blob'
        })
        return response
      } catch (error) {
        throw error.response
      }
    },
    /** (7) [GET]  엑셀 컬럼 조회(조직-계정 파일)
   * @param {string} sheetType AvailableValues ALL, COMPANY, GROUP, USER
  */
    getColumnSheetnameOrganAccExcel: async (sheetName) => {
      try {
        const response = await axios.get(config.url + config.iamUri + `/ad/excel/${sheetName}`)
        return response.data
      } catch (error) {
        throw error.response
      }
    }
  /***********************************/
  }
}
