<!--
  * 파일명 : SetHost.vue
  * 파일 기능 : VMware > 구성관리 > 물리서버(Host)
  * License By Shinsegae I&C
 -->

<template>
  <div class="set-host">
    <div
      v-if="this.$route.name === 'set-host-vmw'"
      class="filter-area"
    >
      <filtering-component
        @reset-data="e => {
          selectedVcenter = null
          searchHostName = ''
          searchClusterName = ''
          searchFilter()
        }"
      >
        <div class="filter-form">
          <span class="filter-name">{{ $v('클러스터') }}</span>
          <div class="filter-options">
            <el-input
              v-model="searchClusterName"
              :placeholder="$t('config.POOL.enterCluster')"
              @input="searchFilter()"
            />
          </div>
        </div>
        <article class="filter-form">
          <h4 class="filter-name">
            {{ $v('호스트') }}
          </h4>
          <div class="filter-options">
            <el-input
              v-model="searchHostName"
              :placeholder="$t('config.POOL.enterHost')"
              @input="searchFilter()"
            />
          </div>
        </article>
      </filtering-component>
    </div>

    <cmp-grid
      v-loading="isGetHostRequest"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
      :loading="isGetHostRequest"
      :init-custom-action="initGrid"
      :item-source="tableData"
      :columns="columns"
      :column-data-map="columnDataMap"
      :header-merge="headerMergeColumns"
      :use-excel-download="hostUuid === null"
      @selectedRow="goToVmList"
      selectable
      @total-count="count => gridTotal = count"
    >
      <template #vmCnt="props">
        {{ props.row.vmCnt }} 개
      </template>
      <!-- <template #cpuUsagePct="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.cpuUsagePct"
            :total="100"
            :notice-percent="props.row.userConnectDetailInfo.firstCpuPercent"
            :alert-percent="props.row.userConnectDetailInfo.secondCpuPercent"
          />
          <el-tooltip
            v-if="props.row.virtualPerCalcText.length > 10"
            :content="props.row.virtualPerCalcText"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ props.row.virtualPerCalcText }}
            </span>
          </el-tooltip>
          <p
            class="progress-desc"
            v-else
          >
            {{ props.row.virtualPerCalcText }}
          </p>
        </div>
      </template>

      <template #memUsagePct="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.memUsagePct"
            :total="100"
            :notice-percent="props.row.userConnectDetailInfo.firstMemoryPercent"
            :alert-percent="props.row.userConnectDetailInfo.secondMemoryPercent"
          />
          <el-tooltip
            v-if="props.row.hypervisorMemoryUsagePpmText.length > 10"
            :content="props.row.hypervisorMemoryUsagePpmText"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ props.row.hypervisorMemoryUsagePpmText }}
            </span>
          </el-tooltip>
          <p
            class="progress-desc"
            v-else
          >
            {{ props.row.hypervisorMemoryUsagePpmText }}
          </p>
        </div>
      </template>
      <template #diskUsagePct="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.diskUsagePct"
            :total="100"
            :notice-percent="props.row.userConnectDetailInfo.firstDiskPercent"
            :alert-percent="props.row.userConnectDetailInfo.secondDiskPercent"
          />
          <el-tooltip
            v-if="props.row.hypervisorDiskUsagePpmText.length > 10"
            :content="props.row.hypervisorDiskUsagePpmText"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ props.row.hypervisorDiskUsagePpmText }}
            </span>
          </el-tooltip>
          <p
            class="progress-desc"
            v-else
          >
            {{ props.row.hypervisorDiskUsagePpmText }}
          </p>
        </div>
      </template>-->

      <template #hypervisorCpuUsagePpmValue="props">
        <progress-bar
          :total="100"
          :value="props.row.hypervisorCpuUsagePpmValue"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <template #hypervisorMemoryUsagePpmValue="props">
        <progress-bar
          :total="100"
          :value="props.row.hypervisorMemoryUsagePpmValue"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <template #storageUsageBytes="props">
        <progress-bar
          :total="100"
          :value="props.row.storageUsageBytes"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <!-- 메모리 사용률 -->
      <template #hypervisorMemoryUsage="props">
        {{ props.row.hypervisorMemoryUsage | byte }}
      </template>
      <!-- 총 메모리 -->
      <template #storageUsage="props">
        {{ props.row.storageUsage | byte }}
      </template>
      <!-- 디스크 사용량 -->
      <template #storageTotal="props">
        {{ props.row.storageTotal | byte }}
      </template>
      <!-- 디스크 총 용량 -->
    </cmp-grid>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'
