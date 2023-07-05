import { cloneDeep } from 'lodash'

export default {
  watch: {
    /**
     * [변경] 상태일 경우 체크박스를 비활성화 합니다.
     * @param {Boolean} status
     */
    isEditing (status) {
      const cloneData = cloneDeep(this.data)

      this.tableData = this.tableData.map((data, idx) => {
        // 변경 전 row 데이터
        const originalData = cloneData[idx]
        // 이미 작업상태가 있는 row들은 disable 유지
        data.disable = status ? true : originalData.disable
        data.checked = false
        // data.disable = status ? true : data.disable

        // 🌸 테스트용 입니다 - 의도적인 작업실패가 필요한 경우 사용
        // 사용방법 :: [사전협의] 에서 hostname 삭제한 후, 다시 주석처리해서 [할일]로 보냄
        // delete data.hostname
        return data
      })

      if (status) this.checkedData = []
    }
  },
  computed: {
    autoUnEditable () {
      // [할일] 에서 작업이 [자동] 인 경우, 변경이 불가능하도록 차단합니다.
      const autoStatus = this.tableData[0].autoStatus
      return (autoStatus !== undefined && autoStatus.todoType === 'AUTO')
    }
  },
  methods: {
    /**
     * [한 일], [할 일] 일 때, 작업실행 관련 칼럼을 추가합니다.
     */
    setColumns (bindings) {
      // 사전협의, 할일 인 경우
      if (this.field === 'conference' || this.field === 'todo') {
        this.columns = this.columns.map(column => {
          if (bindings) {
            const isRequired = bindings.includes(column.binding)
            if (isRequired && this.editable && !this.allSuccess) column.required = true
          }
          return column
        })
      }

      // 할일, 한일 인 경우
      const executeCol =
      // 작업 상태
        { header: this.$t('common.GRID.workState'), binding: 'workResult', customHtml: true, width: 200, keyPath: 'common.GRID.workState' }
      if (this.field === 'todo' || this.field === 'done') this.columns.push(executeCol)

      if (this.isCreateTime) {
        const createTimeColumn = { header: '생성 시간', binding: 'createTime', customHtml: true, dataType: 'Date' }
        this.columns.push(createTimeColumn)
      }
    },
    /**
     * 데이터를 저장하지않고 취소합니다.
     */
    cancelUpdate () {
      // 변경을 취소하시겠습니까?
      return this.$confirm(this.$t('common.ALERT.CONF.020'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.isEditing = false
        if (this.field === 'conference') {
          this.tableData = cloneDeep(this.data)
          if (this.orderTypeIsChange) this.orderTypeIsChange() // Compute 자원일 경우 - 변경 데이터 이전데이터와 동일하게 세팅
        } else if (this.field === 'todo') this.$parent.$parent.setTaskTodoInfo(this.orderNo)
      }).catch(() => false)
    },
    /**
     * 상태가 진행중인지 확인합니다.
     */
    checkIsRunning () {
      return this.checkedData.some(item => {
        return item.workResult?.dataStatus === 'PROCEED' || item.workResult?.dataStatus === 'WAIT'
      })
    }
  },
  data () {
    return {
      /**
       * row 의 작업상태가 실패거나 || 작업상태가 없을 경우에만 변경할 수 있습니다.
       */
      blockEdit (row) {
        if (row.workResult) {
          const status = row.workResult?.dataStatus
          return status && status !== 'ERROR'
        } return false
      },
      /**
       * 모든 자원의 작업 상태가(성공, 작업중, 작업 대기) 있고 || 작업 상태가 실패가 없는 경우
       * 변경하지 못하도록 차단합니다.
       * setInterval 이 돌면서 변화를 감지하여, 변경 버튼을 disable 시키기 위해서 사용합니다.
       */
      allWorking (table) {
        return table.every(row => {
          const result = row.workResult
          const dataStatus = result?.dataStatus
          return result && dataStatus && dataStatus !== 'ERROR'
        })
      },
      /**
       * [삭제] 자원일 경우 [변경] 버튼을 노출시키지 않습니다.
       */
      isDeleteResource (table = this.tableData) {
        return table.some(data => data.meta && data.meta.orderType === 'DELETE')
      },
      /**
       * [삭제] 자원일 경우 필수항목(required *)을 모두 false 로 설정합니다.
       */
      setUnrequiredColumns (table = this.tableData) {
        if (this.isDeleteResource(this.tableData)) {
          this.columns = this.columns.map(col => {
            col.required = false
            return col
          })
        }
      }
    }
  }
}
