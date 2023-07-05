
import API from '@sd-fe/cmp-core'

export default {
  methods: {
    /**
     * 설치프로그램에 등록되어있는 코드목록 세팅
     */
    async getCodeList (params) {
      try {
        const response = await API.config.getCodeList(params)
        return response
      } catch (error) {
        console.error('@@ getCodeList: ', error)
      }
    },
    /**
       * 코드 트리 만들기
       * 나중에 재귀로 리팩토링 한번 할게요...
       */
    async setCodeTree () {
      const osSystem = await this.getCodeList({ codeType: 'OS_SYSTEM' }) // [운영체제 구분] 옵션 설정
      const osType = await this.getCodeList({ codeType: 'OS_TYPE' }) // [운영체제] 옵션 설정
      const osVersion = await this.getCodeList({ codeType: 'OS_VERSION' }) // [운영체제 버전] 옵션 설정

      // console.log(osSystem, osType, osVersion)

      // osVersion 세팅
      const osVersions = {}
      for (const { upperCodeIdx, codeVal, codeName } of osVersion) {
        const already = osVersions[upperCodeIdx]
        const option = { label: codeName, value: codeVal }

        if (already) osVersions[upperCodeIdx].push(option)
        else osVersions[upperCodeIdx] = [option]
      }

      // osTypes 세팅
      const osTypes = {}
      for (const { upperCodeIdx, codeIdx, codeVal, codeName } of osType) {
        const already = osTypes[upperCodeIdx]
        const option = { label: codeName, value: codeVal, children: osVersions[codeIdx] }

        if (already) osTypes[upperCodeIdx].push(option)
        else osTypes[upperCodeIdx] = [option]
      }

      // osSystems 세팅
      const osSystems = {}
      for (const { codeIdx, codeVal, codeName } of osSystem) {
        const already = osSystems[codeVal]
        const option = { label: codeName, value: codeVal, children: osTypes[codeIdx] }

        if (already) osSystems[codeIdx] = option
        else osSystems[codeIdx] = option
      }

      const result = []
      for (const key in osSystems) result.push(osSystems[key])

      return result
    }
  }
}
