import API from '@sd-fe/cmp-core'
import i18n from '@/i18n'

// 받아온 객체를 배열로 바꾼다.
/**
 * 받아온
 * @param {string} monitName 모니터링서버명
 * @param {array} item [0]: key, [1]: value
 * @returns label, key unit
 */
function changeValueI18 (monitName, item) {
  if (item[0] === 'clusterUuid' || item[0] === 'vmUuid') {
    return false
  } else {
    const regExp = /\(([^)]+)\)/
    const label = i18n.t(`admin.MONIT.THRESHOLD.${monitName}.${item[0]}`)
    const value = item[1] === null ? 0 : item[1]
    const unit = regExp.exec(label)[1] ? regExp.exec(label)[1] : undefined
    return { label, key: item[0], value, unit }
  }
}

export default {
  /**
   * 모니터링서버명을 입력받아 서버에서 임계치값을 받아옵니다.
   * 각각의 서버에 따라 임계치의 형태가 다를 수 있어서 그에 맞는 형태로 가져옵니다.
   ** ex) AWS => ebs,ec2 두개의 임계치를 받아옵니다.
   ** Nutanix => { clusterUuid: null,
   * controllerAvgIoLatencyThreshold: 2503,
   * controllerIoBandwidthThreshold: null,...
   * }
   * @param {string} selectedMonit 임계치를 설정할 모니터링 서버명
   * @returns {array} ex) 해당 모니터링 서버의 임계치(설정값)
   */
  async getCommonThreshold (selectedMonit) {
    try {
      let data = null
      if (selectedMonit === 'AWS') { console.log('AWS 의 공통임계치를 가져옵니다.') } else if (selectedMonit === 'Nutanix') {
        data = await API.compute.getCommonThreshold()
        const dataArr = Object.entries(data)
        const changedData = dataArr.map((item, index) => {
          return changeValueI18(selectedMonit, item)
        }).filter((el) => {
          if (el !== false) return el
        })

        return changedData
      }
    } catch (err) {
      console.log('에러발생')
      throw err
    }
  },

  /**
   * 모니터링서버명(selectedMonit)을 해당 모니터링서버의 공통임계치를 설정합니다.
   * @param {string} selectedMonit 모니터링서버명
   * @param {object} params Payload
   * @returns
   */
  async updateCommonThreshold (selectedMonit, params) {
    try {
      if (selectedMonit === 'AWS') { console.log('AWS 의 공통임계치를 업데이트합니다.') } else if (selectedMonit === 'Nutanix') {
        const response = await API.compute.updateCommonThreshold(params)
        return response
      }
    } catch (err) {
      console.log('에러발생')
      throw err
    }
  }
}
