import API from '@sd-fe/cmp-core'
import i18n from '@/i18n'

// 받아온 객체를 배열로 바꾼다.
/**
 * 받아온 객체를 배열로 바꾼다.
 * @param {string} monitName 모니터링서버명
 * @param {array} item [0]: key, [1]: value
 * @param {string} selectedTab ex) EC2, EBS ...
 * @returns {object} ex) {label:???, key:???, unit:???}
 */
function changeValueI18 (monitName, selectedTab, item) {
  if (item[0] === 'createTime' || item[0] === 'modifyTime') {
    return false
  } else {
    const regExp = /.*\(([^)]*)\).*/
    const label = i18n.t(`admin.MONIT.THRESHOLD.${monitName}.${selectedTab}.${item[0]}`)
    const value = item[1] === null ? 0 : item[1]
    const unit = regExp.exec(label)?.[1] ? regExp.exec(label)?.[1] : undefined
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
  async getCommonThreshold (selectedMonit, selectedTab) {
    try {
      let changedData = null
      let data = null
      if (selectedTab === 'EC2') {
        data = await API.aws.getAwsEc2CommonThreshold()
      } else if (selectedTab === 'EBS') {
        data = await API.aws.getAwsEbsCommonThreshold()
      } else {
        const data = { message: '해당 탭은 존재하지 않습니다.' }
        throw data
      }
      const dataArr = Object.entries(data.data)
      changedData = dataArr.map((item, index) => {
        return changeValueI18(selectedMonit, selectedTab, item)
      }).filter((el) => {
        if (el !== false) return el
      })

      console.log(selectedMonit)
      console.log('AWS Cloud Watch')
      return changedData
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
  async updateCommonThreshold (selectedMonit, selectedTab, params) {
    try {
      let response = null
      if (selectedTab === 'EC2') {
        response = await API.aws.updateAwsEc2CommonThreshold(params)
      } else if (selectedTab === 'EBS') {
        response = await API.aws.updateAwsEbsCommonThreshold(params)
      } else {
        const data = { message: '해당 탭은 존재하지 않습니다.' }
        throw data
      }

      return response
    } catch (err) {
      console.log('에러발생')
      throw err
    }
  }
}
