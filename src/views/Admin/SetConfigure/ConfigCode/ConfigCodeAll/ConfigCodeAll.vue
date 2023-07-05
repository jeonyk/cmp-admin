<!--
  * 파일명 : ConfigCodeAll.vue
  * 파일 기능 : 정의된 코드 리스트로 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 delete: 미사용 컴포넌트 삭제
 -->

<template>
  <div class="config-code-all">
    <filtering-component
      :data="filteringList"
      @selected="selectFilter"
      @apply="searchData"
      @reset-data="
        () => {
          filterObj = undefined;
          searchData();
        }
      "
    />
    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="addCode"
          :disabled="editStatus"
        >
          {{ $t("common.BTN.ADMIN.addCode") }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow || selectedRow._data.edit"
          v-if="!editStatus"
          @click="modifyItem"
        >
          {{ $t("common.BTN.change") }}
        </button>
        <button
          class="button"
          v-if="editStatus || (selectedRow && selectedRow._data.edit)"
          @click="cancelEditStatus"
          :disabled="isLoadingReq"
          v-loading="isLoadingReq"
        >
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button"
          v-if="editStatus || (selectedRow && selectedRow._data.edit)"
          @click="finishEditStatus"
          :disabled="isLoadingReq"
          v-loading="isLoadingReq"
        >
          {{ $t("common.BTN.complete") }}
        </button>
        <button
          class="button"
          :disabled="editStatus || !selectedRow"
          @click="applyRemove"
          type="is-anti"
        >
          {{ $t("common.BTN.delete") }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        :item-source="codeData"
        :columns="setColumns()"
        is-read-only
        :selectable="isSelectable"
        :init-custom-action="init"
        @selectedRow="rowSelect"
        class="no-scrollbars"
        @changingPage="changingPage"
        @total-count="cnt => (totalResultCnt = cnt)"
      >
        <template
          v-for="column in codeColumns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div
            :key="column.binding"
            v-if="column.binding === 'codeVal' || column.binding === 'codeDesc'"
          >
            <!-- @keypress.enter.native="finishEditStatus" -->
            <el-input
              v-model="props.row[column.binding]"
              :placeholder="column.placehoder"
              size="mini"
              v-if="
                (editStatus && props.row.isSelected) ||
                  (props.cell._data.edit &&
                    disableEdit(column.binding, selectedRow))
              "
              @keypress.enter.native="finishEditStatus"
              @click="
                e => {
                  e.stopPropagation();
                  e.preventDefault();
                }
              "
            />

            <span
              v-else
              v-html="props.row[column.binding]"
            />
          </div>
        </template>
        <!-- 코드, 설명 -->

        <template #codeType="props">
          <el-select
            v-if="(editStatus && props.row.isSelected) || props.cell._data.edit"
            v-model="props.row.codeType"
            :placeholder="$t('admin.PREF.selectType')"
            size="mini"
            :popper-append-to-body="true"
            class="type-select"
          >
            <el-option
              v-for="item in typeList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <span v-else>{{ props.row.codeType }}</span>
        </template>
        <!-- /.타입 -->

        <template #codeNameType="props">
          <el-select
            v-if="(editStatus && props.row.isSelected) || props.cell._data.edit"
            v-model="props.row.codeNameType"
            placeholder="코드 이름 타입 선택"
            size="mini"
            :popper-append-to-body="true"
            class="type-select"
          >
            <el-option
              v-for="item in codeNameTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </template>
        <!-- /.코드 이름 타입 -->

        <template #codeName="props">
          <el-input
            v-if="
              (editStatus && props.row.isSelected) ||
                props.cell._data.edit
            "
            v-model="props.row.codeName"
            placeholder="코드 이름 입력"
            size="mini"
            :type="inputType"
            @click="
              e => {
                e.stopPropagation();
                e.preventDefault();
              }
            "
          />
          <template v-else>
            <span
              v-if="props.row.codeNameType === 'INPUT' || props.row.codeNameType === null"
              v-html="props.row.codeName"
            />
            <pre v-else><span v-html="props.row.codeName" /></pre>
          </template>
        </template>
        <!-- /.코드이름 -->

        <template #upperCode="props">
          <template
            v-if="(editStatus && props.row.isSelected) || props.cell._data.edit"
          >
            <template v-if="props.row.isTree">
              <div v-if="selectedUpperCode || props.row.upperCodeIdx">
                <span>
                  {{ selectedUpperCode ? `${selectedUpperCode._data.codeVal} (${selectedUpperCode._data.codeName})` : `${props.row.upperCode.codeVal} (${props.row.upperCode.codeName})` }}
                </span>
                <button
                  class="button"
                  type="is-primary"
                  size="mini"
                  @click="e => {
                    e.preventDefault()
                    e.stopPropagation()
                    openSelectCodeModal(props)
                  }"
                >
                  {{ $v('변경') }}
                </button>
              </div>
              <button
                v-else
                class="button"
                type="is-primary"
                size="mini"
                @click="e => {
                  e.preventDefault()
                  e.stopPropagation()
                  openSelectCodeModal(props)
                }"
              >
                {{ $v('코드 선택') }}
              </button>
            </template>
            <span v-else> - </span>
          </template>
          <template v-else>
            <span v-if="props.row.isTree && props.row.upperCodeIdx">
              {{ `${props.row.upperCode.codeVal} (${props.row.upperCode.codeName})` }}
            </span>
            <span v-else> - </span>
          </template>
        </template>
        <!-- /.상위 코드 IDX -->

        <template #isTree="props">
          <el-switch
            v-if="(editStatus && props.row.isSelected) || props.cell._data.edit"
            v-model="props.row.isTree"
          />
          <template v-else>
            <span v-if="props.row.isTree">O</span>
            <span v-else>X</span>
          </template>
        </template>
        <!-- /.트리 구조 여부 -->

        <template #isShow="props">
          <el-switch
            v-if="(editStatus && props.row.isSelected) || props.cell._data.edit"
            v-model="props.row.isShow"
          />
          <template v-else>
            <span v-if="props.row.isShow">O</span>
            <span v-else>X</span>
          </template>
        </template>
        <!-- /.코드 노출 여부 -->
      </cmp-grid>
    </section>
    <!-- /.table-area -->

    <el-dialog
      :visible.sync="activeModal"
      title="상위 코드 선택"
      class="select-modal"
      width="750px"
      @close="closeModal"
    >
      <wj-flex-grid-search
        class="searchInput"
        id="theSearch"
        ref="theSearch"
        :placeholder="$v('코드 타입, 값, 이름 검색')"
      />
      <search-icon />
        <refresh-icon
          is-button
          style="margin-left: 10px;"
          @click="onResetFilter"
        />
      <cmp-grid
        class="no-scrollbars"
        :item-source="codeData"
        :columns="setColumns(true)"
        :init-custom-action="initCodeGrid"
        :init-auto-select-row="checkDataItem()"
        init-auto-select-row-key="codeIdx"
        @selectedRow="selectUpperCode"
        search-box-id="theSearch"
        searching
        selectable
      />
      <!-- is-read-only -->
      <!-- @changingPage="changingPage"
        @total-count="cnt => (totalResultCnt = cnt)" -->
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="() => {
            activeModal = false
          }"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="closeModal"
        >
          {{ $v('선택 완료') }}
        </button>
      </section>
    </el-dialog>
  </div>
