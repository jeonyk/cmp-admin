<template>
  <div class="config-vmw-cluster">
    <filtering-component
      @reset-data="() => {
        searchDcName = ''
        searchDatacenter()
      }"
    >
      <div class="filter-form">
        <span class="filter-name">{{ $t('common.PLACEHOLDER.search') }}</span>
        <div class="filter-options">
          <el-input
            v-model="searchDcName"
            :placeholder="$t('데이터센터 명 입력')"
            @input="searchDatacenter()"
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
        :loading="isLoadingGrid"
        :item-source="gridData"
        :columns="columns"
        @total-count="count => totalResultCnt = count"
        :use-excel-download="true"
      >
        <template #cpuUsage="props">
          <progress-bar
            :total="100"
            :value="props.row.cpuUsage"
          />
        </template>
        <template #memUsage="props">
          <progress-bar
            :total="100"
            :value="props.row.cpuUsage"
          />
        </template>
        <template #diskUsage="props">
          <progress-bar
            :total="100"
            :value="props.row.cpuUsage"
          />
        </template>
        <template #clusterCnt="props">
          {{ props.row.clusterCnt }} {{ $v('개') }}
        </template>
        <template #vmCnt="props">
          {{ props.row.vmCnt }} {{ $v('개') }}
        </template>
      </cmp-grid>
    </section>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
export default {

  async created () {
    const res = await this.getVmwDatacenter()
    if (res) { this.setGridData(res) }
  },
  methods: {
    async getVmwDatacenter () {
      try {
        this.isLoadingGrid = true
        const res = await API.vmware.datacenter.getVmwDatacenter()
        return res
      } catch (err) {
        console.error(err)
      } finally {
        this.isLoadingGrid = false
      }
    },
    setGridData (list) {
      // this.gridData = list
      this.gridDataOrigin = list
      this.gridData = list
    },
    /**
     * 필터링 적용시 발생 이벤트
     */
    searchDatacenter (datacenterName = this.searchDcName) {
      let result = [...this.gridDataOrigin]
      console.log(result)
      if (datacenterName) result = result.filter(dc => dc.name?.trim()?.toLowerCase().includes(datacenterName?.trim()?.toLowerCase()))
      this.gridData = result
    }
  },
  data () {
    return {
      MOCK_GRID: [{ cpuUsage: 50, memUsage: 50, diskUsage: 50, clusterCnt: 5, name: 'MOCK', vmCnt: 50 }],
      gridDataOrigin: [],
      gridData: [],
      searchDcName: '',
      columns: [
        { header: this.$v('데이터센터 명'), binding: 'name', customHtml: true, width: '*' },
        { header: this.$v('CPU 사용량'), binding: 'cpuUsage', customHtml: true, width: 200 },
        { header: this.$v('메모리 사용량'), binding: 'memUsage', customHtml: true, width: 200 },
        { header: this.$v('디스크 사용량'), binding: 'diskUsage', customHtml: true, width: 200 },
        { header: this.$v('클러스터 수'), binding: 'clusterCnt', customHtml: true, width: 200 },
        { header: this.$v('구동중인 VM'), binding: 'vmCnt', customHtml: true, width: 200 }
      ],
      isLoadingGrid: false,
      totalResultCnt: 0
    }
  }
}
</script>

<style>

</style>
