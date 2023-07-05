import { cloneDeep } from 'lodash'

/*
  @@ [workState] 값 정리

  - REVIEW : 사전협의
  - CANCELED_AT_REVIEW : 모든 자원이 취소됨(사전협의)
  - CANCELED_AT_TODO : 모든 자원이 취소됨(할일)
  - APPROVAL1 : 사전협의(작업계획서/사후완료보고서) 결재중
  - APPROVAL1_REJECTED : 사전협의 결재 반려
  - TODO : 할일
  - TODO_FINISHED : 할일 완료 (결재요청 가능) // 사전협의와 달리 가능상태 관리 가능
  - APPROVAL2 : 완료보고서
  - APPROVAL2_REJECTED : 완료보고 결재 반려
  - DONE_BY_CANCELED : 취소에 의한 한일
  - DONE : 한일

  @@ [workItemState] 값 정리

  - INSUFFICIENT : 업무 진행을 할 수 없는 경우 ex) ip 할당이 안된 network
  - INIT : 신규 (사전협의)
  - CANCELLING : 취소중인 상태 (복원 가능 복원시 사전협의->INIT 할일->READY_TO_WORK)
  - CANCELED_AT_REVIEW : 사전협의에서 작업취소 (컨펌)
  - CANCELED_AT_TODO : 할일에서의 작업취소 (컨펌)
  - READY_TO_WORK : 수동작업대기 (할일:작업전)
  - SCHEDULED : 자동작업대기
  - SCHEDULE_PAUSED : 자동작업중지(예약설정 시간이 과거인 경우)
  - WORKING : 작업중 삭제중에 구성관리에서 삭제 취소시 --> 실패 보다는 취소 (취소는 복원이 가능)
  - DELETE_STANDBY : 주문 유형이 삭제인경우 작업 실행시 삭제 대기중
  - FAILING : 실패 중인 상태
  - FAIL_CONFIRMED : 실패-실패처리
  - FAIL_AS_SUCCESS : 실패-성공처리
  - SUCCESS : 성공
  - SUCCESS_BY_HAND : 별도처리 (변경건에서만 노출)
 */

