<!--
  * 파일명 : SetHost.vue
  * 파일 기능 : 구성관리 > 물리서버(Host) 리스트 확인 기능, 필터링(클러스터 / HA노드 유무 / 호스트 명) 기능
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-05
  * License By Shinsegae I&C
  * 2021-02-05 구성관리  > 클러스터 / 호스트 > 데이터 매핑
 -->

<template>
  <div class="set-host">
    <div
      v-if="this.$route.name === 'set-host'"
      class="filter-area"
    >
      <filtering-component
        @reset-data="e => {
          selectedClu = null
          checkedHa = null
          searchHostName = ''
          searchHost()
        }"
      >
        <article class="filter-form">
          <h4 class="filter-name">
            {{ $t('main.DASHBOARD.cluster') }}
          </h4>
          <div class="filter-options">
            <el-select
              v-model="selectedClu"
              :placeholder="$t('common.BTN.select')"
              @change="searchHost()"
            >
              <el-option
                v-for="clu in clusters"
                :key="clu.cluId"
                :label="clu.cluName"
                :value="clu.cluId"
              />
            </el-select>
          </div>
        </article>
        <article class="filter-form">
          <h4 class="filter-name">
            {{ $t('common.GRID.CLUSTER.haNode') }}
          </h4>

          <div class="filter-options">
            <!-- <el-checkbox
              v-model="checkedHa"
              @change="searchHost()"
            /> -->
            <el-select
              v-model="checkedHa"
              :placeholder="$t('common.GRID.CLUSTER.haNode')"
              @change="searchHost()"
            >
              <el-option
                v-for="ha in haOptions"
                :key="ha.value"
                :label="ha.label"
                :value="ha.value"
              />
            </el-select>
          </div>
        </article>
        <article class="filter-form">
          <h4 class="filter-name">
            {{ $t('common.PLACEHOLDER.search') }}
          </h4>
          <div class="filter-options">
            <el-input
              v-model="searchHostName"
              :placeholder="$t('config.POOL.enterHost')"
              @input="searchHost()"
            />
          </div>
        </article>
      </filtering-component>

      <!-- <wj-flex-grid-search
        id="theDetailSearch"
        :placeholder="$t('config.POOL.enterHost')"
        ref="theSearch"
      /> -->
    </div>

    <div class="flex-wrap -space-between">
      <total-count
        class="total-count-wrap"
        :total-count="gridTotal"
      />
      <span class="sync-time">{{ $t('main.DASHBOARD.ntxNodeHAAlert') }}</span>
      <!-- 전체 값에는 HA 노드가 포함되어 계산되지 않습니다 -->
    </div>

    <cmp-grid
      v-loading="isGetHostRequest"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
      :loading="isGetHostRequest"
      :item-source="tableData"
      :columns="columns"
      :header-merge="headerMergeColumns"
      :use-excel-download="hostUuid === null"
      :column-data-map="columnDataMap"
      @total-count="count => gridTotal = count"
      @selectedRow="goToVmList"
      selectable
    >
      <template #hypervisorCpuUsagePpmValue="props">
        <progress-bar
          :total="1000000"
          :value="props.row.hypervisorCpuUsagePpm"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <!-- CPU 사용량 -->
      <template #hypervisorMemoryUsagePpmValue="props">
        <progress-bar
          :total="1000000"
          :value="props.row.hypervisorMemoryUsagePpm"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <!-- 메모리 사용량 -->
      <template #memoryCapacityInBytes="props">
        {{ props.row.memoryCapacityInBytes | byte }}
      </template>
      <!-- 총 메모리 -->
      <template #storageUsageBytes="props">
        {{ props.row.storageUsageBytes | byte }}
      </template>
      <!-- 디스크 사용량 -->
      <template #storageCapacityBytes="props">
        {{ props.row.storageCapacityBytes | byte }}
      </template>
      <!-- 디스크 총 용량 -->
      <template #haReserved="props">
        <el-checkbox
          v-model="props.row.haReserved"
          :disabled="true"
        />
      </template>
      <!-- HA노드 -->
    </cmp-grid>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'

