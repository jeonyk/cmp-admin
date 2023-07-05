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
      if (this.interval) this.clearGetDbInterval()

      const callbackFlag = false
      this.interval = setInterval(async () => {
        if (!callbackFlag) await this.init()
      }, 10000)
    },
    /**
     * DB 생성 이벤트
     */
    async createDb (payload) {
      try {
        this.loading.createDb = true
        const result = await API.work_v3.createNxDb(payload)

        if (result) {
          this.$alert(this.$v('{service} 실행 작업이 요청되었습니다.<br>{name}', {
            field: 'Database',
            name: payload.requestData.databaseName
          }), { dangerouslyUseHTMLString: true })
          this.init()
          return true
        } return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true
        })
      } finally {
        this.loading.createDb = false
      }
    },
    /**
     * DB 업데이트 이벤트
     */
    async updateDb (payload) {
      try {
        this.loading.updateDb = true
        console.log('@updateDb: ', payload)
        const result = await API.work_v3.updateNxDb(payload.requestData.userDbIdx, payload)

        if (result) {
          this.$alert(this.$v('{service} 실행 작업이 요청되었습니다.<br>{name}', {
            field: 'Database',
            name: payload.requestData.databaseName
          }), { dangerouslyUseHTMLString: true }) // DB 수정 작업이 요청되었습니다.<br>{databaseName명}
          this.init()
          return true
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), {
          dangerouslyUseHTMLString: true
        })
      } finally {
        this.loading.updateDb = false
      }
    },
    /**
    * 바로 삭제 이벤트
    */
    async forceDeleteResource (params) {
      try {
        this.loading.deleteDb = true
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
        this.loading.deleteDb = false
      }
    },
    /**
     * DB 자원 삭제 이벤트
     */
    async deleteDb (userDbIdx, payload) {
      try {
        this.loading.deleteVm = true
        const result = await API.work_v3.deleteNxDb(userDbIdx, payload)

        if (result) {
          this.$alert(this.$v('자원을 삭제하였습니다.'), () => false)
          this.init()
        } else return false
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.'), { dangerouslyUseHTMLString: true })
      } finally {
        this.loading.deleteVm = false
      }
    }

  },
  data () {
    return {
      loading: {
        createDb: false,
        updateDb: false,
        deleteDb: false
      },
      interval: null
    }
  }
})
