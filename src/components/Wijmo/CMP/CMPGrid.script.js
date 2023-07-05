/**
  * 파일명 : CMPGrid.script.js
  * 파일 기능 :
  * 작성자 : 정재은 외 5명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 Update: sorting 이슈 수정 완료
 **/

import * as wjGrid from '@grapecity/wijmo.grid'
import { Control, CollectionView, SortDescription } from '@grapecity/wijmo'
import * as wjCore from '@grapecity/wijmo'
import ExcelDownload from '@/components/ExcelDownload/ExcelDownload'
// import * as wjFilter from '@grapecity/wijmo.grid.filter'
// import { image } from 'html2canvas/dist/types/css/types/image'

export default {
  name: 'CMPGrid',
  components: {
    'excel-download': ExcelDownload
  },
  props: {
    columns: { // table의 컬럼을 입력합니다.
      type: Array,
      default: () => [],
      required: true
    },
    columnGroup: { // header가 병합될 경우 단독으로 사용합니다. - column-group 사용시
      type: Boolean,
      default: false
    },
    headerVisibility: { // 헤더에 표시 할 데이터
      type: String,
      default: 'Column',
      validator (value) {
        return ['All', 'None', 'Column', 'Row'].includes(value)
      }
    },
    // header가 병합될 경우 관련 정보를 받아 헤더를 병합합니다.
    // 프로퍼티 : colSpan은 가로로 병합 | rowSpan은 세로로 병합합니다.
    headerMerge: {
      type: Object,
      default: () => {}
    },
    headerCheckbox: { // table thead에 체크박스를 사용합니다.
      type: Boolean,
      default: false
    },
    useCheckbox: { // table에 체크박스를 사용합니다.
      type: Boolean,
      default: false
    },
    allCheckboxDisable: { // table thead에 체크박스까지 모두 disabled 시킵니다.
      type: Boolean,
      default: false
    },
    itemSource: { // table의 데이터를 입력합니다.
      type: Array,
      default: () => [],
      required: true
    },
    initCustomAction: { // cmp-grid를 호출하는 각 컴포넌트에서 개별로 필요한 기능을 컴포넌트에서 직접 사용할 수 있습니다.
      type: Function,
      default: () => {}
    },
    selectable: { // row를 선택하여 class를 관리하며 기능이 필요한 경우 사용합니다. slot창의 내용을 참조해주세요
      type: Boolean,
      default: false
    },
    keepSelect: {
      type: Boolean, // selectable와 함께 사용합니다. 선택된 row 와 동일한 클릭해도 변화가 없습니다 (껐다 켰다 사용 X 일 경우)
      default: false
    },
    multiSelect: { // 여러개 를 select 할 수 있습니다.
      type: Boolean,
      default: false
    },
    routable: { // row를 클릭하면 페이지가 이동합니다.
      type: [String, Boolean, Object],
      default: null
    },
    searching: { // 검색 기능을 사용할 경우 true를 입력합니다.
      type: Boolean,
      default: false
    },
    pagingType: { // ['append', 'pagination', 'list']
      type: String,
      default: 'pagination',
      validator (value) {
        // append = 더보기 버튼, pagination = 페이징처리, list = 그냥 리스트
        return ['append', 'pagination', 'list'].includes(value)
      }
    },
    pageKeeping: { // 선택한 page가 있는경우 저장합니다
      type: Boolean,
      default: false
    },
    height: { // pagingType이 list일 때 height를 지정해주세요!
      type: Number,
      default: undefined
    },
    pagingSize: { // 몇 개씩 보여줄 것인지 설정합니다.
      type: Number,
      default: 10
    },
    cellMerge: { // cell 데이터를 merge 해야 할 경우 사용합fCollectionView니다. (header 제외)
      type: Boolean,
      default: false
    },
    changingPageReset: {
      type: Boolean,
      default: true
    },
    searchBoxId: { // 서치박스 아이디 값
      type: String,
      default: 'theSearch'
    },
    gridId: { // 서치 기능을 사용하기 위해 아이디를 설정해줘야합니다.
      type: String,
      default: 'cmpGrid'
    },
    initAutoSelectRow: { // 이전에 선택된 row의 dataItem - 그리드 시작시 해당 row 의 data 를 기반으로 Array에서 해당하는 row를 찾습니다.
      type: [Object, Array],
      default: () => {}
    },
    initAutoSelectRowKey: { // 그리드 시작 시, 자동 선택되는 로우를 알기 위한 고유 key 값
      type: String,
      default: ''
    },
    sortKeeping: { // { binding: string, asc: boolean } 형식으로 입력합니다.
      type: Object,
      default: () => {}
    },
    loading: {
      type: Boolean,
      default: null
    },
    useExcelDownload: {
      type: Boolean,
      default: false
    },
    customBeforeForExport: {
      type: Function,
      default () {
        return undefined
      }
    },
    customGridForExport: {
      type: [Object, undefined],
      default: undefined
    },
    useColumnFilter: {
      type: Boolean,
      default: true
    },
    customInitFilter: {
      type: Function,
      default: () => { }
    },
    columnDataMap: { // column DataMap을 설정합니다. 반드시 value = 'value'로, displayKey = 'caption'으로 설정해야 합니다..
      type: Object,
      default: undefined
    },
    autoRowHeights: { // row 자동 조정 여부
      type: Boolean,
      default: false
    },
    addedItemFormatter: {
      type: Function,
      default: undefined
    },
    forceRenderGrid: { // itemSource가 빈 배열이라도 그리드를 렌더링합니다. 엑셀 다운로드 등 특수한 경우에 데이터가 없더라도 그리드 형태가 나와야되는 부분이 있어서 추가했습니다.
      type: Boolean,
      required: false,
      default: false
    },
    serverSidePaging: { // 서버 사이드에서 페이징을 할 경우
      type: Boolean,
      required: false,
      default: false
    },
    totalPageSize: { // 서버 사이드에서 페이징을 할 경우 총 아이템 갯수
      type: Number,
      required: false,
      default: 0
    },
    serverSideNowPage: { // 서버 사이드에서 페이징을 할 경우 현재 페이지
      type: Number,
      required: false,
      defualt: 0
    }
  },
  watch: {
    tableCountDefault (count) {
      this.initDataSetting()
    },
    itemSource (rows) {
      // 데이터가 변경된 경우 테이블을 재랜더링 합니다.
      this.initDataSetting()
    },
    isInitAutoSelect (newVal) {
      if (newVal) {
        this.gridRefresh()
      }
    },
    // columns: {
    //   deep: true,
    //   handler (val) {
    //     this.setColumns()
    //   }
    // },
    columnDataMap: {
      deep: true,
      handler () {
        if (this.grid) this.gridDeferUpdate(this.grid)
      }
    }
  },
  computed: {
    isInitAutoSelect () {
      if (!this.initAutoSelectRowKey || !this.initAutoSelectRow) return false
      if ((Array.isArray(this.initAutoSelectRow) && this.initAutoSelectRow?.length) || (this.initAutoSelectRow instanceof Object && Object.keys(this.initAutoSelectRow).length)) return true
      else return false
    },
    disabledAll () {
      return this.data.items.every(item => item.disable)
    }
  },
  beforeMount () {
    this.initDataSetting()
  },
  mounted () {
    // if (this.searching) this.activateSearchBox()
  },
  methods: {
    gridRefresh () {
      if (!this.grid) return
      const cv = this.grid.collectionView
      if (!cv) return
      cv.refresh()
    },
    /**
     * @function - 초기 "데이터"를 설정 해줍니다.
     */
    initDataSetting () {
      this.setGridData()
      this.setColumns() // 기본 column 세팅
      // this.setGridAdditionalData(this.data.items) // 추가적인 data setting을 합니다.

      this.selectedRow = null
    },
    /**
     * @param {Boolean} pl exporting 중인지 아닌지 여부
     */
    setNowExporting (pl) {
      this.$emit('set-now-exporting', pl)
      this.nowExporting = pl
      this.isLoading = pl
    },
    /**
     * @function - grid에 '보여질' 데이터를 가공합니다
     * ex) 10개씩 / 15개씩.. 보기 등
     */
    settingCollectionViewDate (data) {
      return new CollectionView(data, {
        collectionChanged: (s) => {
          this.$nextTick(function () {
            // 페이지 설정
            if (this.pagingType === 'pagination') {
              if (this.serverSidePaging) {
                this.page = {
                  total: this.totalPageSize,
                  currPage: this.serverSideNowPage
                }
              } else {
                this.page = {
                  total: s.totalItemCount,
                  currPage: s.pageIndex + 1
                }
              }

              if (!this.nowExporting) s.pageSize = this.pagingSize
            }

            // refresh 할 때, 설정.. 초기 선택 값이 있으면 세팅, 아니면 전체 선택 취소
            if (this.grid) this.setSelectState(this.grid)

            this.$emit('total-count', this.page.total) // 그리드 row 카운팅
          })
        },
        sortDescriptions: this.sortKeeping ? [new SortDescription(this.sortKeeping.binding, this.sortKeeping.asc)] : []
      })
    },
    setGridData () {
      if (this.allCheckboxDisable) this.setAllCheckboxDisabled()

      // this.testData = JSON.parse(JSON.stringify(this.itemSource))
      this.itemSource.forEach((item, index) => {
        // this.$set(item, 'edit', false)
        item.index = index
        if (this.headerCheckbox || this.useCheckbox) {
          item.checked = item.checked || false
        }
        // edit: false
      })

      this.data = this.settingCollectionViewDate(this.itemSource)
      // this.$emit('total-count', this.page.total)

      this.$nextTick(() => {
        // page 유지가 필요한 경우 사용
        if (this.pageKeeping) return this.setPageKeeping(this.data)
      })
    },
    setSelectState (grid = this.grid) {
      if (this.isInitAutoSelect) {
        this.setAutoSelectRow(grid)
      } else {
        // this.selectedRow = null
        // grid.select(-1, -1)
        this.setAllRowDefault(this.grid.rows)
      }
    },
    /**
     * 모든 checkbox disabled시킵니다.
     */
    setAllCheckboxDisabled () {
      return this.itemSource.forEach(data => { data.disable = true })
    },
    addData (data, cnt) {
      var more = this.getData(cnt, data.length)
      for (var i = 0; i < more.length; i++) {
        data.push(more[i])
      }
    },
    /**
     * @function - headerCheckbox 또는 일반 checkbox 페이지에 변화가 있을 때마다 false로 리셋
     */
    setGridCheckboxResetData () { return this.itemSource.forEach(data => { data.checked = false }) },

    /**
     * @function - grid 의 기본 colums에 추가 데이터를 설정합니다.
     * => binding 데이터를 이용하여 field 데이터를 추가합니다.
     */
    setColumns () {
      if (this.headerCheckbox || this.useCheckbox) this.setHeaderCheckboxColumn()
      else this.removeCheckboxColumn()

      const filterCols = []
      const notFilteringColumns = ['checked', 'edit']

      for (let i = 0; i < this.columns.length; i++) {
        if (!this.columnGroup) {
          this.columns[i].field = this.columns[i].binding.includes('.') ? this.columns[i].binding.replace('.', '') : this.columns[i].binding

          // 날짜 형식
          if (
            this.grid &&
            this.columns[i].dataType === 'Date' &&
            this.grid.cells.columns[i]
          ) {
            this.grid.cells.columns[i].dataType = 4
          }
        }

        if (
          (!this.columns[i].binding.includes(notFilteringColumns) &&
          this.columns[i]?.sorting !== false &&
          this.columns[i]?.filtable !== false)
        ) filterCols.push(this.columns[i].binding) // 위즈모 필터링 가능하지 않은 column을 제외합니다. (우선, sorting 가능 && binding 값이 notFilteringColumns에 없을 때 && this.columns[i]가 filtable !== false만 필터링 가능하게 처리)
      }

      this.filterColumns = filterCols
    },
    /**
     * @function - headerCheckbox를 사용할 경우 내부에서 컬럼을 생성합니다.
     * @return column에 binding checked를 추가합니다.
     */
    setHeaderCheckboxColumn () {
      if (this.columns[0]?.binding !== 'checked') {
        const checkboxCol = { binding: 'checked', header: ' ', width: 50, cssClass: 'checkbox-cell', checkbox: true, sorting: false }
        return this.columns.splice(0, 0, checkboxCol)
      }
    },
    /**
     * @function - headerCheckbox를 사용하지 않을 경우 내부에서 checked 컬럼을 제거합니다.
     * @return column에 binding checked를 제거합니다.
     */
    removeCheckboxColumn () {
      if (this.columns[0]?.binding === 'checked') {
        return this.columns.shift()
      }
    },
    /**
     * @function - 페이지가 마운트 될 때, 추가로 필요한 데이터를 세팅합니다
     * @param {Array} data
     * @return {Array} - 추가된 데이터를 입력합니다.
     */
    setGridAdditionalData (data) {
      if (Array.isArray(data)) {
        // data = data.map((item, index) => {
        //   item.edit = false
        // })
        data.forEach((item, index) => {
          this.$set(item, 'edit', false)
        //   this.$set(item, 'index', index)
        //   if (this.headerCheckbox) this.$set(item, 'checked', false)
        })
      }
      return data
    },
    /**
     * @function - grid inintialize 입력
     */
    init (grid) {
      grid.columnHeaders.rows.defaultSize = 42
      grid.rows.defaultSize = 40
      this.grid = grid

      // ItemFormatter 등록
      this.grid.itemFormatter = this.itemFormatter
      this.rowClickEventHandler(grid)
      this.cellTooltipHandler(grid) // 툴팁
      this.initDataSetting()

      if (this.searching) this.activateSearchBox()
      if (this.headerMerge) this.mergeHeader(grid)
      if (this.cellMerge) this.mergeCell(grid)

      this.gridDeferUpdate(grid)
      this.initCustomAction(grid, this.data) // 컴포넌트 외부 custom 기능

      this.setEmptyCellDefaultText(grid)
    },
    /**
     * 셀 값이 null 또는 undefined면 기본 텍스트로 노출합니다.
     * 만약에 해당 셀에 vnode가 있을 경우는 제외합니다.(customHTML)
     **/
    setEmptyCellDefaultText (grid) {
      // this.$nextTick(() => {
      // const defaultText = '-'
      // grid.formatItem.addHandler((s, e) => {
      //   console.log(s.getColumn()._binding._key)
      //   if (s.cells === e.panel) {
      //     console.log(s, e)
      //     const data = s.getCellData(e.row, e.col)
      //     if (data === undefined || data === null) {
      //       console.log(s.getColumn()._binding._key)
      //       // debugger
      //       e.cell.innerHTML = defaultText
      //     }
      //   }
      // })
      // })
    },
    // /**
    //  * 칼럼 dataMap 설정 (display Value)
    //  */
    gridDeferUpdate (grid) {
      grid.deferUpdate(() => {
        if (this.columnDataMap) {
          for (const col in this.columnDataMap) {
            const column = grid.columns.getColumn(col)
            if (!this.columnDataMap[col]) continue
            const map = new wjGrid.DataMap(this.columnDataMap[col], 'value', 'caption')

            if (column && map) column.dataMap = map
            else continue
          }
        }
      })
    },
    /**
     * @function - cell 데이터를 머지합니다.
     * @param {Object} grid
     */
    mergeCell (grid) {
      const cellMergedColumns = this.columns.map(column => {
        if (column.cellMerge) {
          const view = new wjCore.CollectionView(this.itemSource, {
            sortDescriptions: [column.binding]
          })

          this.data = view
        }
      })
      return cellMergedColumns
    },
    /**
     * CMPGrid.vue의 템플릿에서 사용
     * true 일 경우 :: Grid의 header && cell 둘다 merge 합니다.
     * false 일 경우 :: Grid의 header만 merge 합니다. (기본)
     * @function - allow-merging 프로퍼티를 위해 사용합니다.
     * @return {String} - 표시될 방법에 대해 정의합니다.
     */
    setAllowMerging () {
      return {
        true: ['Cells', 'ColumnHeaders'],
        false: 'ColumnHeaders'
      }[this.cellMerge]
    },
    /**
     * @function - grid의 데이터 형식을 가공합니다.(?)
     */
    itemFormatter (panel, r, c, cell) {
      // 외부에서 추가된 ItemFormatter 있을 시 넣어서 실행해줌
      if (this.addedItemFormatter) {
        this.addedItemFormatter(panel, r, c, cell)
      }
      if (panel.cellType === 2) {
        this.grid = panel.grid
        this.col = this.grid.columns[c]
        this.cell = cell

        // header에 icon이 필요한 경우
        this.setHeaderIcon(this.col, cell)
        this.setRequiredIcon(this.col, cell)

        // header에 체크박스를 입력합니다.
        if (this.headerCheckbox) this.setHeaderCheckbox(this.col, cell)
      }
    },
    /**
     * @function - grid의 header에 전체 체크박스를 삽입합니다.
     * @param {Object} col
     * @param {Object} cell
     * @return {Vue $emit} - checkedRowsData 이벤트를 위한 객체를 반환합니다.
     */
    setHeaderCheckbox (col, cell) {
      if (col.binding === 'checked') {
        col.allowSorting = true
        // cell.innerHTML = '<input type="checkbox" class="wj-grid-checkbox">'
        cell.innerHTML = `<div class="header-checkbox"><input ${this.disabledAll ? 'disabled' : ''} type="checkbox" class="wj-grid-checkbox"></div>`
        const items = [...this.data.items]
        // const items = [...this.data.items].filter(row => !row.disable)

        const ckedRowData = items.filter(row => row.checked === true)
        const checkedCnt = ckedRowData.length
        const allChecked = items.every(item => item.checked)

        this.checkboxCell = cell
        this.allCheckbox = cell.firstChild.firstChild

        // 테스트 시간까지 주석처리. 이후로 삭제 예정
        // this.allCheckbox.checked = checkedCnt > 0
        // this.allCheckbox.indeterminate = checkedCnt > 0 && checkedCnt <= this.grid.rows.length // -> 체크박스 [-] 표시 설정

        this.allCheckbox.checked = allChecked
        this.allCheckbox.indeterminate = checkedCnt > 0 && !allChecked // -> 체크박스 [-] 표시 설정

        if (this.allCheckboxDisable) this.allCheckbox.disabled = true

        // 전체 체크박스를 선택했을 때 발생하는 이벤트!
        this.allCheckbox.addEventListener('click', (e) => {
          this.grid.beginUpdate()

          for (var i = 0; i < this.grid.rows.length; i++) {
            if (!items[i].disable) {
              // [-] 일 경우 ? 체크박스를 모두 해제
              // 아닐경우 (header 체크박스를 체크 | 해제 한 경우) ?  모든 체크박스 체크 || 해제
              items[i].checked = (checkedCnt > 0 && !allChecked) ? false : this.allCheckbox.checked
            }
          }

          let gridDatas
          if (this.changingPageReset) gridDatas = [...this.data.items]
          else gridDatas = [...this.itemSource]

          const afterUpdateData = gridDatas.filter(row => row.checked === true)
          this.grid.endUpdate()

          this.checkedRowData = [...afterUpdateData]

          return this.$emit('checkedRowsData', this.checkedRowData)
        })
      }
    },
    /**
     * @function - grid header에 icon이 필요한 경우 사용합니다.
     * @param {Object} col
     * @param {Object} cell
     * @return {Array map} - 해당하는 column header에 icon을 입력합니다.
     */
    setHeaderIcon (col, cell) {
      const columns = [...this.columns]
      return columns.map((column, index) => {
        if (column.headerIcon && col.index === index) {
          col.allowSorting = true
          cell.innerHTML = `<i class="mdi ${column.headerIcon}" />`
        }
      })
    },
    /**
     * @function - grid header 에 required 가 있는 경우 사용합니다.
     * @param {Object} col
     * @param {Object} cell
     * @return {Array map} - 해당하는 column header에 icon을 입력합니다.
     */
    setRequiredIcon (col, cell) {
      const columns = [...this.columns]
      return columns.map((column, index) => {
        if (column.required && col.index === index) {
          col.allowSorting = true
          cell.innerHTML = `${column.header} <i class="-required">*</i>`
        }
      })
    },
    /**
     * @function - row를 클릭할 때 발생하는 이벤트를 다룹니다.
     * @return {void}
     */
    rowClickEventHandler (grid) {
      // if (this.selectable || (!Array.isArray(this.initAutoSelectRow) && this.initAutoSelectRowKey)) grid.selectionMode = 3

      grid.addEventListener(grid.hostElement, 'click', (e) => {
        e.stopPropagation()
        // e.preventDefault()

        if (e.defaultPrevented) return

        const ht = grid.hitTest(e) // HitTestInfo
        const selRow = grid.cells.rows // 클릭한 rows의 data

        // 기본 row의 class / 데이터를 설정합니다.
        // selRow.forEach(row => {
        //   row.cssClass = undefined
        //   row.isSelected = false
        // })

        // cell(cellType === 1)을 클릭했을 때만 발생하는 이벤트를 다룹니다. - thead의 cellType은 2입니다.
        if (ht.cellType === 1) {
          if (!selRow[ht.row]) console.error('**** selRow is Empty')

          // routing이 가능한 경우
          if (this.routable) this.routableHandler(ht, selRow)

          // selectable이 가능한 경우 처리 로직:
          // 데이터에 isSelectable 키가 있는지 여부 우선 체크 ->
          // -> isSelectable: false 인 경우 select 못하게 처리 위함.
          if (Object.keys(selRow[ht.row].dataItem).includes('isSelectable')) {
            if (this.selectable && selRow[ht.row].dataItem.isSelectable) {
              this.selectableHandler(ht, selRow)
            }
          } else {
            if (this.selectable) {
              // 다중 select
              if (this.multiSelect) this.selectableHandlerMulti(ht, selRow)
              else this.selectableHandler(ht, selRow)
            }
          }
        }
      })
    },
    /**
     * routable일 경우 동작합니다.
     * @param {Object} ht - grid hit event
     * @param {Object} selRow - 선택된 row에 대한 정보
     * @return {Vue $router push}
     */
    routableHandler (ht, selRow) {
      const selRowData = selRow[ht.row].dataItem
      const routingType = typeof this.routable

      const name = {
        string: this.routable,
        object: this.routable.name
      }[routingType]

      if ((this.headerCheckbox || this.useCheckbox) && ht.col === 0) return false
      else {
        const routingData = { name, params: selRowData }
        return this.$router.push(routingData)
      }
    },
    setAllRowDefault (rowGroup) {
      rowGroup.forEach(row => {
        // row.cssClass = undefined
        const cssList = row.cssClass
        row.cssClass = cssList?.replace('selected-row', '') || ''
        row.isSelected = false
      })
      this.selectedRow = null
    },
    setSelectedRow (row) {
      row.isSelected = true
      row.cssClass = 'selected-row'
      this.selectedRow = row
    },
    /**
     * selectable - row 선택이 가능한 경우 동작합니다.
     * tree row를 클릭할 때 'selected-row' class를 추가합니다.
     * @param {Object} ht - grid hit event
     * @param {Object} selRow - 선택된 row에 대한 정보
     * @param {Object} grid
     * @return {Vue $emit} - selectedRow 이벤트에 데이터를 전송합니다.
     */
    selectableHandler (ht, selRow, grid = this.grid) {
      const sameRow = () => { // 기존 선택한 row와 새로 선택한 row가 동일한 row인지 확인
        const oldSelectRowData = this.selectedRow._data
        const newSelectRowData = selRow[ht.row]._data
        const uniqueKey = this.initAutoSelectRowKey ? this.initAutoSelectRowKey : 'index'
        return newSelectRowData[uniqueKey] === oldSelectRowData[uniqueKey]
      }

      if (this.selectedRow) { // selectedRow 에 데이터가 있는 경우
        if (sameRow() && !this.selectedRow.dataItem.edit) {
          // keepSelect 설정된경우 :: 선택된 row 가 동일하다면 그대로 유지
          if (!this.keepSelect) this.setAllRowDefault(selRow)
        } else {
          this.setAllRowDefault(selRow)
          this.setSelectedRow(selRow[ht.row])
        }
      } else { // selectedRow 에 데이터가 없는 경우
        this.setSelectedRow(selRow[ht.row])
      }

      return this.$emit('selectedRow', this.selectedRow)
    },
    /**
     * selectable + multi row 선택이 가능한 경우 동작합니다.
     * tree row를 클릭할 때 'selected-row' class를 추가합니다.
     * @param {Object} ht - grid hit event
     * @param {Object} selRow - 선택된 row에 대한 정보
     * @param {Object} grid
     * @return {Vue $emit} - selectedRow 이벤트에 데이터를 전송합니다.
     */
    selectableHandlerMulti (ht, selRow, grid = this.grid) {
      const htRow = selRow[ht.row]
      // console.log(htRow)
      const setSelecteRow = (row, status) => {
        row.dataItem.isSelected = status
        row.cssClass = status ? 'selected-row' : undefined
      }

      // console.log(htRow.index, htRow, htRow.dataItem.isSelected)
      setSelecteRow(htRow, !htRow.dataItem.isSelected)

      const selectedRows = []
      for (let i = 0; i < this.itemSource.length; i++) {
        const row = this.itemSource[i]
        if (row.isSelected) selectedRows.push(row)
      }

      return this.$emit('selectedRows', selectedRows)
    },
    /**
     * @function - header merge시 header에 cssClass를 삽입합니다.
     * @param {Object} panel - Flexgrid panel
     * @return {Array} - cssClass를 추가한 배열 반환
     */
    addClassForHeaderMerge (panel) {
      return panel.columns.map(column => {
        column.cssClassAll = 'header-border'
        column.cssClass = column.cssClass ? column.cssClass + ' ' + 'grid-border' : 'grid-border'
        return column
      })
    },
    /**
     * @function - header를 머지해야할 때 사용합니다. (현재는 2층 까지 가능)
     * header merge(colspan, rowspan 둘 다)를 사용하는 경우에만 작동합니다.
     */
    mergeHeader (grid) {
      if (Object.keys(this.headerMerge).length > 0) {
        const panel = grid.columnHeaders

        if (this.headerMerge.colSpan) {
          const extraRow = new wjGrid.Row()
          extraRow.allowMerging = true

          // 헤더에 필요한 여분의 header를 추가합니다.
          // panel.rows.splice(0, 0, extraRow)
          if (panel.rows.length >= 2) {
            panel.rows.splice(0, 1)
            panel.rows.splice(0, 0, extraRow)
          } else panel.rows.splice(0, 0, extraRow)

          // header 가로 병합을 진행합니다.
          this.mergeColspan(grid, panel)
        }

        // header 세로 병합을 진행합니다.
        if (this.headerMerge.rowSpan) this.mergeRowspan(grid, panel)
      }
    },
    /**
     * grid-header 가로 병합
     * @param {Object} grid
     * @param {Object} panel
     * @return {void}
     */
    mergeColspan (grid = this.grid, panel) {
      const colspanData = [...this.headerMerge.colSpan]

      // colspan이 있을 경우 css를 입력합니다
      this.addClassForHeaderMerge(panel)

      return colspanData.forEach(colInfo => {
        // (시작 index ~ 병합하고싶은 index 까지)
        const startIdx = colInfo.startIdx
        const endIdx = colInfo.endIdx

        for (let colIndex = startIdx; colIndex <= endIdx; colIndex++) {
          // panel.setCellData(0, colIndex, colInfo.header)
          panel.setCellData(0, colIndex, colInfo.keyPath ? this.$t(colInfo.keyPath) : colInfo.header)
        }
      })
    },
    /**
     * grid-header 세로 병합
     * @param {Object} grid
     * @param {Object} panel
     */
    mergeRowspan (grid = this.grid, panel) {
      const headerField = [...this.headerMerge.rowSpan]
      if (this.headerCheckbox) headerField.push('checked')

      headerField.forEach((binding) => {
        const col = grid.getColumn(binding)
        if (col) {
          col.allowMerging = true
          // panel.setCellData(0, col.index, col.header)
          panel.setCellData(0, col.index, col.keyPath ? this.$t(col.keyPath) : col.header)
        }
      })

      grid.formatItem.addHandler((s, e) => {
        if (e.panel === s.columnHeaders && e.range.rowSpan > 1) {
          var html = e.cell.innerHTML
          e.cell.innerHTML = `<div class="v-center">${html}</div>`
        }
      })
    },
    /**
     * @function - 개별 checkbox를 선택했을 때 발생하는일을 다룹니다.
     * @param {Object} row 체크 토글 아이템
     * @return {emit} Array - 선택된 rows의 Data Array를 내보냅니다.
     */
    changedCheckbox (row) {
      let items
      if (this.changingPageReset) items = this.data.items
      else items = this.itemSource
      this.checkedRowData = items.filter(row => row.checked === true)

      // 전체 체크박스 핸들링 => 하나이상 선택되었을 경우 checked
      const col = this.grid.columns[0]
      col.allowSorting = false // 체크박스에 sorting 기능 입력 (필요할 경우 true로 변환)

      if (col.dataType === 3) { // => header 체크박스 선택 여부 결정
        const checkedCnt = this.checkedRowData.length
        if (this.allCheckbox) this.allCheckbox.checked = checkedCnt > 0
      }

      // console.log(this.checkedRowData, '---checked 되어있습니다')
      return this.$emit('checkedRowsData', this.checkedRowData)
    },
    /**
     * @function - 검색 기능을 사용할 때 사용합니다.
     * 사용 방법:
     * 부모 컴포넌트에 wj-flex-grid-search를 입력한 후, ref="theSearch"를 입력하여 사용합니다.
     * 부모 컴포넌트에 ref가 없을 경우 에러메세지를 반환합니다.
     * @return {Object} search input 박스를 설정합니다.
     */
    activateSearchBox () {
      // const theGrid = Control.getControl(document.querySelector(`#${this.gridId}`))
      // console.log(this.$refs[this.gridId])
      const theGrid = this.$refs[this.gridId] ? Control.getControl(this.$refs[this.gridId].$el) : Control.getControl(document.querySelector(`#${this.gridId}`))

      const searchBox = document.querySelector(`#${this.searchBoxId}`)

      if (!theGrid && !searchBox) return

      const theSearch = Control.getControl(searchBox)
      theSearch.grid = theGrid

      // 아이디 값으로 찾을 수 있도록 변경했습니다. -> 화면에 그리드가 여러개인 경우를 대비하여 그리드 ID 값을 설정합니다. (this.gridId)

      // if (!this.$parent.$refs.theSearch) {
      //   console.error('@@@ $parent에 ref가 없습니다')
      //   // 현재는 바로 직계 부모에게 $refs를 달아야 사용할 수 있습니다.
      //   // 추후 필요하다면 조부모(?) 이상에게 $refs를 달아 사용할 수 있게 할 예정입니다.
      //   return false
      // }

      // return theSearch
    },
    /**
     * @function - page를 선택했을 때 일어나는 이벤트를 담당합니다.
     */
    changingPage (pageNumber) {
      this.currPage = pageNumber
      this.data.moveToPage(pageNumber - 1)
      this.$emit('changingPage', pageNumber)

      if (this.changingPageReset) return this.setGridCheckboxResetData()
    },
    setPageKeeping (data = this.data, page = this.currPage) {
      // console.log(page - 1)
      if (page !== undefined) {
        this.data.moveToPage(page - 1)
      }
    },
    /**
     * [더보기] 버튼을 누를 때, append가 실행됩니다. - pagingType = 'append' 일때 사용
     * @function
     * @return {Void} 전체 데이터와 보여지고 있는 데이터를 비교해서 설정 수 만큼 데이터를 append 시켜줍니다.
    */
    appendData () {
      const leftCount = this.itemSource.length - 10

      if (leftCount > 10) this.tableCountDefault += 10
      else this.tableCountDefault += leftCount
    },
    /**
    * 데이터가 없는 경우를 처리합니다.loadedRows
    */
    loadedRows (grid, args) {
      // if (!grid.rows.length) {
      this.$emit('loaded-rows', grid, args)
      // }
    },
    getTextWidth (text, font) {
      var canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement('canvas'))
      var context = canvas.getContext('2d')
      context.font = font
      var metrics = context.measureText(text)
      return metrics.width
    },
    /**
     * 셀 내부 데이터가 셀 크기를 넘어가면 툴팁이 생깁니다.
     */
    cellTooltipHandler (grid) {
      const tip = new wjCore.Tooltip()
      tip.cssClass = 'more-contents'

      let rng = null
      grid.addEventListener(grid.hostElement, 'mouseover', (e) => {
        const ht = grid.hitTest(e)
        if (ht.range && (ht.cellType === wjGrid.CellType.Cell) && !grid.columns[ht.col].$__cellTemplCell) { // cell-template을 이용하지 않을 때만 사용
          rng = ht.range
          const cellElement = document.elementFromPoint(e.clientX, e.clientY)
          const cellBounds = grid.getCellBoundingRect(ht.row, ht.col)
          const data = wjCore.escapeHtml(grid.getCellData(rng.row, rng.col, true))
          const font = ''
          const twidth = this.getTextWidth(data, font)

          if (cellBounds.width < twidth + 60) {
            const tipContent = data
            // if (cellElement.className.includes('wj-cell')) {
            if (cellElement) {
              tip.show(grid.hostElement, tipContent, cellBounds)
            } else {
              tip.hide()
            }
          }
        }
      })
      grid.hostElement.addEventListener('mouseout', (e) => {
        tip.hide()
        rng = null
      })
    },
    /**
     * 그리드 시작 시, selectedRow를 세팅합니다.
     */
    setAutoSelectRow (grid) {
      if (!this.initAutoSelectRow && !this.initAutoSelectRowKey) return

      // checked(체크박스) + multiSelect(다중 select) 둘다 Array 형식
      if (Array.isArray(this.initAutoSelectRow)) {
        if (this.trigger) return
        let items
        if (this.changingPageReset) items = this.data.items
        else items = this.itemSource

        const checkedArr = []
        // for (let i = 0; i < grid.rows.length; i++) {
        //   this.initAutoSelectRow.forEach(row => {
        //     if (grid.rows[i].dataItem[this.initAutoSelectRowKey] === row[this.initAutoSelectRowKey]) {
        //       grid.rows[i].dataItem.checked = true
        //       checkedArr.push(grid.rows[i].dataItem)
        //     }
        //   })
        // }
        for (let i = 0; i < items.length; i++) {
          this.initAutoSelectRow.forEach(row => {
            if (items[i][this.initAutoSelectRowKey] === row[this.initAutoSelectRowKey]) {
              items[i].disable = row.disable || false
              items[i].checked = true
              checkedArr.push(items[i])
            }
          })
        }
        this.checkedRowData = [...checkedArr]

        this.$emit('checkedRowsData', this.checkedRowData)
      } else {
        for (let i = 0; i < grid.rows.length; i++) {
          if (grid.rows[i].dataItem[this.initAutoSelectRowKey] === this.initAutoSelectRow[this.initAutoSelectRowKey]) {
            // grid.rows[i].isSelected = true
            // this.selectedRow = grid.rows[i]

            this.setSelectedRow(grid.rows[i])

            this.$emit('selectedRow', this.selectedRow)
          }
        }
        // this.$forceUpdate()
      }
      this.trigger = true
    },
    initializeFilter (filter) {
      if (!this.useColumnFilter) return

      this.filter = filter
      this.customInitFilter(filter)
    }
  },
  data () {
    return {
      testData: null,
      tempData: null,
      data: null,
      grid: null,
      col: null, // header column
      cell: null, // header cell
      selectedRow: null,
      selectedRows: [],
      checkboxCell: null,
      allCheckbox: null,
      editRowOnly: {}, // 편집중인 row의 데이터입니다.
      checkedRowData: [],
      tableCountDefault: 10, // 테이블의 기본 갯수입니다.
      page: {
        total: 0,
        currPage: 0,
        size: 0
      },
      currPage: undefined,
      nowExporting: false,
      isLoading: false,
      trigger: false,
      filterColumns: []
    }
  }
}
