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
    clearGetDbInterval () {
      clearInterval(this.interval)
      this.interval = null
    },
    /**
     * 정보 조회 interval
     */
    async getDbInterval () {
      await this.init()
      if (this.interval) this.clearGetDbInterval()
      this.interval = setInterval(async () => {
        await this.init()
      }, 10000)
    },
    /**
     * vm 업데이트 이벤트
     */
    async updateDb (userDbIdx, payload) {
      try {
        this.loading.updateDb = true
        console.log('@updateDb: ', payload)
        const result = await API.work.updateDb(userDbIdx, payload)

        if (result?.isSuccess) {
          this.$alert(this.$t('common.ALERT.DB.001', { databaseName: payload.orderData.databaseName }), { dangerouslyUseHTMLString: true }) // DB 수정 작업이 요청되었습니다.<br>{databaseName명}
          this.init()
          return true
        } else {
          this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
          if (result?.failMessage) console.error(result?.failMessage)
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      } finally {
        this.loading.updateDb = false
      }
    }
  },
  data () {
    return {
      loading: {
        updateDb: false
      },
      interval: null
    }
  }
})
