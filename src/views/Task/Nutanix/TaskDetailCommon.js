
export default {
  methods: {
    /**
     * [AWS 프로젝트 생성/삭제] 모달
     * @param { Object } item
     * @param { Boolean } status
     */
    activePublicProject (item, status) {
      this.publicProjectModal = { item, view: status }
      if (!status) this.gridRefresh(this.grid)
    }
  },
  data () {
    return {
      grid: null,
      gridData: null,
      /**
       * 업무 공통 상태
       */
      status: {
        REQUEST: { color: 'ing', ko: this.$t('task.STATE.request') }, // 요청
        WAIT: { color: 'wait', ko: this.$t('task.STATE.wait') }, // 대기
        PROCEED: { color: 'ing', ko: this.$t('task.STATE.progress') }, // 처리중
        DELAY: { color: 'delay', ko: this.$t('task.STATE.delay') }, // 지연
        DONE: { color: 'confirm', ko: this.$t('task.STATE.complete') }, // 완료
        REJECT: { color: 'reject', ko: this.$t('task.STATE.reject') }, // 반려
        FAIL: { color: 'delay', ko: this.$t('task.STATE.fail') }, // 실패
        ERROR: { color: 'delay', ko: this.$t('task.STATE.error') }, // 오류
        confirm: { color: 'complete', ko: this.$t('task.STATE.confirm') }, // 완료
        undefined: { color: '', ko: this.$t('task.STATE.unde') } // 미정
      },

      /**
       * 에러메세지 정의 (NTX)
       */
      catchMessage (error, defaultMessage) { // 에러메세지 모두 정의
        const key = error.response.data.message
        const message = {
          'Some of item is not finished': this.$v('작업이 완료되지 않은 자원이 있습니다.'),
          'Service is currently unavailable.': this.$v('사용할 수 없는 자원입니다.'),
          'Spec changed after config, Please update configuration.': this.$v('[자원할당] 변경 후 [자원정보]가 수정되었습니다.<br> [자원할당]을 다시 설정해주세요.'),
          'Item changed after Document, Please update Document.': this.$v('[자원할당] 또는 [자원정보]가 변경되었습니다.<br>보고서를 다시 작성해주세요.'),
          'item is unexecutable status': this.$v('작업 실행이 불가능한 작업상태의 자원이 포함되어있습니다.')
        }[key] || defaultMessage || key

        this.$alert(message, { dangerouslyUseHTMLString: true })
      },

      // =========== PUBLIC =============
      publicProjectDetail: null,
      approvalStatus: true, // 결재 미사용 여부
      publicProjectModal: {}
    }
  }
}
