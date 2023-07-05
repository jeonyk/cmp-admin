import { CellRange } from '@grapecity/wijmo.grid'
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState({
      user: state => state.auth.user,
      cloud: state => state.cloud.cloud.toUpperCase(),
      moduleType: state => state.cloud.shortlyCloud
    })
  },
  data () {
    return {
      grid: null,
      currpage: 1,
      pageSize: 10,
      sortedCol: null,
      totalResultCnt: 0,
      calculateExternalDisk (diskList) {
        const externalDisks = []
        const disks = []

        // 🌸 디버깅용
        // const debuggingDisk = diskList.map(disk => { return { type: disk.deviceBus, size: disk.size, disk: disk.diskIndex === 0 } })

        if (diskList.length) {
          // Disk 사이즈
          diskList.forEach(disk => {
            if (disk.deviceBus === 'SCSI' && disk.diskIndex === 0) disks.push(disk.diskSize || 0)
            else externalDisks.push(disk.diskSize || 0)
          })
        }

        const sum = (array) => {
          if (!array.length) return 0
          return array.reduce((acc, curr) => {
            acc += curr
            return acc
          })
        }

        const externalDisk = sum(externalDisks)
        const disk = sum(disks)

        // console.log(debuggingDisk, { externalDisks, externalDisk, disk })
        return { externalDisks, externalDisk, disk }
      },
      catchMessage (error, defaultMessage) {
        const { code, message: msg } = error.response.data
        const message = {
          // SM101: this.$v('The parameter is empty.'),
          // SM102: this.$v('The software script is empty.'),
          // SM103: this.$v('The software is empty.'),
          // SM104: this.$v('The software version is blank.'),
          // SM105: this.$v('The software script detail is blank.'),
          // SM106: this.$v('The vm of the parameter received from Nutanix is empty.'),
          // SM111: this.$v('The software list is empty.'),
          // SM113: this.$v('The software version list is empty.'),
          // SM114: this.$v('The list of software scripts is empty.'),
          // SM115: this.$v('The software script detail list is empty.'),
          // SM116: this.$v('The code list corresponding to INSTALLER_FILE is empty.'),
          // SM117: this.$v('The minion list is empty.'),
          // SM118: this.$v('The sls file format is different.'),
          // SM119: this.$v('No files.'),
          // SM121: this.$v('The software script type is incorrect.'),
          // SM122: this.$v('No software available.'),
          // SM123: this.$v('There is no software version available.'),
          // SM124: this.$v('There are no software scripts available.'),
          // SM125: this.$v('There are no software script details available.'),
          // SM131: this.$v('No corresponding software script details.'),
          // SM132: this.$v('No corresponding software file.'),
          // SM133: this.$v('There is no corresponding software script.'),
          // SM134: this.$v('There is no such software.'),
          // SM135: this.$v('There is no corresponding software version.'),
          // SM136: this.$v('There is no corresponding minion.'),
          // SM141: this.$v('There must be only one software version.'),
          // SM142: this.$v('There must be only one software script.'),
          // SM143: this.$v('There must be one software script detail.'),
          // SM151: this.$v('The minion\'s hostname is required.'),
          // SM152: this.$v('The software version ID is required.'),
          // SM153: this.$v('Software license IDX is required.'),
          // SM154: this.$v('OS Type is required.'),
          // SM155: this.$v('Bit Type is a required value.'),
          // SM156: this.$v('The script detail type is incorrect.'),
          SM181: this.$v('스크립트가 이미 존재합니다.'),
          SM182: this.$v('해당 버전이 이미 존재합니다.'),
          SM183: this.$v('해당 설치프로그램 명이 이미 존재합니다.')
        }[code] || defaultMessage || msg

        return this.$alert(message, '', { dangerouslyUseHTMLString: true, callback: () => false })
      }

    }
  },
  methods: {

    /**
     * [설치] 클릭 버튼 클릭시 하단 스크립트 영역 출력
     * @param { Object } row
     * @param { String } key row 를 찾을 고유 키값
     */
    installAddRow (row, key) {
      row._open = !row._open

      const index = this.installHistoryData.findIndex(vm => vm[key] === row[key]) // 삽입할 index 위치를 먼저 확인
      const installResult = this.installResult(row)
      const info = { installing: true, isOngoing: row.isOngoing, installResult, row, isSelectable: false }

      // 해당 위치 바로 하단에 삽입
      if (row._open) this.installHistoryData.splice(index + 1, 0, info) // row 추가
      else this.installHistoryData.splice(index + 1, 1) // row 삭제

      // 마지막 row일 경우에 삽입 하면 다음장으로 넘어가 버려서 (11), 1 페이지 이상일 경우 첫 번째 row에 추가하면 앞장으로 넘어가버려서 (9)
      // console.log(cell.index)
      // this.pageSize = (this.currPage > 1 && cell.index === 0) || (cell.index % 9 === 0) ? 11 : 10
    },

    /**
     * 하단 설치 진행상황 메세지 세팅
     * @param {Object} row
     */
    installResult (row) {
      const base = `$ ${row.vmName}[${row.osType}] > `

      // 설치를 한번도 진행하지 않은경우
      if (!row.progressList.length) return base + '...'

      // 🟧
      const keys = [
        // state // 진행 상태
        { key: 'loginStartTime', dataType: 'time', message: this.$v('로그인 시작') }, // 로그인 시작 시간
        { key: 'loginEndTime', dataType: 'time', message: this.$v('로그인 종료') }, // 로그인 종료 시간
        { key: 'isLogin', dataType: 'boolean', message: this.$v('로그인') }, // 로그인 성공 여부
        { key: 'pingEndTime', dataType: 'time', message: this.$v('PING 종료') }, // 핑 종료 시간
        { key: 'pingStartTime', dataType: 'time', message: this.$v('PING 시작') }, // 핑 시작 시간
        { key: 'isPing', dataType: 'boolean', message: this.$v('PING') }, // 핑 성공 여부
        { key: 'isRefresh', dataType: 'boolean', message: this.$v('Refresh') }, // Refresh 성공 여부
        { key: 'isResponse', dataType: 'boolean', message: this.$v('응답') }, // 응답 여부
        { key: 'isRunning', dataType: 'boolean', message: this.$v('동기화 중') }, // 동기화 중 여부
        { key: 'refreshStartTime', dataType: 'time', message: this.$v('db Refresh 시작') }, // db Refresh 시작 시간
        { key: 'refreshEndTime', dataType: 'time', message: this.$v('db Refresh 종료') }, // db Refresh 종료 시간
        { key: 'responseEndTime', dataType: 'time', message: this.$v('응답 종료') }, // 응답 종료 시간
        { key: 'responseStartTime', dataType: 'time', message: this.$v('응답 시작') }, // 응답 시작 시간
        { key: 'result', dataType: 'string', message: this.$v('결과') }, // 결과
        { key: 'failMessage', dataType: 'string', message: this.$v('실패 메세지') }, // 실패 메세지
        { key: 'failTrace', dataType: 'string', message: this.$v('실패 위치') } // 실패 위치
      ]

      let result = ''
      for (const progress of row.progressList) {
        if (progress.state !== 'IN_PROGRESS') continue

        // 상세 데이터 확인
        keys.forEach(item => {
          const { key, dataType, message } = item
          const value = progress[key] // 데이터 값

          // 값의 형태 가공
          const info = {
            time: val => this.$options.filters.date(val, 'YYYY.MM.DD HH:mm:ss'), // 날짜형식은 가공함
            boolean: val => (val ? this.$v('성공') : this.$v('실패')), // 성공/실패 여부
            string: val => val // string은 값을 그대로 노출
          }[dataType]

          if (value !== null) result += `${base}${message} [${info(value)}] \n`
        })
      }

      if (!result) result += base + '...'
      return result
    },

    // ======================
    // ====== 그리드 설정 ======
    // ======================
    initGrid (grid) {
      this.grid = grid

      // sorting 이벤트 발생할 경우 저장
      grid.sortingColumn.addHandler((s, e) => {
        const col = s.columns[e.col]
        const asc = col.currentSort !== '+'

        this.sortedCol = { binding: col.binding, asc }
      })

      // [진행상황] 가로 병합
      grid.mergeManager.getMergedRange = (panel, r, c, clip) => {
        const rng = new CellRange(r, c)
        const dataItem = panel.rows[rng.row].dataItem
        // console.log(panel.cellType, dataItem, rng)

        // header merge (커스텀으로 ...)
        if (panel.cellType === 2) {
          // 세로(row) 병합
          for (let i = rng.row; i < panel.rows.length - 1; i++) {
            if (panel.getCellData(i, rng.col, true) !== panel.getCellData(i + 1, rng.col, true)) { break }
            rng.row2 = i + 1
          }

          for (let i = rng.row; i > 0; i--) {
            if (panel.getCellData(i, rng.col, true) !== panel.getCellData(i - 1, rng.col, true)) { break }
            rng.row = i - 1
          }
        }

        if (dataItem && dataItem.installing) {
          // 가로(column) 병합
          for (let i = rng.col; i < panel.columns.length - 1; i++) rng.col2 = i + 1
          for (let i = rng.col; i > 0; i--) rng.col = i - 1
        }

        return rng
      }
    },

    gridRefresh () {
      const cv = this.grid.collectionView
      if (cv) cv.refresh()
      this.selectedRows = []
    },

    addedItemFormatter (panel, r, c, cell) {
      if (panel.cellType === 2) return false

      panel.rows.forEach((row, idx) => {
        if (row.dataIndex !== -1) row.height = 70
        // 설치 실행 영역 row hover 효과 덮어썼음
        if (row.dataItem && row.dataItem.installing === true) {
          row.height = 380
          row.cssClass = 'is-shell-script'
        }
      })

      this.setSelectedRowsStyle()
    },

    /**
     * 멀티 셀렉트 사용시 페이지를 이동할때 자동으로 이전페이지의 선택된 항목을 선택하게 합니다.
     */
    setSelectedRowsStyle (page) {
      if (page) this.currpage = page
      const selectedRowsIdx = this.selectedRows.map(item => item.vmUuid)

      this.$nextTick(() => {
        this.grid.rows.forEach(row => {
          const indexOf = selectedRowsIdx.indexOf(row.dataItem.vmUuid)
          if (indexOf > -1) {
            row.dataItem.isSelected = true
            row.cssClass = 'selected-row'
          }
        })
      })
    }
  }
}
