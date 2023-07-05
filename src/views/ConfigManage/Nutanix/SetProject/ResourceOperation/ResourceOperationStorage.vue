<!--
  * 파일명 : ResourceOperationStorage.vue
  * 파일 기능 : 자원 운용 > Storage 자원 정보 (readOnly) 데이터를 보여주기만 할 뿐, 조작 하진 않습니다.
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
        <!-- 장바구니에 담긴 VM과 연관 있는 Storage -->
        {{ $t('config.TRANSFER.relatedToVmInBasket', { type: 'Storage' }) }}
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="withCartVmData"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :init-custom-action="flex => withVmGrid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="vgUuid"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @checkedRowsData="items => {
          withVmCheckedItems = items
          gridRefresh(grid)
          checkHandler()
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

        <template #vmNames="props">
          <div v-if="props.row.vmNames.length">
            <p
              v-for="vm in props.row.vmNames"
              :key="vm"
            >
              {{ vm }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- 연결된 VM(Host)명 -->

        <template #hostIp="props">
          <div v-if="props.row.hostIp.length">
            <p
              v-for="ip in props.row.hostIp"
              :key="ip"
            >
              {{ ip }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
      <!-- 연결된 VM(Host) IP -->
      </cmp-grid>
    </div>
    <!-- 장바구니에 담긴 VM과 연관 있는 자원 -->

    <div class="grid-wrap">
      <resource-title :count="totalResultCnt">
        Storage
      </resource-title>
      <cmp-grid
        v-loading="loading"
        :item-source="gridData"
        :columns="gridColumns"
        :column-data-map="columnDataMap"
        :changing-page-reset="false"
        :init-custom-action="flex => this.grid = flex"
        :init-auto-select-row="initAutoSelectRow"
        init-auto-select-row-key="vgUuid"
        header-checkbox
        page-keeping
        @loaded-rows="onLoadedRows"
        @total-count="cnt => totalResultCnt = cnt"
        @checkedRowsData="items => {
          checkedItems = items
          if(withVmGrid) gridRefresh(withVmGrid)
          checkHandler()
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

        <template #vmNames="props">
          <div v-if="props.row.vmNames.length">
            <p
              v-for="vm in props.row.vmNames"
              :key="vm"
            >
              {{ vm }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- 연결된 VM(Host)명 -->

        <template #hostIp="props">
          <div v-if="props.row.hostIp.length">
            <p
              v-for="ip in props.row.hostIp"
              :key="ip"
            >
              {{ ip }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- 연결된 VM(Host) IP -->

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
  name: 'ResourceOperationStorage',
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
        // console.log('@STORAGE: ', list)
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
      const mappedHostNames = []
      const mappedIps = []

      const result = []
      this.withCartVmData = []

      data.forEach(row => {
        // 관-조-프 명
        row.companyName = row.companyName || ''
        row.groupName = row.groupName || ''
        row.projectName = row.projectName || ''

        // vms : 연결된 VM(Host)명, VM(Host) IP
        const vmNames = []

        row.vmNames = []
        row.hostIp = []

        if (row.vms) {
          row.vms.forEach(vm => {
            mappedHostNames.push({ value: vm.hostname, caption: vm.hostname })
            vmNames.push(vm.hostname)

            row.vmNames.push(vm.hostname)

            if (vm?.nics?.length && vm?.nics[0]?.ipAddress) {
              row.hostIp.push(vm.nics[0].ipAddress)
              mappedIps.push({ value: vm.nics[0].ipAddress, caption: vm.nics[0].ipAddress })
            }
          })
        }

        // diskSum : 크기(신청 용량)
        const diskSumBytes = this.$options.filters.volumnGroupSize(row.disks, 'vmDiskSizeBytes')
        row.diskSum = this.$options.filters.byte(diskSumBytes)

        // diskCount : 수량
        row.diskCount = row.disks?.length || 0

        // 장바구니가 아닐 때 : 이관 장바구니에 있는 vm의 호스트와 연관된 자원을 분리합니다.
        if (!this.isCart) {
          if (vmNames.some(name => this.hostNamesInBasket.includes(name))) this.withCartVmData.push(row)
        }

        row.checked = this.setRowCheckState(row)
        result.push(row)
      })

      this.gridData = [...result]

      // columnDataMap 세팅
      this.columnDataMap.vmNames = Array.from(new Set(mappedHostNames))
      this.columnDataMap.hostIp = Array.from(new Set(mappedIps))
      this.columnDataMap.createTime = GridUtils.setColumnDataMap('createTime', this.gridData, 'date')
    },
    checkHandler () {
      // this.$emit('checkedRowsData', [...this.withVmCheckedItems, ...this.checkedItems])
      const originCheckedData = this.checkedResources

      const temp = uniqBy([...this.gridData, ...originCheckedData], 'userVgIdx')
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
        { binding: 'vmNames', header: '연결된 VM(Host)명', keyPath: 'config.TRANSFER.connectedVmHostName', customHtml: true, width: 180 },
        { binding: 'hostIp', header: 'VM(Host) IP', customHtml: true },
        { binding: 'vgName', header: 'Volume그룹명', keyPath: 'common.GRID.COMPUTE.volumeGroupName', align: 'left' },
        { binding: 'diskSum', header: '크기(신청 용량)', width: 100, keyPath: 'common.GRID.STORAGE.size' },
        { binding: 'diskCount', header: '수량', width: 80, keyPath: 'bill.count' },
        { header: ' ', binding: 'deleting', width: 60, customHtml: true, sorting: false }
      ],
      byteToGb: (size) => {
        if (size) return this.$options.filters.byteToGb(size)
        else return 0
      },
      columnDataMap: {
        vmNames: [],
        hostIp: [],
        createTime: []
      },
      searchableColumns: [ // 검색시 사용. 지우지 마세요.
        { binding: 'vmNames', label: this.$t('common.GRID.hostName') }, // 호스트 명
        { binding: 'vgName', label: this.$t('common.GRID.storageName') } // 스토리지 명
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
  .external-disk-wrapper {
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
</style>
