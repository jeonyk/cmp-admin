import Vue from 'vue'
import API from '@sd-fe/cmp-core'
export default Vue.extend({
  methods: {
    /**
     * 존재하는 호스트 네임을 검사 후 호스트명 인덱스를 할당합니다.
     * @param {Object} vmInfo vm 정보
     * @param {String} hostName 검사 할 호스트 명
     */
    async settingHostNameIdx (vmInfo, hostName) {
      let idx = 1

      const existHosts = await this.getExistedHostnames()

      idx = this.createNewIdx(existHosts, hostName)

      // this.hostNameSetting(vmInfo, hostName)
      return idx < 10 ? ('0' + idx) : idx
    },
    /**
    * 이미 생성된 호스트 리스트를 가져옵니다.
    */
    async getExistedHostnames () {
      const basketResources = await API.work.getResource()
      const vms = await API.compute.getVmsName()

      let existedHostnames = []
      if (basketResources?.hostNames) existedHostnames = basketResources.hostNames.concat([...vms])
      else existedHostnames = [...vms]
      return Array.from(new Set(existedHostnames))
    },
    /**
     * 호스트명 IDX 생성
     * 현존하는 name과 동일 호스트명 중 비어있는 INDEX를 부여합니다.
     * @param {Array} list 현존하는 호스트명들
     * @param {String} name IDX를 부여할 호스트명
     * @param {String} exceptName 현존하는 호스트명 중 제외할 호스트명
     * @return {Number} 호스트명 IDX
    */
    createNewIdx (list, name, exceptName) {
      const sameHostNames = []
      const all = exceptName ? list.filter(item => item !== exceptName) : [...list]
      all.forEach(item => {
        const check = item.startsWith(name)
        if (!check) return
        const idxInt = item.slice(-2)
        if (isNaN(Number(idxInt))) return
        sameHostNames.push(Number(idxInt)) // 동일한 호스트명들의 IDX를 모음
      })

      sameHostNames.sort((a, b) => { return a - b })

      const max = sameHostNames.length ? sameHostNames[sameHostNames.length - 1] : 0
      for (let i = 0; i < max; i++) {
        if (!sameHostNames.includes(i + 1)) {
          return i + 1
        }
      }
      return max + 1
    },

    /**
   * 호스트명에 대해 검증하는 함수
   * 영어, 숫자 이외에 문자(한글, 특수문자, 이모지 등)의 입력을 제한
   * 문자열 5자 초과 제한
   * @param {string} hostName
   * @returns {boolean} validation에 통과하면 true, 통과하지 못하면 false 반환
  */
    validateHostName (hostName) {
      // 비어있는 문자열, 5자 초과 체크
      if (!hostName || hostName.length > 5 || typeof hostName !== 'string') {
        return false
      }

      // 한 문자씩 검사
      for (const s of hostName) {
        if (!s.match(/[0-9a-z]/)) return false
      }

      return true
    }
  }
})