export default {
  inject: ['$field_V3', '$orderType'],
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

    /**
     * [할일] 에서 자원은 => [체크]가능 [편집] 불가능
     * [긴급] 자원일때는  => [체크] 와 [편집] 모두 불가능
     * [일반] 자원일때는  => [체크] 와 [편집] 모두 가능
     */
    workable () {
      const isUrgent = this.$orderType() === 'URGENT'
      const isChange = this.$orderType() === 'CHANGE'
      const isDelete = this.$orderType() === 'DELETE'

      const TODO = this.$field_V3() === 'TODO'
      const DONE = this.$field_V3() === 'DONE'

      if (TODO || DONE) return false
      return this.editable && !(isUrgent || isChange || isDelete)
    },
    /**
     * [신규] 건에서만 자원 할당 가능
     * 긴급 / 변경 / 삭제 건에서는 자원 할당 불가능
     */
    showSetting () {
      const isNew = this.$orderType() === 'NEW'
      return isNew
    }
  },
  methods: {

    /**
     * [사전협의 / 할일 / 한일] 일 때, 작업실행 관련 칼럼을 추가합니다.
     * @param {Array} rawColumns 각 자원의 컬럼
     * @return {Array} 재가공한 컬럼
     */
    setColumns_V3 (rawColumns = this.columns, key) {
      const setRawColumns = rawColumns[key]

      const isNew = this.$orderType() === 'NEW'
      const workable = this.workable
      // const isUrgent = this.$orderType() === 'URGENT'

      const required = isNew && workable // || isUrgent

      const columns = [
        { header: this.$v('예약설정'), binding: 'scheduling', width: 130 },
        { header: this.$v('설정'), binding: 'setting', width: 130, customHtml: true, required },
        { header: this.$v('자원 정보'), binding: 'info', width: 130, customHtml: true },
        { header: this.$v('작업 상태'), binding: 'workResult', width: 160, customHtml: true }
      ]

      // [사전협의]인 경우 = 작업상태 없음
      if (this.$field_V3() === 'CONFERENCE') columns.splice(-1, 1)
      // [STORAGE] 인 경우 = 자원할당 없음
      if (key === 'STORAGE') columns.splice(1, 1)

      return cloneDeep([...setRawColumns, ...columns])
    },

    /**
     * [주문복원 / 주문취소 / 예약설정] 버튼
     * @param {Object} $event
     */
    clickSourceButtonEvent ($event) {
      this.$emit($event, this.checkedData)
      // this.checkedData = []
    },

    /**
     * [할일] 에서 체크박스에 변화가 일어날 때 발생합니다.
     * @param {Array} rows 체크된 모든 rows
     */
    checkedRows (rows) {
      console.log('%c ## CHECKED', 'color: #B996FF')
      this.checkedData = rows
    },

    /**
     * 체크 여부 세팅
     * @param {Array} data
     */
    setCheckedSrcIdx () {
      const data = this.checkedData
      const object = new Set()
      for (const { srcIdx } of data) object.add(srcIdx)
      return object
    },

    /**
     * [자원 정보] 모달을 핸들링
     * @param {Object|null} data
     */
    async selectSourceInfo (data) {
      this.updateItem = data.row
      this.resourceInfoModal = true
    },

    /**
     * [자원할당] 변경시 발생하는 이벤트를 입력합니다.
     * @param {Object} data 선택한 테이블 row
     */
    async selectAssignInfo (data) {
      // 이미 [자원할당]이 등록되어 있는경우 configJson 사용
      const updateItem = (Object.keys(data.row.configJson).length > 0) ? data.row.configJson : data.row
      this.updateItem = updateItem
      this.setTaskSourceModal = true
    },

    /**
     * [자원할당] 정보 저장
     * @param {Object} selectedItem { cluster: 선택한 클러스터, node: 선택한 노드 }
     */
    saveAssignInfo (selectedItem) {
      this.$emit('update-source', { row: this.updateItem, data: selectedItem })
    },

    /**
     * [주문 취소/복원] Grid CSS class 설정
     */
    initGrid (grid) {
      const regex = new RegExp(/CANCELLING|CANCELED_AT_/)

      grid.rows.forEach((row, idx) => {
        row.cssClass = regex.test(this.tableData[idx].workItemState) ? 'canceled-row' : undefined
      })
    }
  },
  data () {
    return {
      columns: [],
      rawColumns: {
        COMPUTE: [
          { header: this.$v('호스트 명'), binding: 'hostname', width: 150 },
          { header: this.$v('OS 이미지'), binding: 'osName' },
          { header: 'Network', binding: 'networkList', customHtml: true },
          { header: 'VCPU', binding: 'vcpu', width: 100, customHtml: true, unit: 'Core' },
          { header: 'Memory', binding: 'memory', width: 100, customHtml: true, unit: 'GB' },
          { header: 'RootDiskSize', binding: 'displayRootDiskSize', width: 150 },
          { header: 'LocalDisk', binding: 'externalDiskListSum', width: 170, customHtml: true },
          { header: this.$v('설치프로그램'), binding: 'installProgram', width: 130, customHtml: true }
        ],
        STORAGE: [
          { header: 'VG Name', binding: 'storageName' },
          { header: this.$v('클러스터'), binding: 'clusterName' },
          { header: this.$v('연결 호스트'), binding: 'vmList', customHtml: true },
          { header: this.$v('크기(신청 용량)'), binding: 'diskList', customHtml: true }
        ],
        MARKETPLACE: [
          { header: this.$v('호스트명'), binding: 'hostname', width: 150, customHtml: true },
          { header: 'Application', binding: 'pgName' },
          { header: this.$v('OS 이미지'), binding: 'osName' },
          { header: 'Network', binding: 'networkList', width: 150, customHtml: true },
          { header: 'VCPU', binding: 'vcpu', width: 100, customHtml: true },
          { header: 'Memory', binding: 'memory', width: 100, customHtml: true },
          { header: 'RootDiskSize', binding: 'rootDiskSize', width: 100, customHtml: true },
          { header: 'LocalDisk', binding: 'externalDiskList', width: 170, customHtml: true },
          { header: this.$v('설치프로그램'), binding: 'installProgram', width: 130, customHtml: true }
        ],
        DATABASE: [
          { header: this.$v('호스트 명'), binding: 'hostname' },
          { header: this.$v('이름'), binding: 'databaseName' },
          { header: 'DB Engine/Version', binding: 'engineInfo' },
          { header: this.$v('OS 이미지'), binding: 'osInfo' },
          { header: 'DB Schema', binding: 'initialDbName' },
          { header: 'DB Size', binding: 'rootDiskSize', width: 90, customHtml: true },
          { header: 'DB Port', binding: 'port', width: 90 }
        ],
        FILE_SERVER: [
          { header: 'Share name', binding: 'shareName' },
          { header: 'Network', binding: 'networkList', customHtml: true },
          { header: this.$v('신청용량'), binding: 'displayMaxGiBSize' },
          { header: this.$v('프로토콜 타입'), binding: 'protocolType' }
        ],
        NETWORK_L4: [
          { header: this.$v('로드밸런스명'), binding: 'vrserverName' },
          { header: this.$v('포트'), binding: 'port', format: 'd*' },
          { header: this.$v('프로토콜'), binding: 'protocolType' },
          { header: this.$v('방식'), binding: 'method' }
        ],
        NETWORK_L7: [
          { header: this.$v('로드밸런스명'), binding: 'csVrserverName' },
          { header: this.$v('도메인'), binding: 'domain' },
          { header: this.$v('포트'), binding: 'port', format: 'd*' },
          { header: this.$v('프로토콜'), binding: 'protocolType' },
          { header: this.$v('방식'), binding: 'method' }
        ],
        SECURITY: [
          { header: this.$v('보안 그룹명'), binding: 'securityGroupName' },
          { header: this.$v('시작일'), binding: 'startTime', customHtml: true, dataType: 'Date' },
          { header: this.$v('만료일'), binding: 'endTime', customHtml: true, dataType: 'Date' }
        ],

        VM: [
          { header: this.$v('호스트 명'), binding: 'hostname', width: 150 },
          { header: this.$v('OS 이미지'), binding: 'osName' },
          { header: 'Network', binding: 'networkList', customHtml: true },
          { header: 'VCPU', binding: 'vcpu', width: 100, customHtml: true, unit: 'Core' },
          { header: 'Memory', binding: 'memory', width: 100, customHtml: true, unit: 'GB' },
          { header: 'RootDiskSize', binding: 'displayRootDiskSize', width: 150 },
          { header: 'LocalDisk', binding: 'externalDiskListSum', width: 170, customHtml: true },
          { header: this.$v('설치프로그램'), binding: 'installProgram', width: 130, customHtml: true }
        ],
        VSAN_ISCSI: [
          { header: this.$v('별칭'), binding: 'alias' },
          { header: 'Network', binding: 'networkList', customHtml: true },
          { header: this.$v('인증'), binding: 'authentication' },
          { header: 'LUN', binding: 'lunList', customHtml: true, unit: 'Core' }
        ]
      },
      /**
       * [작업 상태] 확인
       * @param {Object} row 티켓의 상태
       */
      workState ({ workItemState }) {
        const regex = /WORKING|FAILING|FAIL_CONFIRMED|FAIL_AS_SUCCESS|SUCCESS/g
        if (!regex.test(workItemState)) return undefined

        return {
          WORKING: { state: this.$v('진행중'), type: 'is-ing' },
          SUCCESS: { state: this.$v('성공'), type: 'is-success' },
          FAILING: { state: this.$v('실패'), type: 'is-fail' }
        }[workItemState]
      },

      /**
       * [자원 할당 설정/수정] 텍스트
       * @param {Object} row - config 등록 여부
       */
      displayConfigSettingText ({ configJson }) {
        const keys = Object.keys(configJson)
        const text = (keys.length > 0) ? this.$v('자원 할당 수정') : this.$v('자원 할당 설정')
        return text
      },

      /**
       * [자원 할당 설정/수정] 텍스트 컬러 추가
       * @param {Object} row - config 등록 여부
       */
      displayConfigSettingClassName ({ configJson }) {
        if (!this.workable) return undefined // 편집 가능한 경우만 className 추가

        const keys = Object.keys(configJson)
        const className = (keys.length > 0) ? '-setting' : undefined
        return className
      },

      // ======
      // ======
      // ======
      // ======
      // ======
      // ======
      // ======
      // ======

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