</template>
<script>
import * as wjGrid from '@grapecity/wijmo.grid'
import { map, isEmpty, cloneDeep } from 'lodash'
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'

export default {
  name: 'ConfigCodeAll',
  components: {
    FilteringComponent,
    SearchIcon,
    RefreshIcon
  },
  beforeRouteLeave (to, from, next) {
    if (to && this.editStatus) {
      if (to.name === 'config-code-type') {
        const { cloneData } = this.$parent
        cloneData.map((x, idx) => {
          let bool = false
          if (idx === 1) bool = true
          x.isActive = bool
        })
      }

      const type = this.selectedRow._data.crud === 'create' ? `${this.$v('생성')}` : `${this.$v('변경')}`
      this.$confirm(this.$v('저장되지 않은 데이터가 있습니다. <br> {type}을 취소하시겠습니까?', { type }), '알림', {
        dangerouslyUseHTMLString: true
      }).then(() => next()).catch(() => {})
      return
    }
    next()
  },
  beforeMount () {
    window.addEventListener('beforeunload', this.preventNav)
  },
  beforeDestroy () {
    window.removeEventListener('beforeunload', this.preventNav)
  },
  watch: {
    'selectedRow._data.codeNameType' (val) {
      this.inputType = val === 'INPUT' ? 'input' : val === 'TEXTAREA' ? 'textarea' : 'input'
    },
    activeModal (visible) {
      if (!visible) {
        this.$refs.theSearch.control.text = ''
      }
    }
  },
  async mounted () {
    await this.getTypeList()
    await this.getCodeList()
  },
  methods: {
    onResetFilter () {
      this.$refs.theSearch.control.text = ''
    },
    checkDataItem () {
      if (this.selectedUpperCode) {
        return this.selectedUpperCode.dataItem
      } else return null
    },
    openSelectCodeModal (props) {
      this.activeModal = true
    },
    setColumns (isModal = false) {
      let columns = []
      if (isModal) {
        columns = this.codeColumns.filter(col => {
          if (col.binding === 'codeType' || col.binding === 'codeVal' || col.binding === 'codeName') {
            return col
          }
        })
      } else {
        columns = this.codeColumns
      }
      return columns
    },
    selectUpperCode (row) {
      this.selectedUpperCode = row
    },
    closeModal () {
      this.activeModal = false
      this.gridRefresh(this.codeGrid)
    },
    gridRefresh (grid) {
      if (grid) {
        const cv = grid.collectionView
        if (cv) cv.refresh()
      }
    },
    preventNav (event) {
      if (!this.editStatus) return
      event.preventDefault()
      event.returnValue = ''
    },
    rowSelect (selected) {
      // for (let i = 0; i < this.grid.rows.length; i++) {
      //   this.grid.rows[i].cssClass = undefined
      // }
      // selected.cssClass = 'selected-row'
      this.selectedRow = selected
    },
    init (grid) {
      this.grid = grid
    },
    initCodeGrid (grid) {
      this.codeGrid = grid
    },
    /**
     *  [코드 추가] 버튼을 눌렀을 때, 테이블 상단에 입력 가능한 row를 추가합니다.
     */
    addCode () {
      const isNewCode = this.codeData.filter(code => code.crud === 'create' && code.edit)
      if (isNewCode.length) return

      for (let i = 0; i < this.grid.rows.length; i++) {
        this.grid.rows[i].cssClass = undefined
      }

      this.selectedComps = ''

      const newRow = new wjGrid.Row()
      const newObj = {
        crud: 'create',
        codeType: this.newTableItem.codeType,
        codeVal: this.newTableItem.codeVal,
        codeName: this.newTableItem.codeName,
        codeDesc: this.newTableItem.codeDesc,
        codeNameType: this.newTableItem.codeNameType,
        isShow: this.newTableItem.isShow,
        isTree: this.newTableItem.isTree,
        upperCodeIdx: this.newTableItem.upperCodeIdx,
        edit: true
        // prefix: this.newTableItem.prefix,
        // mapping: this.newTableItem.mapping,
      }
      newRow._data = cloneDeep(newObj)
      newRow._cssClass = 'selected-row'

      if (this.codeData && this.codeData.length) {
        this.grid.rows.insert(0, newRow)
      } else {
        this.codeData.push(newObj)
      }
      // if (this.codeData?.length) this.codeData.unshift(newObj)
      // else this.codeData.push(newObj)

      this.selectedRow = newRow
      this.editStatus = true
      this.isSelectable = false
    },
    /**
     *  [변경] 버튼을 눌렀을 때, 선택한 row 데이터를 수정합니다.
     */
    modifyItem () {
      this.clonedCodeData = cloneDeep(this.codeData)
      this.isSelectable = false
      this.editStatus = true
      this.selectedRow._data.edit = true
      this.selectedRow._data.crud = 'update'
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 데이터를 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.031'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.removeItem(this.selectedRow)
        this.selectedRow = null
        this.isSelectable = true
      }).catch(() => false)
    },
    /**
     * 파라미터의 아이템을 테이블과 데이터에서 삭제합니다..
     * @param {Object} item 삭제 할 Row 오브젝트
     */
    async removeItem (item) {
      const removeIdx = item._data.codeIdx
      const deleteResult = await API.config.deleteCode({ codeIdx: removeIdx })
      if (deleteResult) {
        await this.getCodeList()
        this.$alert(this.$t('common.ALERT.PROJECT.040'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } else {
        this.$alert(this.$t('common.ALERT.PROJECT.039'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      }
      this.editStatus = false
    },
    cancelEditStatus () {
      if (this.selectedRow._data.crud && this.selectedRow._data.crud === 'create') {
        this.removeFirstRow(this.selectedRow._idx)
        return
      }
      this.rollbackList()
    },
    removeFirstRow (idx) {
      this.disableEditMode()
      this.grid.rows.removeAt(idx)
    },
    rollbackList () {
      this.disableEditMode()
      this.codeData = this.clonedCodeData
    },
    disableEditMode () {
      this.selectedRow = null
      this.isSelectable = true
      this.editStatus = false
      this.inputType = 'input'
    },
    /**
     * 편집 상태를 완료합니다.
     */
    async finishEditStatus (val) {
      let editRow
      for (let i = 0; i < this.grid.rows.length; i++) {
        const row = this.grid.rows
        if (row[i]._data.crud === 'create' || row[i]._data.crud === 'update') {
          editRow = cloneDeep(row[i]._data)
          break
        }
      }
      if (editRow.upperCode) delete editRow.upperCode
      editRow.upperCodeIdx = editRow.isTree ? this.selectedUpperCode?._data?.codeIdx || null : null
      const validatedRow = this.validateRowData(editRow)
      if (!validatedRow) return
      const codeValid = await this.codeValidation(editRow)
      if (codeValid) {
        this.isLoadingReq = true
        let response
        editRow = this.convertTypeNameToCode(editRow)
        if (editRow.crud === 'create') {
          response = await API.config.createCode(editRow)
        } else {
          response = await API.config.updateCode(editRow)
        }
        if (response) {
          this.getCodeList()
          this.codeData.forEach(item => {
            item.edit = false
            item.crud = null
          })
          this.selectedRow = ''
          this.selectedUpperCode = null
          // this.$alert('저장 성공')
          this.$alert(this.$t('common.ALERT.BASE.047'))
        } else {
          // this.$alert('저장 실패')
          this.$alert(this.$t('common.ALERT.BASE.048'))
        }
        this.editStatus = false
        this.isSelectable = true
        this.isLoadingReq = false
      } else {
        // this.$alert('값을 확인해주세요')
        if (codeValid === false) this.$alert(this.$t('common.ALERT.PROJECT.032'))
      }
    },
    /**
     * 모달에서 선택한 관계사 데이터를 가져옵니다.
     * @param [Array] 모달에서 선택한 관계사들
     */
    setMapping (parameter, range) {
      const comps = map(parameter, 'label')
      this.selectedComps = comps.join(',<br>')
      if (this.selectedRow) this.selectedRow._data[range] = this.selectedComps
    },
    /**
     * 코드 생성 및 변경 시 Null 값 체크
     * @param [Object] 코드 정보
     */
    async codeValidation (code) {
      const typeObj = this.rawTypeList.find(c => c.typeName === code.codeType || c.typeCode === code.codeType)
      const sameTypeCodes = this.rawCodeData
        .filter(_c => _c.codeIdx !== code.codeIdx)
        .filter(_c => {
          const sameCode = _c.codeType === code.codeType && _c.codeVal === code.codeVal
          const sameName = _c.codeType === typeObj?.typeCode && _c.codeName === code.codeName
          return sameCode || sameName
        })
      const validCodeVal = sameTypeCodes.length <= 0
      if (!validCodeVal) {
        return await this.$alert('중복된 값이 존재합니다.', { callback: () => null })
      }
      return (code.codeType && code.codeType !== null) &&
      (code.codeVal && code.codeVal !== null) &&
      (code.codeName && code.codeName !== null)
    },
    /**
     * 코드리스트를 조회합니다.
     */
    async getCodeList () {
      const codeList = await API.config.getCodeList()
      this.rawCodeData = codeList
      this.codeData = this.convertCode(codeList)
      if (this.filterObj && !isEmpty(this.filterObj)) {
        this.searchData()
      }
    },
    /**
     * 코드 내부의 타입 정보(코드)를 타입 이름으로 변경합니다.
     */
    convertCode (data = []) {
      return data.map(code => {
        const codeObj = { ...code }
        codeObj.codeType = this.typeNameMap.get(code.codeType)
        if (code.isTree && code.upperCodeIdx) {
          codeObj.upperCode = data.find(cd => {
            if (cd.codeIdx === codeObj.upperCodeIdx) return cd
          })
        }
        return codeObj
      })
    },
    /**
     * 타입 정보를 조회합니다.
     */
    async getTypeList () {
      const typeList = await API.config.getTypeList()
      if (typeList) {
        this.rawTypeList = typeList
        this.typeList = typeList.map(type => {
          return {
            value: type.typeCode,
            label: type.typeName
          }
        })
        typeList.forEach(type => {
          this.typeKeyMap.set(type.typeName, type.typeCode)
          this.typeNameMap.set(type.typeCode, type.typeName)
        })
        this.filteringList[0].selections = [{ value: undefined, label: this.$t('main.DASHBOARD.all') }, ...this.typeList]
      }
    },
    /**
     * 코드추가/수정 시 코드 내 타입이름을 타입코드로 변환
     */
    convertTypeNameToCode (code) {
      const result = { ...code }
      const typeCode = this.typeKeyMap.get(code.codeType)
      if (typeCode) {
        result.codeType = typeCode
      }
      return result
    },
    /**
     * @deprecated
     * 초기화 버튼 클릭 시 필터링 데이터 초기화
     */
    // resetData () {
    //   this.codeData = this.convertCode(this.rawCodeData)
    // },
    /**
     * 필터링 선택시 별도 data에 저장
     */
    selectFilter (select) {
      this.cancelEditMode()
      this.filterObj = select
      this.searchData()
      this.editStatus = false
    },
    /**
     * 필터링 내용을 적용
     */
    searchData () {
      let filterRawCode
      if (this.filterObj?.type) {
        filterRawCode = this.rawCodeData.filter(code => code.codeType === this.filterObj.type)
      } else {
        filterRawCode = this.rawCodeData
      }
      this.codeData = this.convertCode(filterRawCode)
    },
    changingPage (pageNumber) {
      // for (let i = 0; i < this.codeData.length; i++) {

      // }
      this.codeData.forEach(code => {
        delete code.edit
        delete code.crud
      })
      this.editStatus = false
      this.selectedRow = null
      this.isSelectable = true
    },
    validateRowData ({ codeType, codeVal, codeName, codeDesc, isTree, upperCodeIdx }) {
      if (!codeType || !codeVal || !codeName || !codeDesc) {
        this.$alert(this.$t('common.ALERT.METER.001'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        return false
      }
      if (isTree && !upperCodeIdx) {
        this.$alert(this.$v('트리 구조일 경우 상위 코드 IDX 값이 필수 입니다.'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        return false
      }
      return true
    },
    cancelEditMode () {
      this.editStatus = false
      this.selectedRow = null
      this.isSelectable = true
    }
  },
  data () {
    return {
      clonedCodeData: [],
      rawTypeList: [],
      totalResultCnt: 0,
      filteredItem: '',
      filteringList: [
        {
          field: 'type',
          label: '타입',
          keyPath: 'common.GRID.type',
          selections: []
        }
      ],
      typeList: [
        { value: '성별', label: '성별' }
      ],

      newTableItem: {
        codeType: '',
        codeVal: '',
        codeName: '',
        codeDesc: '',
        codeNameType: '',
        isShow: true,
        isTree: false,
        upperCodeIdx: null
      },

      editStatus: false,
      selectedRow: undefined, // 선택한 로우
      // compMappingModal: false, // 관계사-카테고리 맵핑 모달
      // roleMappingModal: false, // 관계사-역할 맵핑 모달
      selectedComps: '',

      // 테이블 데이터
      codeColumns: [
        { header: '코드 타입', binding: 'codeType', placehoder: '', width: 170, customHtml: true },
        { header: '코드 값', binding: 'codeVal', placehoder: this.$v('코드 값 추가 시 변경이 불가능합니다.'), width: 220, customHtml: true },
        { header: '코드 이름 타입', binding: 'codeNameType', placehoder: this.$v('코드 이름 타입'), width: 200, customHtml: true },
        { header: '코드 이름', binding: 'codeName', placehoder: '코드 이름 입력', width: 220, customHtml: true },
        { header: '상위 코드', binding: 'upperCode', placehoder: this.$v('상위 코드'), width: '*', customHtml: true },
        { header: '트리 구조 여부', binding: 'isTree', placehoder: this.$v('트리 구조 여부'), width: 120, customHtml: true },
        { header: '코드 노출 여부', binding: 'isShow', placehoder: this.$v('코드 노출 여부'), width: 120, customHtml: true },
        { header: '설명', binding: 'codeDesc', placehoder: '설명 입력', width: '*', customHtml: true, align: 'left' }
      ],
      codeData: [],
      rawCodeData: [],
      typeNameMap: new Map(),
      typeKeyMap: new Map(),
      filterObj: undefined,
      grid: null,
      codeGrid: null,
      isSelectable: true,
      isLoadingReq: false,
      disableEdit (column, row) {
        // codeVal 컬럼일 경우 => 추가할때만 editable 가능 & 변경할때는 disable
        if (column === 'codeVal') return (row && row._data.crud === 'create')
        else return true
      },
      codeNameTypeOptions: [
        { value: 'INPUT', label: 'INPUT' },
        { value: 'TEXTAREA', label: 'TEXTAREA' }
      ],
      activeModal: false,
      selectedUpperCode: null,
      inputType: 'input'
    }
  }
}
</script>
<style lang="scss">
.config-code-all {
  > .action-area {
    > .button-area {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: $gap;
    }
  }

  > .table-area {
    .wj-cell {
      &.frozen-row {
        color: $disable;
      }
    }
  }

  .select-modal {
    .searchInput {
      margin-bottom: 10px;
      width: 220px;
    }
  }
}
</style>
