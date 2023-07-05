import API from '@sd-fe/cmp-core'

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
      if (selectedMonit !== 'vmware') { console.log('알 수 없는 모니터링 서버의 공통임계치를 가져옵니다.') } else if (selectedMonit === 'vmware') {
        data = await API.vmware.threshold.getGlobalThreshold()

        const changedData = data.map((item, index) => {
          console.log(item)
          return item
        })
        console.log(changedData)
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
    console.log('🚀 ~ file: commonThreshold.js:41 ~ updateCommonThreshold ~ params', params)
    try {
      const payload = params.map(item => {
        return {
          groupInfoKey: item.groupInfoKey,
          nameInfoKey: item.nameInfoKey,
          nameInfoSummary: item.nameInfoSummary,
          rollupTypeName: item.rollupTypeName,
          thresholdIdx: item.thresholdIdx,
          model: item.model,
          unitInfoLabel: item.unitInfoLabel,
          thresholdValue: item.thresholdValue
        }
      })

      if (selectedMonit !== 'vmware') { console.log('알 수 없는 모니터링 서버의 공통임계치를 가져옵니다.') } else if (selectedMonit === 'vmware') {
        const response = await API.vmware.threshold.updateGlobalThreshold(payload)
        return response
      }
    } catch (err) {
      console.log('에러발생')
      throw err
    }
  }
}