// import newAPI from '@/components/Apis/newApis/VMware'

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
  watch: {
    hostUuid: {
      immediate: true,
      handler (newval) {
        // VMware 임시 페이지 API 연동 제거 (22.08.10)
        // this.getHostList(newval)
        this.setEsxiGridList(newval)
      }
    }

    // tableDataOrigin: {
    //   immediate: true,
    //   handler (newval) {
    //     this.searchHost()
    //   }
    // }
  },
  computed: {

  },
  created () {
    this.setEsxiGridList(this.hostUuid)
  },
  methods: {
    initGrid (grid) {
      this.grid = grid
    },
    goToVmList (row) {
      if (!row?._data) return
      const data = row._data

      const { name } = data

      this.$router.push({
        name: 'set-resource-server-list-vmw',
        query: {
          esxiName: name
        }
      })
    },
    async setEsxiGridList (hostUuid) {
      try {
        let result = []
        const uuid = hostUuid || null
        console.log('setEsxiGridList')
        let esxiList = await this.getEsxiData()
        if (esxiList) {
          if (uuid) {
            console.log('uuid가 존재합니다.', hostUuid)
            esxiList = [esxiList.find((el) => el.hostUuid === uuid)] || []
          }
          result = esxiList.map(el => {
            // TODO 해야할일
            let sumCap = 0 // 커패시터의 합
            let sumFs = 0// 프리스페이스의 합
            if (el.datastoreList) {
              el.datastoreList.forEach((ds) => {
                const { capacity, freeSpace } = ds
                sumCap += capacity
                sumFs += freeSpace
              })
            }

            const customData = {
              hypervisor: 'VMware ESXi' + el.version + el.build,
              vcenterName: el.vcenter.name,
              storageUsageBytes: (sumCap - sumFs) / sumCap * 100,
              hypervisorCpuUsagePpmValue: el.overallCpuUsage / (el.cpuCores * el.cpuMhz) * 100,
              hypervisorMemoryUsagePpmValue: (el.overallMemoryUsage * 1024 * 1024) / el.memorySize * 100,
              hypervisorMemoryUsage: el.memorySize,
              storageUsage: sumCap - sumFs,
              storageTotal: sumCap

              // virtualPerCalcText: `${el.vmCpuSum} Core /  ${Number(el.cpuCores).toFixed(0)} Core`,
              // hypervisorMemoryUsagePpmText: `${(el.vmMemSum / 1024).toFixed(2)} GB / ${(el.memorySize / (1024 * 1024 * 1024)).toFixed(2)} GB`,
              // hypervisorDiskUsagePpmText: `${(el.vdiskUsageSum / (1024 * 1024 * 1024)).toFixed(2)} GB/ ${(el.vdiskCapacitySum / (1024 * 1024 * 1024)).toFixed(2)} GB`
            }

            return { ...el, ...customData }
          })
          this.columnDataMap.hypervisorMemoryUsage = GridUtils.setColumnDataMap('hypervisorMemoryUsage', this.tableData, 'byte')
          this.columnDataMap.storageUsage = GridUtils.setColumnDataMap('storageUsage', this.tableData, 'byte')
          this.columnDataMap.storageTotal = GridUtils.setColumnDataMap('storageTotal', this.tableData, 'byte')
          this.tableDataOrigin = result
          this.tableData = result
          if (this.tableData) {
            this.searchFilter()
          }
        } else this.tableData = []
      } catch (err) {
        console.log(err)
      } finally {
        this.isGetHostRequest = false
      }
    },
    /**
       * 두 개의 유닛데이터가 같지 않은경우 단위 동일하게 처리
       * ex. 둘중 하나라도 1TB 가 안된다면 0.nTB 로 표시되도록 해야함
       */
    compareUnit (usingData, totalData) {
      // GB, TB, PB... 계산 및 unit 설정
      const byte = (data) => { return this.$options.filters.byte(data).split(' ') }

      const using = byte(usingData)
      const total = byte(totalData)
      const sizes = ['MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      const usingUnitIdx = sizes.indexOf(using[1])
      const totalUnitIdx = sizes.indexOf(total[1])
      let result // 형식을 유지해야해요

      if (usingUnitIdx !== totalUnitIdx) {
        const setData = (item1, item2) => Number(item1[0] / 1024).toFixed(2)

        result = usingUnitIdx > totalUnitIdx
          ? ({ using: using[0], total: setData(total), unit: using[1] })
          : ({ using: setData(using), total: total[0], unit: total[1] })
      } else {
        result = { using: using[0], total: total[0], unit: total[1] }
      }

      return result
    },
    // SECTION: 리팩토릭 및 VMware작업
    /** API_HANDLER (GET)호스트 조회 hostUuid */
    async getEsxiData (hostUuid) {
      try {
        this.isGetHostRequest = true
        console.log('getEsxiData')
        const esxiList = API.vmware.host.getVmwareHostList()
        return esxiList
      } catch (err) {
        this.$alert(this.$v('호스트 리스트를 조회하지 못하였습니다.'))
      }
    },
    // !SECTION

    /**
     * 필터링 적용시 발생 이벤트
     */
    searchFilter (clusterName = this.searchClusterName, hostName = this.searchHostName) {
      let result = [...this.tableDataOrigin]
      if (clusterName) result = result.filter(host => host.cluster.name?.trim()?.toLowerCase().includes(clusterName?.trim()?.toLowerCase()))
      // if (hostName) result = result.filter(host => host.name?.trim()?.toLowerCase().includes(hostName?.trim()?.toLowerCase()))
      this.tableData = result
    }
  },
  data () {
    return {
      searchHostName: '', // 검색할 호스트명
      searchClusterName: '',
      gridTotal: null, // 그리드 전체 카운트
      isGetHostRequest: false,
      headerMergeColumns: {},
      columns: [
        { header: this.$v('ESXi명'), binding: 'name', width: 160 },
        { header: this.$v('연결된 vCenter 명'), binding: 'vcenterName', width: 300 },
        { header: this.$v('하이퍼바이저'), binding: 'hypervisor', width: 240, customHtml: true },
        { header: this.$v('모델'), binding: 'model', width: 120 },
        { header: this.$v('프로세스 유형'), binding: 'cpuModel', width: 300 },
        { header: this.$v('논리 프로세서'), binding: 'cpuCores', width: 140 },
        { header: this.$v('연결 상태'), binding: 'connectionState', width: 100, customHtml: true },
        // 임계치
        // { header: '가상화율 임계치(%)', binding: 'cpuUsagePct', customHtml: true, width: 300, keyPath: 'common.GRID.NUTA.virtualRateThrP' },
        // { header: '메모리 임계치(%)', binding: 'memUsagePct', customHtml: true, width: 300, keyPath: 'common.GRID.NUTA.memThrP' },
        // { header: '디스크 임계치(%)', binding: 'diskUsagePct', customHtml: true, width: 300, keyPath: 'common.GRID.NUTA.diskThrP' },
        // 사용량
        { header: this.$v('CPU 사용률(%)'), binding: 'hypervisorCpuUsagePpmValue', customHtml: true, width: 120 },
        { header: this.$v('메모리 사용률(%)'), binding: 'hypervisorMemoryUsagePpmValue', customHtml: true, width: 120 },
        { header: this.$v('스토리지 사용률(%)'), binding: 'storageUsageBytes', customHtml: true, width: 120 },
        { header: this.$v('총 메모리량'), binding: 'hypervisorMemoryUsage', customHtml: true, width: 100 },
        { header: this.$v('스토리지 사용량'), binding: 'storageUsage', customHtml: true, width: 100 },
        { header: this.$v('스토리지 총 용량'), binding: 'storageTotal', customHtml: true, width: 100 },
        { header: this.$v('구동중인 VM'), binding: 'vmCnt', width: 120, customHtml: true }

      ],
      columnDataMap: {
        hypervisorMemoryUsage: null,
        storageUsage: null,
        storageTotal: null
      },
      tableData: [],
      tableDataOrigin: [],
      clusters: [],
      selectedVcenter: null

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
