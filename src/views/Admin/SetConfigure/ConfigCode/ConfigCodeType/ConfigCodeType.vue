<!--
  * 파일명 : ConfigCodeType.vue
  * 파일 기능 : 정의된 타입 리스트 노출 및 관리(변경)
  * 작성자 : 전경열 외 2명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 코드관리 - 타입 변경 클릭 후 다른 로우 클릭 시 처리 코드관리 - 코드 추가 후 삭제 클릭 시 처리
 -->

<template>
  <div class="config-code-type">
    <!-- <filtering-component
      :data="filteringList"
      @selected="selectFilter"
      @apply="searchData"
    /> -->
    <!-- @selected="selectFilter" -->
    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />

      <div class="button-area -right">
        <!-- <button
          class="button"
          type="is-primary"
          @click="addType(grid)"
          disabled
        >
          타입 추가
        </button> -->
        <!-- v-if="editStatus" -->
        <button
          v-if="editStatus || (selectedRow && selectedRow._data.edit)"
          @click="cancelEditStatus"
          class="button"
        >
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow || selectedRow._data.edit"
          @click="modifyItem"
          v-if="!editStatus"
        >
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          v-if="editStatus || (selectedRow && selectedRow._data.edit)"
          @click="finishEditStatus(grid)"
        >
          {{ $t('common.BTN.complete') }}
        </button>
        <!-- <button
          class="button"
          disabled
          @click="applyRemove"
          type="is-anti"
        >
          삭제
        </button> -->
      </div>
    </section>

    <section
      class="table-area"
      ref="codeTableRef"
    >
      <cmp-grid
        :item-source="codeTypeData"
        :columns="codeTypeColumns"
        is-read-only
        :selectable="isSelectable"
        :init-custom-action="init"
        @selectedRow="rowSelect"
        @changingPage="changingPage"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template
          v-for="column in codeTypeColumns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div :key="column.binding">
            <el-input
              v-model="props.row[column.binding]"
              v-if="(editStatus && props.cell.isSelected && props.cell._data.edit) || props.cell._data.edit"
              @keyup.native="e => {
                if(e.key === 'Enter') finishEditStatus()
              }"
            />
            <!-- @change="finishEditStatus(grid)" -->
            <div v-else>
              {{ props.row[column.binding] }}
              <!-- <button @click="test(cell)">
                테스트
              </button> -->
            </div>
          </div>
        </template>
      </cmp-grid>
    </section>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash'
