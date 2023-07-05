<!--
  * 파일명 : ResourceOperationSecurity.vue
  * 파일 기능 : 자원 운용 > 보안그룹 자원 정보 (readOnly) 데이터를 보여주기만 할 뿐, 조작 하진 않습니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-20
  * License By Shinsegae I&C
 -->

<template>
  <div class="operation-storage">
    <div
      class="grid-wrap"
      v-if="!isCart && withCartVmData.length"
    >
      <resource-title>
        <!-- 장바구니에 담긴 VM과 연관 있는 Security -->
        {{ $t('config.TRANSFER.relatedToVmInBasket', { type: 'Security' }) }}
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="withCartVmData"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :init-custom-action="flex => this.withVmGrid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="securityGroupIdx"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @checkedRowsData="items => {
          withVmCheckedItems = items
          checkHandler()
          gridRefresh(grid)
        }"
      >
        <template #companyName="props">
          <span v-if="props.row.companyName">{{ props.row.companyName }}</span>
          <span v-else>-</span>
        </template>
        <!-- 관계사 -->

        <template #companyGroupName="props">
          <span v-if="props.row.companyGroupName">{{ props.row.companyGroupName }}</span>
          <span v-else>-</span>
        </template>
        <!-- 조직 -->

        <template #projectName="props">
          <span v-if="props.row.projectName">{{ props.row.projectName }}</span>
          <span v-else>-</span>
        </template>
        <!-- 프로젝트 -->

        <template #createTime="props">
          {{ props.row.createTime | dateSimple }}
        </template>
        <!-- 생성일 -->
      </cmp-grid>
    </div>
    <!-- 장바구니에 담긴 VM과 연관 있는 자원 -->

    <div class="grid-wrap">
      <resource-title :count="totalResultCnt">
        Security
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="gridData"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :init-custom-action="flex => this.grid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="securityGroupIdx"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="items => {
          checkedItems = items
          checkHandler()
          gridRefresh(withVmGrid)
        }"
      >
        <template #companyName="props">
          {{ props.row.companyName || '-' }}
        </template>
        <!-- 관계사 -->

        <template #groupName="props">
          {{ props.row.groupName || '-' }}
        </template>
        <!-- 조직 -->

        <template #projectName="props">
          {{ props.row.projectName || '-' }}
        </template>
        <!-- 프로젝트 -->

        <template #createTime="props">
          {{ props.row.createTime | dateSimple }}
        </template>
        <!-- 생성일 -->

        <template #resourceName="props">
          {{ props.row.resourceName || '-' }}
        </template>
        <!-- 프로젝트 -->

        <template #deleting="props">
          <div class="flex-wrap">
            <button
              v-if="editable"
              class="button"
              type="is-icon"
            >
              <i class="-edit-icon" />
            </button>
            <button
              v-if="deletable"
              class="button"
              type="is-icon"
              @click.stop="clickDelete(props.row)"
            >
              <i class="delete-icon" />
            </button>
          </div>
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import { uniqBy } from 'lodash'
import ResourceTitle from './ResourceTitle.vue'
import GridUtils from '@/components/Utils/GridUtils'
import ResourceOperationMixins from './ResourceOperation.mixins.js'

export default {
  name: 'ResourceOperationSecurity',
  mixins: [ResourceOperationMixins],
  components: {
    ResourceTitle
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    deletable: { // row 식제 아이콘 노출 여부
      type: Boolean,
      default: false
    },
    editable: { // row 편집 아이콘 노출 여부
      type: Boolean,
      default: false
    },
    hostNamesInBasket: { // 이관 장바구니에 있는 vm의 호스트명
      type: Array,
      default: () => []
    },
    initAutoSelectRow: {
      type: Array,
      default: () => []
    },
    checkedResources: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (list) {
        this.setGridInfo(list)
      }
    }
  },
  computed: {
    gridColumns () {
      if (this.deletable || this.editable) return this.columns
      else return this.columns.filter(col => col.binding !== 'deleting')
    },
    isCart () { // 이관바구니인지? => 장바구니에 담긴 VM 관련 자원 미노출
      return this.deletable
    }
  },
  methods: {
    setGridInfo (data) {
      this.gridData = data.map(row => {
        return {
          ...row,
          companyName: row.companyName || '',
          groupName: row.groupName || '',
          projectName: row.projectName || '',
          checked: this.setRowCheckState(row) // 초기 체크 row 세팅
        }
      })

      // columnDataMap 세팅
      this.columnDataMap.createTime = GridUtils.setColumnDataMap('createTime', this.gridData, 'date')
      this.columnDataMap.startTime = GridUtils.setColumnDataMap('startTime', this.gridData, 'date')
      this.columnDataMap.endTime = GridUtils.setColumnDataMap('endTime', this.gridData, 'date')
    },
    checkHandler () {
      // this.$emit('checkedRowsData', [...this.withVmCheckedItems, ...this.checkedItems])
      const originCheckedData = this.checkedResources

      const temp = uniqBy([...this.gridData, ...originCheckedData], 'userNetIdx')
      const newCheckedRows = temp.filter(row => row.checked)

      this.$emit('checkedRowsData', newCheckedRows)
    },
    /**
     * row 삭제 시, 발생 이벤트
     */
    clickDelete (row) {
      if (!this.deletable) return false

      this.$emit('delete-row', row)
    }
  },
  data () {
    return {
      gridData: [],
      withCartVmData: [], // 장바구니에 담긴 VM과 연관 있는 자원
      totalResultCnt: 0,
      withVmCheckedItems: [], // vm과 연관 있는 자원 그리드에서 체크 아이템
      checkedItems: [], // 일반 그리드에서 체크 아이템
      columns: [
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', customHtml: true },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', customHtml: true },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', customHtml: true },
        { binding: 'createTime', header: '자원생성일', customHtml: true, keyPath: 'common.REGCON.createTime' },
        { header: '보안 그룹명', binding: 'resourceName', keyPath: 'common.GRID.NETWORK.secGroup', customHtml: true },
        { header: '정책 시작일', binding: 'startTime', keyPath: 'common.GRID.NETWORK.policyStartDate' },
        { header: '정책 종료일', binding: 'endTime', keyPath: 'common.GRID.NETWORK.policyExpireDate' },
        { header: ' ', binding: 'deleting', customHtml: true, width: 60, sorting: false }
      ],
      columnDataMap: {
        createTime: [],
        startTime: [],
        endTime: []
      },
      searchableColumns: [ // 검색시 사용. 지우지 마세요.
        { binding: 'resourceName', label: this.$t('common.GRID.NETWORK.secGroup') } // 보안 그룹명
        // { binding: 'allHostIp', label: 'VM IP' },
        // { binding: 'ip', label: '가상IP' }
      ]
    }
  }
}
</script>
