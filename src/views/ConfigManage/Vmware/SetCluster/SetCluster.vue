<template>
  <div class="config-vmw-cluster">
    <filtering-component
      @reset-data="() => {
        searchClusterName = ''
        searchCluster()
      }"
    >
      <div class="filter-form">
        <span class="filter-name">{{ $t('common.PLACEHOLDER.search') }}</span>
        <div class="filter-options">
          <el-input
            v-model="searchClusterName"
            :placeholder="$t('config.POOL.enterCluster')"
            @input="searchCluster()"
          />
        </div>
      </div>
    </filtering-component>
    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
    </section>
    <section class="table-area">
      <cmp-grid
        v-loading="isLoadingGrid"
        :item-source="gridData"
        :columns="columns"
        @total-count="count => totalResultCnt = count"
        :use-excel-download="true"
        selectable
        @selectedRow="onSelectedRow"
      >
        <template #virtualPercent="props">
          {{ props.row.cpuManageIndicator }}%
        </template>
        <template #hostCpuSum="props">
          {{ props.row.hostCpuSum }} Core
        </template>
        <template #vmCnt="props">
          {{ props.row.vmCnt }} {{ $v('개') }}
        </template>
        <template #vcpuUsage="props">
          <progress-bar
            :total="100"
            :value="props.row.vcpuUsage"
          />
        </template>
        <template #cpuUsagePct="props">
          <set-cluster-progress-bar
            :value="props.row.cpuUsagePct"
            :thres-value1="40"
            :thres-value2="60"
            :text="props.row.virtualPerCalcText"
          />
        </template>
        <template #memUsagePct="props">
          <set-cluster-progress-bar
            :value="props.row.memUsagePct"
            :thres-value1="40"
            :thres-value2="60"
            :text="props.row.hypervisorMemoryUsagePpmText"
          />
        </template>
        <template #diskUsagePct="props">
          <set-cluster-progress-bar
            :value="props.row.diskUsagePct"
            :thres-value1="40"
            :thres-value2="60"
            :text="props.row.hypervisorDiskUsagePpmText"
          />
        </template>
      </cmp-grid>
    </section>
  </div>
</template>

<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import SetClusterProgressBar from './SetClusterProgressBar.vue'
import { cloneDeep } from 'lodash'
export default {
  components: { SetClusterProgressBar, FilteringComponent },

  async created () {
    const res = await this.getVmwCluster()
    if (res) { this.setGridData(res) }
  },
  methods: {
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
    onSelectedRow (selectRow) {
      const rowData = selectRow._data
      this.$router.push({ name: 'set-host-vmw', params: { clusterName: rowData.name } })
    },
    /**
     * 필터링 적용시 발생 이벤트
     */
    searchCluster (clusterName = this.searchClusterName) {
      let result = [...this.gridDataOrigin]
      console.log(result)
      if (clusterName) result = result.filter(cluster => cluster.name?.trim()?.toLowerCase().includes(clusterName?.trim()?.toLowerCase()))
      this.gridData = result
    },
    setGridData (list) {
      // 툴팁 텍스트와 프로그래스바 우측 지표 텍스트를 생성
      function setVmToolTip (vm, total, unit) {
        console.log(vm, total)
        if (unit === 'GB') { return `${(vm / 1024).toFixed(2)} ${unit} / ${(total / (1024 ** 3)).toFixed(2)} ${unit}` } // vmMemSum(MB), hostMemSum(byte) -> gb로
        if (unit === 'TB') { return `${(vm / 1024 ** 4).toFixed(2)} ${unit} / ${(total / (1024 ** 4)).toFixed(2)} ${unit}` } // vmDiskCapacitySum,hostStorageCapacitySum(byte) -> tb로
        return `${vm} ${unit} /  ${Number(total).toFixed(0)} ${unit}`
      }

      this.gridDataOrigin = list
        .map((el) => {
          return {
            ...el,
            virtualPerCalcText: setVmToolTip(el.vmCpuSum, el.hostCpuSum, 'Core'),
            hypervisorMemoryUsagePpmText: setVmToolTip(el.vmMemSum, el.hostMemSum, 'GB'),
            hypervisorDiskUsagePpmText: setVmToolTip(el.vmDiskCapacitySum, el.hostStorageCapacitySum, 'TB')
          }
        })
      this.gridData = cloneDeep(this.gridDataOrigin)
    }

  },
  data () {
    return {
      // MOCK_GRID: [{ cpuUsagePct: 50, memUsagePct: 50, diskUsagePct: 50, vcpuUsage: 50, name: 'MOCK', virtualPercent: 50, hostCpuSum: 50, vmCnt: 50 }],
      gridData: [],
      gridDataOrigin: [],
      columns: [
        { header: this.$v('클러스터 명'), binding: 'name', customHtml: true, width: '*' },
        { header: this.$v('가상화율 임계치(%)'), binding: 'cpuUsagePct', customHtml: true, width: 300, keyPath: 'common.GRID.NUTA.virtualRateThrP' },
        { header: this.$v('메모리 임계치(%)'), binding: 'memUsagePct', customHtml: true, width: 300, keyPath: 'common.GRID.NUTA.memThrP' },
        { header: this.$v('디스크 임계치(%)'), binding: 'diskUsagePct', customHtml: true, width: 300, keyPath: 'common.GRID.NUTA.diskThrP' },
        { header: this.$v('vCPU 사용률'), binding: 'vcpuUsage', customHtml: true, width: 120 },
        { header: this.$v('가상화율'), binding: 'virtualPercent', customHtml: true, width: 120 },
        { header: this.$v('CPU Core 수'), binding: 'hostCpuSum', customHtml: true, width: 120 },
        { header: this.$v('구동중인 VM'), binding: 'vmCnt', customHtml: true, width: 120 }
      ],
      isLoadingGrid: false,
      searchClusterName: '',
      totalResultCnt: 0
    }
  }
}
</script>

<style>

</style>
