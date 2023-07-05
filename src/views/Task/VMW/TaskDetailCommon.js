
export default {
  methods: {
    /**
     * Compute 자원 삭제시에는, 해당 vm 이 다른 vm 에 영향을 미치는지 확인해야합니다.
     * 해당 함수로 확인 및 알림을 줍니다.
     * [삭제] 건 을 승인하는 경우, 사용되고있는 vm 인지 모든 결재 플로우에서 확인합니다. (Compute 일 경우에만 확인)
     * apprList 사전협의
     * orderList 주문
     * todoList 할 일
     * basketDataList 장바구니
     */
    async setUsingVmsToText (allResp) {
      // 영향을 받는 자원들이 없을 경우 => 바로 결재 플로우로 넘어갑니다
      const isAffected = allResp.filter(resp => resp.isOpenAlert)
      if (!isAffected.length) return true

      // 영향을 받는 자원이 있을 경우 object 로 자원 정리
      const keys = ['apprList', 'basketDataList', 'orderList', 'todoList']
      const result = {}
      const setLists = key => {
        const temp = []
        allResp.forEach(data => data[key].forEach(list => temp.push(list)))

        if (temp.length) result[key] = temp
      }

      keys.forEach(key => setLists(key))

      // 사용중인 자원의 리스트를 텍스트로 변환
      for (const key in result) {
        const data = result[key]
        const getHint = this.sourceKeys[key]

        // 실질적으로 사용되는 리스트
        const affectedLists = data.map(orderData => {
          const hint = orderData[getHint]

          if (!hint) {
            // 장바구니는 주문 번호가 없으므로 각 자원의 name 을 보여줍니다
            const workType = {
              COMPUTE: 'hostname',
              SECURITY: 'securityGroupName',
              NETWORK_L4: 'vrserverName',
              NETWORK_L7: 'csVrserverName',
              STORAGE: 'storageName',
              DATABASE: 'hostname',
              MARKET: 'hostname'
            }[orderData.workType]
            return orderData.orderData[workType]
          }

          return hint
        })

        const list = Array.from(new Set(affectedLists)).join(', ')
        this.connectedVmData[key].data = list
      }

      // 텍스트 가공
      const rawText = []
      for (const key in this.connectedVmData) {
        const list = this.connectedVmData[key]
        const { title, data } = list
        if (data.length) rawText.push(`${title}: ${data}`)
      }

      const text = `${rawText.join('<br />')} <br/ ><br />`

      // Compute 자원 삭제의 경우<br />연결된 자원에 영향을 미칠 수 있습니다.<br>계속 진행하시겠습니까?
      return this.$confirm(text + this.$t('common.CONFIRM.APPROVAL.004'), {
        dangerouslyUseHTMLString: true,
        confirmButtonText: this.$t('common.TERMS.yes'),
        cancelButtonText: this.$t('common.TERMS.no')
      })
        .then(() => true)
        .catch(() => false)
    },

    /**
     * [AWS 프로젝트] 생성 모달을 세팅합니다 (사전협의 / 할일 / 한일 모두 공통 형태)
     */

    /**
     * [AWS 프로젝트 생성/삭제] 모달
     * @param { Object } item
     * @param { Boolean } status
     */
    activePublicProject (item, status) {
      this.publicProjectModal = { item, view: status }
      if (!status) this.gridRefresh(this.grid)
    },
    initGrid (grid, data) {
      this.grid = grid
      this.gridData = data

      const { page } = this.$route.query
      if (!page) return

      this.$nextTick(() => {
        if (this.gridData) this.gridData.moveToPage(Number(page) - 1)
      })
    },
    gridRefresh (grid) {
      if (!grid) return
      const cv = grid.collectionView
      cv.refresh()
    }
  },
  data () {
    return {
      grid: null,
      gridData: null,
      connectedVmData: {
        apprList: { title: this.$t('task.PRIOR.title'), data: [] }, // 사전협의
        basketDataList: { title: this.$t('task.USR.cart'), data: [] }, // 장바구니
        orderList: { title: this.$t('task.USR.orderBasket'), data: [] }, // 주문함
        todoList: { title: this.$t('bc.TASK.todo'), data: [] } // 할 일
      },
      sourceKeys: {
        apprList: 'approvalNo',
        // basketDataList: '', // 장바구니는 주문 번호가 없으므로 각 자원의 name 을 보여줍니다
        orderList: 'orderNo',
        todoList: 'orderNo'
      },
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

      // =========== PUBLIC =============
      publicProjectDetail: null,
      approvalStatus: true, // 결재 미사용 여부
      publicProjectModal: {}
    }
  }
}
