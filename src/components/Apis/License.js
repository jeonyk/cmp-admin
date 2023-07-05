import axios from 'axios'

export const LICENSE_URL = process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/license'
export const CMP_MANAGE_URL = LICENSE_URL + '/version'
export const LICENSE_MANAGE_URL = LICENSE_URL + '/manage'
export const MODULE_MANAGE_URL = LICENSE_URL + '/module'
export const MODULE_UPDATE_URL = LICENSE_URL + '/update'

/** CMP 버전 관리 시작 */
// CMP 버전 생성
export const createVersion = payload => {
  return axios.post(CMP_MANAGE_URL, payload)
}

// CMP 버전 수정
export const updateVersion = (payload, cmpVersionIdx) => {
  return axios.put(CMP_MANAGE_URL, payload, { params: { cmpVersionIdx } })
}

// CMP 버전 상세 반환
export const getDetailVersion = idx => {
  return axios.get(CMP_MANAGE_URL + `/${idx}`)
}

export const deleteDetailVersion = idx => {
  return axios.delete(CMP_MANAGE_URL + `/${idx}`)
}

// CMP 버전 리스트 반환
export const getVersions = () => {
  return axios.get(CMP_MANAGE_URL + '/list')
}
/** CMP 버전 관리 끝 */

/** 라이선스 관리 시작 */
// 라이선스 조회
export const getLicense = params => {
  return axios.get(LICENSE_MANAGE_URL, { params })
}

// 라이선스 리스트 조회
export const getLicenseList = params => {
  return axios.get(LICENSE_MANAGE_URL + '/list', { params })
}

// 라이선스 생성
export const createLicense = payload => {
  return axios.post(LICENSE_MANAGE_URL, payload)
}

// 라이선스 키 다운로드
export const downloadLicenseKey = hashKey => {
  return axios.get(LICENSE_MANAGE_URL + '/download?hashKey=' + hashKey)
}

// 라이선스 키 업로드
export const uploadLicenseKey = payload => {
  return axios.post(LICENSE_MANAGE_URL + '/upload', payload)
}

// // 라이선스 상세 조회
// export const getDetailLicense = idx => {
//   return axios.get(LICENSE_MANAGE_URL + `/${idx}`)
// }

// 라이선스 수정
export const updateLicense = (params, payload) => {
  return axios.put(LICENSE_MANAGE_URL, payload, {
    params
  })
}

// 라이선스 삭제
export const deleteLicense = idx => {
  return axios.delete(LICENSE_MANAGE_URL + `/${idx}`)
}

/** @deleted 삭제된 API - 확인용 */
// 라이선스 담당자 정보 확인 - 인증번호
export const getManagerInfo = (idx, payload) => {
  return axios.get(LICENSE_MANAGE_URL + `/${idx}/confirm/certification`, {
    data: payload
  })
}

// 라이선스 담당자 정보 확인 - 비밀번호
export const getManagerInfoByPw = (idx, payload, isExtra = false) => {
  return axios.post(
    LICENSE_MANAGE_URL + '/confirm/password',
    {
      ...payload,
      isAdmin: true
    },
    {
      params: {
        extra: isExtra,
        licenseIdx: idx
      }
    }
  )
}

// 라이선스 만료일 확인
export const getIsExpire = idx => {
  return axios.get(LICENSE_MANAGE_URL + '/expire', {
    params: { licenseIdx: idx }
  })
}
/** 라이선스 관리 끝 */

/** 모듈 관리 시작 */
// 모듈 생성
export const createModule = payload => {
  return axios.post(MODULE_MANAGE_URL, payload)
}

// 모듈 수정
export const updateModule = (idx, payload) => {
  return axios.put(MODULE_MANAGE_URL, payload, { params: { moduleIdx: idx } })
}

// 모듈 상세정보 반환
export const getDetailModule = idx => {
  return axios.get(MODULE_MANAGE_URL + `/${idx}`)
}

// 모듈 삭제
export const deleteModule = idx => {
  return axios.delete(MODULE_MANAGE_URL + `/${idx}`)
}

// 모듈 리스트 반환
export const getModuleList = () => {
  return axios.get(MODULE_MANAGE_URL + '/list')
}

// 모듈 버전 생성
export const createModuleVersion = payload => {
  return axios.post(MODULE_MANAGE_URL + '/version', payload)
}

// 모듈 버전 수정
export const updateModuleVersion = (idx, payload) => {
  return axios.put(MODULE_MANAGE_URL + '/version', payload, {
    params: { moduleVersionIdx: idx }
  })
}

// 모듈 버전 반환
export const getModuleVersion = idx => {
  return axios.get(MODULE_MANAGE_URL + `/${idx}`)
}

// 모듈 버전 삭제
export const deleteModuleVersion = idx => {
  return axios.delete(MODULE_MANAGE_URL + `/${idx}`)
}

// 모듈 버전 리스트 반환
export const getModuleVersionList = params => {
  return axios.get(MODULE_MANAGE_URL + '/version/list', { params })
}

// 기본 모듈 중 미등록된 목록을 조회
export const getNotRegisteredModules = () => {
  return axios.get(MODULE_MANAGE_URL + '/registry')
}
/** 모듈 관리 끝 */

export const getPackageTypeList = () => {
  return axios.get(LICENSE_URL + '/packagetype/list')
}

/** 모듈 업데이트 관련 API 시작 */
/**
 * 대외 영역 모듈 업데이트
 * @param {*} params
 * @returns
 */
export const getUpdate = params => {
  return axios.get(MODULE_UPDATE_URL, { params })
}

/**
 * 중앙 영역 모듈 업데이트 히스토리 조회
 * @param {*} params
 * @returns
 */
export const getHistoryModuleCentral = params => {
  return axios.get(MODULE_UPDATE_URL + '/history/module/central', { params })
}

/**
 * 대외 영역 모듈 업데이트 히스토리 조회
 * @param {*} params
 * @returns
 */
export const getHistoryModuleExtra = params => {
  return axios.get(MODULE_UPDATE_URL + '/history/module/extra', { params })
}

/**
 * 대외 영역 버전 업데이트 히스토리 조회
 * @param {*} params
 * @returns
 */
export const getHistoryVersion = params => {
  return axios.get(MODULE_UPDATE_URL + '/history/version', { params })
}

/**
 * 대외 영역 모듈 업데이트
 * @param {*} payload 새로운 패키지 버전 정보
 * @param {*} params licenseIdx
 * @returns
 */
export const runUpdate = (payload, params) => {
  return axios.post(MODULE_UPDATE_URL + '/run', payload, { params })
}
/** 모듈 업데이트 관련 API 끝 */

// CMP 패키지 정보 가져오기
export const getCurrentLicense = params => {
  return axios.get(LICENSE_MANAGE_URL + '/current', { params: params })
}