import * as wjGrid from '@grapecity/wijmo.grid'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ConfigCodeType',
  created () {
    this.getTypeList()
  },
  methods: {
    getOriginData () {
      const { typeCode, typeName, typeDesc } = this.clonedItem
      const type = this.codeTypeData.findIndex(x => x.typeCode === typeCode)
      console.log(type)
      if (type !== -1) {
        this.codeTypeData[type].typeName = typeName
        this.codeTypeData[type].typeDesc = typeDesc
      }
    },
    disableEditMode () {
      this.editStatus = false
      this.isSelectable = true
      this.codeTypeData.forEach(item => {
        delete item.edit
        delete item.crud
      })
    },
    cancelEditStatus () {
      if (this.selectedRow._data.crud && this.selectedRow._data.crud === 'update') {
        this.getOriginData()
        this.disableEditMode()
      }
    },
    rowSelect (selected) {
      this.selectedRow = selected
    },
    init (grid) {
      this.grid = grid
    },
    /**
     * 타입추가 / 변경 후 완료버튼 @click 이벤트 발생시 호출하는 메소드
     */
    async finishEditStatus () {
      const editRow = this.selectedRow._data
      const typeValid = this.typeValid(editRow)
      if (typeValid) {
        let response
        if (editRow.crud === 'create') {
          response = await API.config.createType(editRow)
        } else {
          response = await API.config.updateType(editRow)
        }
        if (response) {
          this.getTypeList()
          this.editStatus = false
          this.codeTypeData.forEach(item => {
            item.edit = false
            item.crud = null
          })
          // this.$alert('저장 성공')
          this.$alert(this.$t('common.ALERT.BASE.047'))
        }
        this.isSelectable = true
      } else {
        // this.$alert('값을 확인해주세요')
        this.$alert(this.$t('common.ALERT.PROJECT.032'))
      }
    },
    /**
     * 타입 추가 시 그리드에 새로운 Row 추가 메소드
     */
    addType () {
      const isNewCode = this.codeTypeData.filter(code => code.crud === 'create' && code.edit)
      if (isNewCode.length) return

      const newRow = new wjGrid.Row()
      const newObj = {
        crud: 'create',
        typeCode: this.newTableItem.typeCode,
        typeName: this.newTableItem.typeName,
        typeDesc: this.newTableItem.typeDesc,
        edit: true
      }
      newRow._data = newObj

      if (this.grid) {
        this.grid.rows.insert(0, newRow)
      }
      this.codeTypeData.splice(0, 0, newObj)

      this.editStatus = true
    },
    /**
     * Row 선택 후 변경 클릭시 input으로 변경하는 메소드
     */
    modifyItem () {
      this.isSelectable = false
      this.selectedRow._data.crud = 'update'
      this.editStatus = true
      this.selectedRow._data.edit = true
      this.clonedItem = cloneDeep(this.selectedRow._data)
    },
    /**
     * 삭제 메소드
     */
    async removeItem (item) {
      const typeIdx = item._data.typeIdx
      const deleteResult = await API.config.deleteType({ typeIdx: typeIdx })
      if (deleteResult) {
        const removeIdx = item._idx
        this.grid.rows.remove(this.grid.rows[removeIdx])
        this.codeTypeData.splice(removeIdx, 1)
        this.selectedRow = undefined
        // this.$alert('삭제 성공')
        this.$alert(this.$t('common.ALERT.BASE.039'))
      } else {
        // this.$alert('삭제 실패')
        this.$alert(this.$t('common.ALERT.BASE.038'))
      }
    },
    /**
     * 삭제 버튼 선택 시 메소드
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.031'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.removeItem(this.selectedRow)
      }).catch(() => false)
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    /**
     * @deprecated (Filtering Component 미사용)
     * 필터링 선택시 별도 변수에 저장
     */
    selectFilter (select) {
      this.filterObj = select
    },
    /**
     * @deprecated (Filtering Component 미사용)
     * 필터링 검색
     */
    searchData () {
      if (this.filterObj?.typeClass) {
        this.codeTypeData = this.typeRawData.filter(type => type.typeClass === this.filterObj.typeClass)
      } else {
        this.codeTypeData = this.typeRawData
      }
    },
    /**
     * 타입목록 조회 API 호출
     * 필터링 목록 추출
     */
    async getTypeList () {
      const typeList = await API.config.getTypeList()
      const typeClassSet = new Set()
      typeList.forEach(type => {
        typeClassSet.add(type.typeClass)
      })
      this.codeTypeData = typeList
    },
    /**
     * 타입 유효성 확인
     */
    typeValid (type) {
      return (type?.typeCode && type.typeCode !== null) &&
      (type?.typeName && type.typeName !== null)
    },
    changingPage (pageNumber) {
      if (this.editStatus) {
        this.getOriginData()
        this.disableEditMode()
        this.selectedRow = null
      }
    }
  },
  data () {
    return {
      clonedItem: {},
      totalResultCnt: 0,
      filteredItem: '',
      filteringList: [
        {
          field: 'typeClass',
          label: '필터',
          selections: []
        }
      ],
      codeTypeColumns: [
        { header: 'Type', binding: 'typeCode', width: 300, isReadOnly: true },
        { header: 'Name', binding: 'typeName', width: 400, isReadOnly: true, customHtml: true },
        { header: 'Desc', binding: 'typeDesc', width: '*', isReadOnly: true, customHtml: true, align: 'left' }
      ],
      codeTypeData: [],

      newTableItem: {
        typeCode: '',
        typeName: '',
        typeDesc: '',
        disable: ''
      },

      editStatus: false,
      selectedRow: undefined,
      filterObj: undefined,
      isSelectable: true
      // typeRawData: []
    }
  }
}
</script>
<style lang="scss">
  .config-code-type {
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
  }
</style>