export default {
  name: 'SetHost',
  components: {
    FilteringComponent
  },
  props: {
    hostUuid: {
      type: String,
      default: null
    }
  },
  async created () {
    await this.getClusterList()
  },
  watch: {
    hostUuid: {
      immediate: true,
      handler (newval) {
        this.getHostList(newval)
      }
    },
    tableDataOrigin: {
      immediate: true,
      handler (newval) {
        this.searchHost()
      }
    }
  },
  methods: {
    /**
     * 필터링 적용시 발생 이벤트
     */
    searchHost (cluster = this.selectedClu, haVal = this.checkedHa, hostName = this.searchHostName) {
      // console.warn('cluster: ', cluster, '  HA: ', haVal)
      let result = [...this.tableDataOrigin]
      const isHaVal = typeof haVal === 'boolean'
      if (cluster) result = result.filter(host => host.clusterUuid === cluster)
      if (isHaVal) result = result.filter(host => host.haReserved === haVal)
      if (hostName) result = result.filter(host => host.nodeName?.trim()?.toLowerCase().includes(hostName?.trim()?.toLowerCase()))
      this.tableData = result
    },
    /**
     * 클러스터 조회
     */
    async getClusterList () {
      let clusterData = []
      clusterData = await API.compute.getClusters()
      const data = clusterData.map(cluster => {
        return {
          cluName: cluster.clusterName,
          cluId: cluster.clusterUuid
        }
      })
      this.clusters = [{ cluId: null, cluName: this.$t('main.DASHBOARD.all') }, ...data]
    },
    /**
     * 호스트 조회
     * @param {Number} hostUuid hostUuid (랙실장도에서 사용)
     */
    async getHostList (hostUuid) {
      try {
        this.isGetHostRequest = true
        this.tableData = []
        let data = []
        const response = hostUuid ? await API.compute.getSingleHost(hostUuid) : await API.compute.getHostList()

        if (!response) return

        data = hostUuid ? [response] : [...response]
        // if (hostUuid) {
        //   this.columns = this.rackColumns
        //   data.forEach(hs => {
        //     if (hs.hostUuid === hostUuid) {
        //       this.tableData = [hs]
        //     } else {
        //     }
        //   })
        // } else {
        this.columns = this.hostColumns
        for (let i = 0; i < data.length; i++) {
          // CPU 사용량
          const cpuUsageValue = data[i].hypervisorCpuUsagePpm / 10000
          data[i].hypervisorCpuUsagePpmValue = Number(cpuUsageValue.toFixed(2))
          // 메모리 사용량
          const memUsageValue = data[i].hypervisorMemoryUsagePpm / 10000
          data[i].hypervisorMemoryUsagePpmValue = Number(memUsageValue.toFixed(2))

          // if (findIndex(this.clusters, ['cluName', data[i].clusterName]) < 0) {
          //   this.clusters.push({
          //     cluName: data[i].clusterName,
          //     cluId: data[i].clusterUuid
          //   })
          // }
        }
        // console.log('clusters', this.clusters)

        this.tableDataOrigin = data
        // this.tableData = data

        if (this.$route.params?._data?.clusterUuid) {
          const rowData = this.$route.params?._data
          this.selectedClu = rowData.clusterUuid
          this.searchHost(rowData.clusterUuid, '')
        }
        // }

        this.columnDataMap.memoryCapacityInBytes = GridUtils.setColumnDataMap('memoryCapacityInBytes', this.tableData, 'byte')
        this.columnDataMap.storageUsageBytes = GridUtils.setColumnDataMap('storageUsageBytes', this.tableData, 'byte')
        this.columnDataMap.storageCapacityBytes = GridUtils.setColumnDataMap('storageCapacityBytes', this.tableData, 'byte')

        // this.clusters.unshift({ cluId: null, cluName: this.$t('main.DASHBOARD.all') })
        // this.selectedClu = null
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.tableData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        return false
      } finally {
        this.isGetHostRequest = false
      }
    },
    /**
 * 구성관리 > Compute 목록으로 이동합니다.
 */
    goToVmList (row) {
      if (!row?._data) return
      const data = row._data
      const { clusterUuid, hostUuid } = data

      this.$router.push({
        name: 'set-resource-server-list',
        query: {
          clusterUuid, hostUuid
        }
      })

      // const clusterUuid =
    }
  },
  data () {
    return {
      searchHostName: '', // 검색할 호스트명
      gridTotal: null, // 그리드 전체 카운트
      isGetHostRequest: false,
      headerMergeColumns: {},
      columns: [
        { header: '호스트 명', binding: 'nodeName', width: '*', keyPath: 'common.GRID.hostName' },
        { header: '클러스터 명', binding: 'clusterName', width: '*', keyPath: 'common.GRID.NUTA.clusterName' },
        { header: 'Rack No.', binding: 'rackNum', width: 80 },
        { header: 'Host No.', binding: 'hostNum', width: 80 },
        { header: 'Controller VM IP', binding: 'serviceVmExternalIp', width: '*' },
        { header: 'Block Serial', binding: 'blockSerial', width: '*' },
        { header: 'Block Model', binding: 'blockModelName', width: '*' },
        { header: 'Node Serial', binding: 'serial', width: '*' },
        { header: 'CPU Core 수', binding: 'numCpuCores', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.coreCpu' },
        { header: 'CPU 사용량(%)', binding: 'hypervisorCpuUsagePpmValue', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageCpu' },
        // { header: '총 메모리 ', binding: 'memoryCapacityInBytesSum', customHtml: true, width: '*' },
        { header: '메모리 사용량(%)', binding: 'hypervisorMemoryUsagePpmValue', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageMemory' },
        { header: '총 메모리', binding: 'memoryCapacityInBytes', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.totalMemory' },
        { header: '디스크 사용량', binding: 'storageUsageBytes', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageDisk' },
        { header: '디스크 총 용량', binding: 'storageCapacityBytes', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.sizeDisk' },
        { header: '등록 된 VM (개)', binding: 'numVms', width: '*', keyPath: 'common.GRID.CLUSTER.regVms' },
        { header: 'HA 노드', binding: 'haReserved', width: '*', keyPath: 'common.GRID.CLUSTER.haNode' }
      ],
      rackColumns: [
        { header: '호스트 명', binding: 'nodeName', width: '*', keyPath: 'common.GRID.hostName' },
        { header: '클러스터 명', binding: 'clusterName', width: '*', keyPath: 'common.GRID.NUTA.clusterName' },
        // { header: 'Rack No.', binding: 'rackNum', width: 80 },
        // { header: 'Host No.', binding: 'hostNum', width: 80 },
        { header: 'Controller VM IP', binding: 'serviceVmExternalIp', width: '*' },
        { header: 'Block Serial', binding: 'blockSerial', width: '*' },
        { header: 'Block Model', binding: 'blockModelName', width: '*' },
        { header: 'Node Serial', binding: 'serial', width: '*' },
        { header: 'CPU Core 수', binding: 'numCpuCores', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.coreCpu' },
        { header: 'CPU 사용량(%)', binding: 'hypervisorCpuUsagePpmValue', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageCpu' },
        // { header: '총 메모리 ', binding: 'memoryCapacityInBytesSum', customHtml: true, width: '*' },
        { header: '메모리 사용량(%)', binding: 'hypervisorMemoryUsagePpmValue', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageMemory' },
        { header: '총 메모리', binding: 'memoryCapacityInBytes', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.totalMemory' },
        { header: '디스크 사용량', binding: 'storageUsageBytes', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageDisk' },
        { header: '디스크 총 용량', binding: 'storageCapacityBytes', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.sizeDisk' },
        { header: '등록 된 VM (개)', binding: 'numVms', width: '*', keyPath: 'common.GRID.CLUSTER.regVms' }
      ],
      hostColumns: [
        { header: '호스트 명', binding: 'nodeName', width: '*', keyPath: 'common.GRID.hostName' },
        { header: '클러스터 명', binding: 'clusterName', width: '*', keyPath: 'common.GRID.NUTA.clusterName' },
        { header: 'Controller VM IP', binding: 'serviceVmExternalIp', width: '*' },
        { header: 'Block Serial', binding: 'blockSerial', width: '*' },
        { header: 'Block Model', binding: 'blockModelName', width: '*' },
        { header: 'Node Serial', binding: 'serial', width: '*' },
        { header: 'CPU Core 수', binding: 'numCpuCores', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.coreCpu' },
        { header: 'CPU 사용량(%)', binding: 'hypervisorCpuUsagePpmValue', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageCpu' },
        // { header: '총 메모리 ', binding: 'memoryCapacityInBytesSum', customHtml: true, width: '*' },
        { header: '메모리 사용량(%)', binding: 'hypervisorMemoryUsagePpmValue', customHtml: true, width: '*', keyPath: 'common.GRID.CLUSTER.usageMemory' },
        {
          header: '총 메모리',
          binding: 'memoryCapacityInBytes',
          customHtml: true,
          width: '*',
          keyPath: 'common.GRID.CLUSTER.totalMemory',
          formatter: (args, item, binding) => {
            return this.$options.filters.byte(item[binding])
          }
        },
        {
          header: '디스크 사용량',
          binding: 'storageUsageBytes',
          customHtml: true,
          width: '*',
          keyPath: 'common.GRID.CLUSTER.usageDisk',
          formatter: (args, item, binding) => {
            return this.$options.filters.byte(item[binding])
          }
        },
        {
          header: '디스크 총 용량',
          binding: 'storageCapacityBytes',
          customHtml: true,
          width: '*',
          keyPath: 'common.GRID.CLUSTER.sizeDisk',
          formatter: (args, item, binding) => {
            return this.$options.filters.byte(item[binding])
          }
        },
        { header: '등록 된 VM (개)', binding: 'numVms', width: '*', keyPath: 'common.GRID.CLUSTER.regVms' },
        {
          header: 'HA 노드',
          binding: 'haReserved',
          customHtml: true,
          width: '*',
          keyPath: 'common.GRID.CLUSTER.haNode',
          formatter: (args, item, binding) => {
            return item[binding] ? 'O' : 'X'
          }
        }
      ],
      tableDataOrigin: [],
      tableData: [],
      filteredGridData: [],
      clusters: [],
      selectedClu: null,
      checkedHa: null,
      columnDataMap: {
        memoryCapacityInBytes: null,
        storageUsageBytes: null,
        storageCapacityBytes: null
      },
      haOptions: [
        { label: this.$t('main.DASHBOARD.all'), value: null },
        { label: this.$t('common.TERMS.has'), value: true },
        { label: this.$t('common.TERMS.none'), value: false }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
.filter-area {
  display: flex;
  .search-title {
    font-weight: 300;
    line-height: 15px;
    display: block;
    white-space: nowrap;
    margin-right: 10px;
    align-self: flex-end;
    margin-bottom: 30px;
    position: relative;
    top: -8px;
  }
  #theDetailSearch {
    width: 15%;
    margin-bottom: 30px;
    align-self: flex-end;
  }
}

// 동기화 시간
.sync-time {
  color: #727797;
  font-size: 13px;
  font-weight: normal;
  margin-left: 10px;
  // position: absolute;
  // top: -25px; right: 0
}
</style>
