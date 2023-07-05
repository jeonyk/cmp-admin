<template>
  <div>
    <h2>CLUSTER {{ $v('임계치 설정') }}</h2>
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          type="is-black"
          @click="handleOpenThresSet"
          :disabled="!selectedRow"
        >
          {{ $v('수정') }}
        </button>
        <modal-vmw-cluster-thres-set
          :modal-status="modalStatus"
          :selected-row="selectedRow"
          @close="handleCloseThresSet"
          @beforeUpdated="onBeforeUpdated"
        />
      </div>
    </section>
    <section class="table-area">
      <cmp-grid
        :loading="isLoadingGrid"
        :item-source="gridData"
        :columns="columns"
        :header-merge="headerMergeColumns"
        @total-count="count => totalResultCnt = count"
        :use-excel-download="true"
        @selectedRow="handleSelectRow"
        selectable
      />
    </section>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import ModalVmwClusterThresSet from './ModalVmwClusterThresSet.vue'

export default {
  async created () {
    const res = await this.getVmwCluster()
    // const res = this.MOCK_DATA
    if (res) { this.setGridData(res) }
  },
  components: {
    ModalVmwClusterThresSet
  },
  methods: {
    async onBeforeUpdated () {
      console.log('onBeforeUpdated')
      const res = await this.getVmwCluster()
      // const res = this.MOCK_DATA
      if (res) {
        this.modalStatus.isOpen = false
        this.setGridData(res)
      }
    },
    // EVENT_HANDLER (모달 닫기)
    handleCloseThresSet () {
      this.modalStatus.isOpen = false
    },
    async getVmwCluster () {
      try {
        this.isLoadingGrid = true
        const res = await API.vmware.cluster.getVmwCluster()

        return res
      } catch (err) {
        console.error(err)
      } finally {
        this.isLoadingGrid = false
      }
    },
    setGridData (list) {
      this.gridData = list
    },
    // EVENT_HANDLER (모달 오픈)
    handleOpenThresSet () {
      this.modalStatus.isOpen = true
    },
    // EVENT_HANDLER  (선택) 클러스터 그리드 선택
    handleSelectRow (row) {
      if (row?._data) {
        this.selectedRow = row._data
        console.log(this.selectedRow)
      } else this.selectedRow = null
    }
  },
  data () {
    return {
      isLoadingGrid: false,
      // MOCK_DATA: [
      //   {
      //     name: 'MOCK',
      //     vcenterName: 'MOCK_CENTER',
      //     clusterId: 'a',
      //     connectIdx: 0,
      //     cpuManageIndicator: 10,
      //     memoryManageIndicator: 10,
      //     diskManageIndicator: 10,
      //     firstCpuPercent: 20,
      //     secondCpuPercent: 30,
      //     firstMemoryPercent: 20,
      //     secondMemoryPercent: 30,
      //     firstDiskPercent: 20,
      //     secondDiskPercent: 30
      //   }
      // ],
      gridData: [],
      modalStatus: {
        isOpen: false
      },
      isOpenCluThresSet: false,
      columns: [
        { header: this.$v('클러스터 명'), binding: 'name', customHtml: true, width: '*' },
        { header: this.$v('연결된 vCenter 명'), binding: 'vcenterName', customHtml: true, width: '*' },
        // 가상화율
        { header: `${this.$v('관리 지표')} (%)`, binding: 'cpuManageIndicator', width: 140, customHtml: true },
        { header: `${this.$v('1차 임계치')} (%)`, binding: 'firstCpuPercent', width: 140, customHtml: true },
        { header: `${this.$v('2차 임계치')} (%)`, binding: 'secondCpuPercent', width: 140, customHtml: true },
        // 메모리
        { header: `${this.$v('관리 지표')} (%)`, binding: 'memoryManageIndicator', width: 140, customHtml: true },
        { header: `${this.$v('1차 임계치')} (%)`, binding: 'firstMemoryPercent', width: 140, customHtml: true },
        { header: `${this.$v('2차 임계치')} (%)`, binding: 'secondMemoryPercent', width: 140, customHtml: true },
        // 디스크
        { header: `${this.$v('관리 지표')} (%)`, binding: 'diskManageIndicator', width: 140, customHtml: true },
        { header: `${this.$v('1차 임계치')} (%)`, binding: 'firstDiskPercent', width: 140, customHtml: true },
        { header: `${this.$v('2차 임계치')} (%)`, binding: 'secondDiskPercent', width: 140, customHtml: true }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 2, endIdx: 4, header: '가상화율', keyPath: 'common.GRID.NUTA.virtualRate' },
          { startIdx: 5, endIdx: 7, header: '메모리', keyPath: 'common.GRID.NUTA.memory' },
          { startIdx: 8, endIdx: 10, header: '디스크', keyPath: 'common.GRID.NUTA.disk' }
        ],
        rowSpan: ['name', 'vcenterName']
      },
      selectedRow: null,
      totalResultCnt: 0
    }
  }
}
</script>

<style>

</style>
