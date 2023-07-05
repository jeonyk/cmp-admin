<!--
  * 파일명 : ResourceOperationNetwork.vue
  * 파일 기능 : 자원 운용 > Network(L4, L7) 자원 정보 (readOnly) 데이터를 보여주기만 할 뿐, 조작 하진 않습니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-21
  * License By Shinsegae I&C
 -->

<template>
  <div class="operation-network">
    <div
      class="grid-wrap"
      v-if="!isCart && withCartVmL4Data.length"
    >
      <resource-title>
        <!-- 장바구니에 담긴 VM과 연관 있는 Network(L4) -->
        {{ $t('config.TRANSFER.relatedToVmInBasket', { type: 'Network(L4)' }) }}
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="withCartVmL4Data"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :auto-row-heights="true"
        :init-custom-action="flex => this.withVmL4Grid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="vrserverIdx"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @checkedRowsData="items => {
          l4WithVmCheckedItems = items
          checkHandler('l4')
          gridRefresh(l4Grid)
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

        <template #allHostName="props">
          <div v-if="props.row.allHostName.length">
            <p
              v-for="name in props.row.allHostName"
              :key="name"
            >
              {{ name }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- VM(Host)명 -->

        <template #allHostIp="props">
          <div v-if="props.row.allHostIp.length">
            <p
              v-for="ip in props.row.allHostIp"
              :key="ip"
            >
              {{ ip }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
      <!-- VM(Host) IP -->
      </cmp-grid>
    </div>
    <div
      class="grid-wrap"
      v-if="!isCart && withCartVmL7Data.length"
    >
      <resource-title>
        <!-- 장바구니에 담긴 VM과 연관 있는 Network(L7) -->
        {{ $t('config.TRANSFER.relatedToVmInBasket', { type: 'Network(L7)' }) }}
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="withCartVmL7Data"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :auto-row-heights="true"
        :init-custom-action="flex => this.withVmL7Grid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="csVrserverIdx"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @checkedRowsData="items => {
          l7WithVmCheckedItems = items
          checkHandler('l7')
          gridRefresh(l7Grid)
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

        <template #allHostName="props">
          <div v-if="props.row.allHostName.length">
            <p
              v-for="name in props.row.allHostName"
              :key="name"
            >
              {{ name }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- VM(Host)명 -->

        <template #allHostIp="props">
          <div v-if="props.row.allHostIp.length">
            <p
              v-for="ip in props.row.allHostIp"
              :key="ip"
            >
              {{ ip }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
      <!-- VM(Host) IP -->
      </cmp-grid>
    </div>
    <!-- 장바구니에 담긴 VM과 연관 있는 자원 -->

    <el-radio-group
      v-if="useToggleBtn"
      class="radio-switch-group"
      v-model="view"
      @input="changeInput"
    >
      <el-radio-button label="l4">
        L4
      </el-radio-button>
      <el-radio-button label="l7">
        L7
      </el-radio-button>
    </el-radio-group>
    <div
      v-if="!onlyL7"
      v-show="useToggleBtn ? view === 'l4' : gridL4Data.length"
      class="network-resource-section"
    >
      <resource-title :count="totalL4Cnt">
        Network(L4)
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="gridL4Data"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :auto-row-heights="true"
        :init-custom-action="flex => {
          flex.rows.defaultSize = 80
          this.l4Grid = flex
        }"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="vrserverIdx"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @total-count="cnt => totalL4Cnt = cnt"
        @checkedRowsData="items => {
          l4CheckedItems = items
          checkHandler('l4')
          if(withVmL4Grid) gridRefresh(withVmL4Grid)
        }"
        class="resource-operation-grid"
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

        <template #allHostName="props">
          <div v-if="props.row.allHostName.length">
            <p
              v-for="name in props.row.allHostName"
              :key="name"
            >
              {{ name }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- VM(Host)명 -->

        <template #allHostIp="props">
          <div v-if="props.row.allHostIp.length">
            <p
              v-for="ip in props.row.allHostIp"
              :key="ip"
            >
              {{ ip }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- VM(Host) IP -->

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
    <!-- L4 -->

    <div
      v-if="!onlyL4"
      v-show="useToggleBtn ? view === 'l7' : gridL7Data.length"
      :style="{
        marginTop: gridL4Data.length && !useToggleBtn ? '30px' : 0
      }"
    >
      <resource-title :count="totalL7Cnt">
        Network(L7)
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="gridL7Data"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :auto-row-heights="true"
        :init-custom-action="flex => {
          flex.rows.defaultSize = 80
          this.l7Grid = flex
        }"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="csVrserverIdx"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @total-count="cnt => totalL7Cnt = cnt"
        @checkedRowsData="items => {
          l7CheckedItems = items
          checkHandler('l7')
          if(withVmL7Grid) gridRefresh(withVmL7Grid)
        }"
        class="resource-operation-grid"
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

        <template #allHostName="props">
          <div v-if="props.row.allHostName.length">
            <p
              v-for="name in props.row.allHostName"
              :key="name"
            >
              {{ name }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- VM(Host)명 -->

        <template #allHostIp="props">
          <div v-if="props.row.allHostIp.length">
            <p
              v-for="ip in props.row.allHostIp"
              :key="ip"
            >
              {{ ip }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- VM(Host) IP -->

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
import ResourceTitle from './ResourceTitle.vue'
import GridUtils from '@/components/Utils/GridUtils'
import { uniqBy } from 'lodash'
import ResourceOperationMixins from './ResourceOperation.mixins.js'

export default {
  name: 'ResourceOperationNetwork',
  mixins: [ResourceOperationMixins],
  components: {
    ResourceTitle
  },
  props: {
    data: { // L4 + L7 데이터
      type: Array,
      default: () => []
    },
    useToggleBtn: { // L4, L7 그리드를 토글 버튼 형식으로 보여줄 것인지?
      type: Boolean,
      default: true
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
    checkedResourcesL4: {
      type: Array,
      default: () => []
    },
    checkedResourcesL7: {
      type: Array,
      default: () => []
    },
    onlyL4: {
      type: Boolean,
      default: false
    },
    onlyL7: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    data: {
      immediate: true,
      handler (newVal) {
        this.setGridInfo(newVal)
        // console.log('@NETWORK: ', newVal)
      }
    }
  },
  computed: {
    gridColumns () {
      if (this.deletable || this.editable) return this.columns
      else return this.columns.filter(col => col.binding !== 'deleting')
    },
    isCart () { // 이관 바구니인지? => 장바구니에 담긴 VM 관련 자원 미노출
      return this.deletable
    }
  },
  methods: {
    changeInput () {
      this.$emit('changeInput')
    },
    setGridInfo (data) {
      const l4 = []
      const l7 = []
      const vmL4 = []
      const vmL7 = []

      data.forEach(row => {
        row.checked = this.setRowCheckState(row) // 초기 체크 row 세팅

        const defaultData = row.workType === 'NETWORK_L4' ? l4 : l7
        const vmData = row.workType === 'NETWORK_L4' ? vmL4 : vmL7 // 장바구니에 있는 vm과 연관된 자원

        row.allHostName = [] // VM(Host) 명
        row.allHostIp = [] // VM(Host) IP

        let serviceList
        if (row.workType === 'NETWORK_L4') serviceList = row.serviceList
        else if (row.policies) { // L7일 때, 서비스 리스트 목록 설정
          const l7Services = []
          const vrservers = row.policies.map(pl => pl.vrserver)
          vrservers.forEach(p => {
            if (!p?.serviceList?.length) return

            p.serviceList.forEach(item => {
              l7Services.push(item)
            })
          })
          serviceList = uniqBy(l7Services, 'serverName')
        }

        row.companyName = row.companyName || ''
        row.groupName = row.groupName || ''
        row.projectName = row.projectName || ''

        if (serviceList?.length) {
          serviceList.forEach(sv => {
            row.allHostName.push(sv.hostName)
            row.allHostIp.push(sv.server.ip)
          })
        }

        // 장바구니가 아닐 때 : 이관 장바구니에 있는 vm의 호스트와 연관된 자원을 분리합니다.
        if (!this.isCart) {
          if (row.allHostName.some(name => this.hostNamesInBasket.includes(name))) vmData.push(row)
        }
        defaultData.push(row)
      })

      this.gridL4Data = [...l4]
      this.gridL7Data = [...l7]
      this.withCartVmL4Data = [...vmL4]
      this.withCartVmL7Data = [...vmL7]

      // columnDataMap 세팅
      this.columnDataMap.createTime = GridUtils.setColumnDataMap('createTime', this.gridData, 'date')

      // this.gridL4Data = data.filter(item => item.workType === 'NETWORK_L4')
      // this.gridL7Data = data.filter(item => item.workType === 'NETWORK_L7')
    },
    checkHandler (field) {
      if (field === 'l4') {
        // const sum = [...this.l4WithVmCheckedItems, ...this.l4CheckedItems]
        // this.$emit('checkedRowsL4Data', uniqBy(sum, 'resourceId'))
        const temp = uniqBy([...this.gridL4Data, ...this.checkedResourcesL4], 'vrserverIdx')
        const newCheckedRows = temp.filter(row => row.checked)

        this.$emit('checkedRowsL4Data', newCheckedRows)
      } else {
        // const sum = [...this.l7WithVmCheckedItems, ...this.l7CheckedItems]
        // this.$emit('checkedRowsL7Data', uniqBy(sum, 'resourceId'))
        const temp = uniqBy([...this.gridL7Data, ...this.checkedResourcesL7], 'csVrserverIdx')
        const newCheckedRows = temp.filter(row => row.checked)

        this.$emit('checkedRowsL7Data', newCheckedRows)
      }
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
      gridL4Data: [],
      gridL7Data: [],
      withCartVmL4Data: [], // 장바구니에 담긴 VM과 연관 있는 자원 L4
      withCartVmL7Data: [], // 장바구니에 담긴 VM과 연관 있는 자원 L7
      l4WithVmCheckedItems: [], // L4: vm과 연관 있는 자원 그리드에서 체크 아이템
      l4CheckedItems: [], // L4: 일반 그리드에서 체크 아이템
      l7WithVmCheckedItems: [], // l7: vm과 연관 있는 자원 그리드에서 체크 아이템
      l7CheckedItems: [], // l7: 일반 그리드에서 체크 아이템
      view: 'l4',
      totalL4Cnt: 0,
      totalL7Cnt: 0,
      columns: [
        { binding: 'companyName', header: '관계사', keyPath: 'common.TERMS.rel', customHtml: true },
        { binding: 'groupName', header: '조직', keyPath: 'common.TERMS.group', customHtml: true },
        { binding: 'projectName', header: '프로젝트', keyPath: 'common.TERMS.project', customHtml: true },
        { binding: 'createTime', header: '자원생성일', customHtml: true, keyPath: 'common.REGCON.createTime' },
        { binding: 'allHostName', header: 'VM(Host)명', keyPath: 'config.TRANSFER.vmHostName', customHtml: true, width: 180 },
        { binding: 'allHostIp', header: 'VM(Host) IP', customHtml: true },
        { binding: 'resourceName', header: '로드 밸런스명', align: 'left', width: 200, keyPath: 'common.GRID.NETWORK.lbName' },
        { binding: 'ip', header: '가상IP', width: 150, keyPath: 'common.MODAL.virtualIp' },
        { binding: 'port', header: '포트', customHtml: true, width: 150, keyPath: 'common.GRID.NETWORK.port' },
        { binding: 'protocolType', header: '프로토콜', width: 150, keyPath: 'common.MODAL.protocol' },
        { binding: 'method', header: '방식', keyPath: 'common.GRID.NETWORK.system' },
        { header: ' ', binding: 'deleting', customHtml: true, width: 60, sorting: false }
      ],
      columnDataMap: {
        createTime: []
      },
      searchableColumns: [ // 검색시 사용. 지우지 마세요.
        { binding: 'allHostName', label: this.$t('common.GRID.hostName') }, // 호스트명
        { binding: 'allHostIp', label: 'VM IP' },
        { binding: 'ip', label: this.$t('common.GRID.NETWORK.virtualIp') } // 가상 IP
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .operation-network {
    .grid-wrap + .radio-switch-group { margin-top: 60px; }
    .radio-switch-group {
      margin-bottom: $gap-m;
    }
  }
</style>
