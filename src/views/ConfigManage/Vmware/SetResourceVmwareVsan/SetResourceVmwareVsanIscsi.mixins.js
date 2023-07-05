import Vue from 'vue'
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default Vue.extend({
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    /**
    * 정보 조회 interval clear
    */
    clearGetVgInterval () {
      clearInterval(this.interval)
      this.interval = null
    },
    /**
     * 정보 조회 interval
     */
    async getVgInterval () {
      if (this.interval) this.clearGetVgInterval()
      const callbackFlag = false
      this.interval = setInterval(async () => {
        if (!callbackFlag) await this.init()
      }, 10000)
    },

    /**
   * vSAN iSCISI 생성 이벤트
   */
    async createVsanIscsi (payload) {
      try {
        this.loading.create = true
        console.log('@createVg: ', payload)
        const result = await API.work_v3.createVsanIscsi(payload)

        if (result) {
          this.$alert(`vSAN iSCSI 실행 작업이 요청되었습니다.<br>${payload.requestData.alias}`, {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.init()
          return true
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        throw error
      } finally {
        this.loading.create = false
      }
    },
    /**
     * 업데이트 이벤트
     */
    async updateVsanIscsi (payload) {
      try {
        this.loading.update = true
        console.log('@updateVg: ', payload)
        const result = await API.work_v3.updateVsanIscsi(payload)

        if (result) {
          this.$alert(`vSAN iSCSI 실행 작업이 요청되었습니다.<br>${payload.requestData.alias}`, {
            dangerouslyUseHTMLString: true,
            callback: () => false
          })
          this.init()
          return true
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.update = false
      }
    },
    /**
     * 삭제 이벤트 (삭제 예정)
     */
    async deleteVsanIscsi (payload) {
      try {
        this.loading.delete = true
        const result = await API.work_v3.deleteVsanIscsi(payload)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.init()
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.delete = false
      }
    },
    /**
   * API: 바로 삭제
   */
    async forceDeleteResource (params) {
      try {
        this.loading.delete = true
        const result = await API.work_v3.forceDeleteResource(params)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          return true
        } else { return false }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.delete = false
      }
    },
    /**
    * 모달 닫기 전, 정말 취소하겠냐는 알람
    */
    beforeCloseModal (done) {
      this.$confirm(this.$v('내용을 저장하지 않고 취소하시겠습니까?'), '', {
      }).then(() => {
        done()
      }).catch(() => false)
    }
  },
  data (root) {
    return {
      loading: {
        create: false, // 생성
        update: false, // 수정
        delete: false // 삭제
      },
      interval: null,
      authTypes: {
        NONE: root.$v('없음'),
        CHAP: 'CHAP',
        MUTUAL_CHAP: root.$v('상호 CHAP')
      }
    }
  }
})
