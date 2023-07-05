<!--
  * 파일명 : SetCluster.vue
  * 파일 기능 : 구성관리 > 자원풀그룹(Cluster) 리스트 확인 기능, 필터링(클러스터 명) 기능
  * 작성자 : 김예담 외 4명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 임계치 프로그레스 너비 일정하게 조정, 툴팁 추가
 -->

<template>
  <div class="set-cluster">
    <filtering-component
      v-if="this.$route.name === 'set-cluster'"
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
          <!-- <wj-flex-grid-search
            id="theDetailSearch"
            :placeholder="$t('config.POOL.enterCluster')"
            ref="theSearch"
          /> -->
        </div>
      </div>
    </filtering-component>
    <total-count
      class="total-count-wrap"
      :total-count="totalResultCnt"
    >
      <button
        class="button"
        type="is-primary"
        @click="$router.push({ name: 'set-cluster-simulation' })"
      >
        가용량 시뮬레이션
      </button>
    </total-count>
    <cmp-grid
      v-loading="isGetClusterRequest"
      :element-loading-text="$t('common.PLACEHOLDER.loadingWait')"
      :loading="isGetClusterRequest"
      :item-source="tableData"
      :columns="columns"
      :header-merge="headerMergeColumns"
      @selectedRow="selectRow"
      :selectable="true"
      :use-excel-download="elementIdx === null"
      :column-data-map="columnDataMap"
      @total-count="cnt => totalResultCnt = cnt"
    >
      <!-- <template
        v-for="column in columns"
        :slot="column.binding"
        slot-scope="props"
      >
        <div
          :key="column.binding"
        >
          <span>{{ props.row[column.binding] }}</span>
        </div>
      </template> -->
      <template #rackNo="props">
        <span>{{ Number(props.row.rackNo) }}</span>
      </template>
      <template #cpuManageIndicator="props">
        <span>{{ props.row.cpuManageIndicator }} %</span>
      </template>
      <!-- 가상화율 -->
      <template #hypervisorCpuUsagePpmValue="props">
        <progress-bar
          :total="1000000"
          :value.sync="props.row.hypervisorCpuUsagePpm"
          :notice-percent="60"
          :alert-percent="80"
        />
      </template>
      <!-- vcpu 사용량 -->

      <template #virtualPerCalcValue="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.virtualPerCalc.usageVcpu"
            :total="props.row.virtualPerCalc.allVcpu"
            :notice-percent="props.row.firstCpuPercent"
            :alert-percent="props.row.secondCpuPercent"
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
      <!-- 가상화율 임계치 -->

      <!-- 21.01.26 임시 하드코딩 주석 처리
        <template #hypervisorMemoryUsagePpmValue="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.memoryUsage"
            :total="props.row.nodeMemoryCapacityInBytesSum"
            :alert-percent="props.row.memoryPercent"
          />
          <p class="progress-desc">
            {{ props.row.memoryUsage ||0 | byte }} / {{ props.row.nodeMemoryCapacityInBytesSum ||0| byte }}
          </p>
        </div>
      </template> -->
      <template #hypervisorMemoryUsagePpmValue="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.tempMem.memoryUsage"
            :total="props.row.tempMem.allMem"
            :notice-percent="props.row.firstMemoryPercent"
            :alert-percent="props.row.secondMemoryPercent"
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
        <!-- {{ props.row.hypervisorMemoryUsagePpm | stringToPercent }} -->
      </template>
      <!-- 메모리 임계치 -->

      <!-- 21.01.26 임시 하드코딩 주석 처리
        <template #hypervisorDiskUsagePpmValue="props">
        <div class="progressbar-wrap">
          <progress-bar
            :value="props.row.storageUsageBytes"
            :total="props.row.storageCapacityBytes"
            :alert-percent="props.row.diskPercent"
          />
          <p class="progress-desc">
            {{ props.row.storageUsageBytes | byte }} /  {{ props.row.storageCapacityBytes | byte }}
          </p>
        </div>
      </template> -->
      <template #hypervisorDiskUsagePpmValue="props">
        <div class="progressbar-wrap">
          <progress-bar
            :custom-percentage="props.row.diskCapacityPct"
            :notice-percent="props.row.firstDiskPercent"
            :alert-percent="props.row.secondDiskPercent"
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
        <!-- {{ props.row.hypervisorMemoryUsagePpm | stringToPercent }} -->
      </template>
      <!-- 디스크 임계치 -->

      <template #nodeMemoryCapacityInBytesSum="props">
        {{ props.row.nodeMemoryCapacityInBytesSum | byte }}
      </template>
      <template #storageUsageBytes="props">
        {{ props.row.storageUsageBytes | byte }}
      </template>
      <template #storageCapacityBytes="props">
        {{ props.row.storageCapacityBytes | byte }}
      </template>
      <!-- <template #vmCnt="props">
        <button-popup
          :popup-data="[]"
        >
          <template #popupItem="vms">
            {{ vms.item.jobName }}
          </template>
          {{ props.row.vmCnt }}EA
        </button-popup>
      </template> -->
      <template #powerState="props">
        <div style="text-align: center">
          <span
            v-if="props.row.isManage && props.row.isConnected"
            class="state-icon success"
          />
          <span
            v-else-if="props.row.isManage && !props.row.isConnected"
            class="state-icon error"
          />
          <span
            v-else
            class="state-icon"
          />
        </div>
      </template>

      <template #vmCnt="props">
        {{ $t('common.TERMS.count', {n: props.row.vmCnt}) }}
      </template>
      <template #haveNodes="props">
        <el-checkbox
          v-model="props.row.haveNodes"
          :disabled="true"
        />
      </template>
      <!-- HA노드 -->
    </cmp-grid>
  </div>
</template>
<script>
import API, { FilteringComponent } from '@sd-fe/cmp-core'

export default {
  name: 'SetCluster',
  components: {
    'filtering-component': FilteringComponent
  },
  props: {
    elementIdx: {
      type: Number,
      default: null
    }
  },
  watch: {
    elementIdx: {
      immediate: true,
      handler (newVal) {
        this.getClusterList(newVal)
      }
    },
    tableDataOrigin: {
      immediate: true,
      handler (newval) {
        this.searchCluster()
      }
    }
  },
  async mounted () {
    // this.getClusterList()
  },
  methods: {
    selectRow (param) {
      console.log(param)
      this.$router.push({
        name: 'set-host',
        params: param
      })
    },
    async getClusterList (elementIdx) {
      try {
        this.isGetClusterRequest = true
        this.tableDataOrigin = []
        let data = []
        data = await API.compute.getClusters()
        // console.log('@@@', data)
        for (let i = 0; i < data.length; i++) {
          if (data[i].rackNo) data[i].rackNoNumber = Number(data[i].rackNo)
          if (!isNaN(data[i].storageUsageBytes)) {
            data[i].storageUsageBytes = Number(data[i].storageUsageBytes)
          }
          if (!isNaN(data[i].hypervisorMemoryUsagePpm)) {
            data[i].hypervisorMemoryUsagePpm = Number(data[i].hypervisorMemoryUsagePpm)
          }
          if (!isNaN(data[i].nodeCpuCoresSum)) {
            data[i].nodeCpuCoresSum = Number(data[i].nodeCpuCoresSum)
          }
          if (!isNaN(data[i].nodeMemoryCapacityInBytesSum)) {
            data[i].nodeMemoryCapacityInBytesSum = Number(data[i].nodeMemoryCapacityInBytesSum)
            data[i].memoryUsage = data[i].nodeMemoryCapacityInBytesSum * data[i].hypervisorMemoryUsagePpm / 1000000
          }
          if (!isNaN(data[i].hypervisorCpuUsagePpm)) {
            data[i].hypervisorCpuUsagePpm = Number(data[i].hypervisorCpuUsagePpm)
          }
          if (!isNaN(data[i].storageCapacityBytes)) {
            data[i].storageCapacityBytes = Number(data[i].storageCapacityBytes)
          }

          if (!isNaN(data[i].vmCnt)) {
            data[i].vmCnt = Number(data[i].vmCnt)
          }

          // CPU 사용량
          const cpuUsageValue = data[i].hypervisorCpuUsagePpm / 10000
          data[i].hypervisorCpuUsagePpmValue = cpuUsageValue.toFixed(2)

          // 가상화율 임계치 계산
          // 총 VCPU : 코어수 * 가상화율 / 100 - 기본적으로 사용되는 vcpu 갯수

          data[i].nodeCpuCoresSum = !isNaN(data[i].nodeCpuCoresSum) ? data[i].nodeCpuCoresSum : 0
          data[i].cpuManageIndicator = !isNaN(data[i].cpuManageIndicator) ? data[i].cpuManageIndicator : 0
          data[i].controllerVmVcpuSum = !isNaN(data[i].controllerVmVcpuSum) ? data[i].controllerVmVcpuSum : 0
          data[i].vmVcpuSum = !isNaN(data[i].vmVcpuSum) ? data[i].vmVcpuSum : 0
          // if (
          //   !isNaN(data[i].nodeCpuCoresSum) &&
          //   !isNaN(data[i].cpuManageIndicator) &&
          //   !isNaN(data[i].controllerVmVcpuSum) &&
          //   !isNaN(data[i].vmVcpuSum)
          // ) {
          // 21.01.26 임시 하드코딩 주석 처리 .start.//////////////
          // const virtualPerCalc = {
          //   allVcpu: (data[i].nodeCpuCoresSum * data[i].cpuManageIndicator / 100) - data[i].controllerVmVcpuSum,
          //   usageVcpu: data[i].vmVcpuSum
          // }
          // // virtualPerCalc.allVcpu = !isNaN(virtualPerCalc.allVcpu) ? virtualPerCalc.allVcpu : 0
          // data[i].virtualPerCalc = virtualPerCalc
          // data[i].virtualPerCalcValue = Number((data[i].virtualPerCalc.usageVcpu * 100 / data[i].virtualPerCalc.allVcpu).toFixed(2))
          // // }

          // // 메모리 임계치
          // data[i].hypervisorMemoryUsagePpmValue = Number((data[i].memoryUsage * 100 / data[i].nodeMemoryCapacityInBytesSum).toFixed(2))

          // // 디스크 임계치
          // data[i].hypervisorDiskUsagePpmValue = Number((data[i].storageUsageBytes * 100 / data[i].storageCapacityBytes).toFixed(2))
          // 21.01.26 임시 하드코딩 주석 처리 .end.///////////////

          // // 21.01.26 임시 하드코딩처리 .start.//////////
          // const mapData = find(this.mapData, item => {
          //   return item.clusterName.toLowerCase() === data[i].clusterName.toLowerCase()
          // })
          // console.log('@hardCoding', mapData, data[i].clusterName)
          // // 가상화율 임계치
          // const virtualPerCalc = {
          //   allVcpu: mapData ? mapData.totalCore : 0
          // }
          // Object.assign(virtualPerCalc, { usageVcpu: mapData ? (mapData.cpu * virtualPerCalc.allVcpu) / 100 : 0 })
          // data[i].virtualPerCalc = virtualPerCalc
          // data[i].virtualPerCalcValue = Number((data[i].virtualPerCalc.usageVcpu * 100 / data[i].virtualPerCalc.allVcpu).toFixed(2))

          // // 메모리 임계치
          // const tempMem = {
          //   allMem: mapData ? mapData.totalMem * 1000000000 : 0
          // }
          // Object.assign(tempMem, { memoryUsage: mapData ? (mapData.memory * tempMem.allMem) / 100 : 0 })
          // data[i].tempMem = tempMem
          // data[i].hypervisorMemoryUsagePpmValue = Number((data[i].memoryUsage * 100 / data[i].nodeMemoryCapacityInBytesSum).toFixed(2))

          // // 디스크 임계치
          // const tempDisk = {
          //   allDisk: mapData ? mapData.totalDisk : 0
          // }
          // Object.assign(tempDisk, { storageUsageBytes: mapData ? (mapData.disk * tempDisk.allDisk) / 100 : 0 })
          // data[i].tempDisk = tempDisk
          // data[i].hypervisorDiskUsagePpmValue = Number((data[i].storageUsageBytes * 100 / data[i].storageCapacityBytes).toFixed(2))
          // // 21.01.26 임시 하드코딩처리 .end.//////////

          // 21.02.05 임시 2차 하드코딩처리 .start.//////////
          // 가상화율 임계치
          const virtualPerCalc = {
            allVcpu: data[i].nonNodeCpuSum || 0,
            usageVcpu: data[i].vmCpuSum || 0
          }
          data[i].virtualPerCalc = virtualPerCalc
          data[i].virtualPerCalcValue = data[i].cpuUsagePct
          data[i].virtualPerCalcText = this.virtualPerCalcText(data[i])

          // 메모리 임계치
          const tempMem = {
            allMem: data[i].nonNodeMemSum || 0,
            memoryUsage: data[i].vmMemSum || 0
          }
          data[i].tempMem = tempMem
          data[i].hypervisorMemoryUsagePpmValue = data[i].memUsagePct
          data[i].hypervisorMemoryUsagePpmText = this.hypervisorMemoryUsagePpmText(data[i])

          // 디스크 임계치
          const tempDisk = {
            allDisk: data[i].nonNodeStorageCapacityBytes || 0,
            storageUsageBytes: data[i].vdiskCapacitySum ? data[i].vdiskCapacitySum : 0
            // allDisk: data[i].nonNodeStorageCapacityBytes,
            // storageUsageBytes: data[i].vdiskCapacitySum ? data[i].vdiskCapacitySum : 0
          }
          data[i].tempDisk = tempDisk
          data[i].hypervisorDiskUsagePpmValue = data[i].diskCapacityPct
          data[i].hypervisorDiskUsagePpmText = this.hypervisorDiskUsagePpmText(data[i])
          // 21.02.05 임시 2차 하드코딩처리 .end.//////////

          // 운영여부
          const status = data[i].isManage && data[i].isConnected ? 'success' : data[i].isManage && !data[i].isConnected ? 'error' : 'general'
          data[i].powerState = status

          // HA노드
          if (data[i].reservedHostUuids) {
            data[i].haveNodes = true
          } else {
            data[i].haveNodes = false
          }
        }
        if (elementIdx) {
          this.tableDataOrigin = data.filter(item => item.elementIdx === elementIdx)
        } else this.tableDataOrigin = data
        console.log('tableDataOrigin', this.tableDataOrigin)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.tableDataOrigin = []
        this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return false
      } finally {
        this.isGetClusterRequest = false
      }
    },
    /**
     * 필터링 적용시 발생 이벤트
     */
    searchCluster (clusterName = this.searchClusterName) {
      let result = [...this.tableDataOrigin]
      if (clusterName) result = result.filter(host => host.clusterName?.trim()?.toLowerCase().includes(clusterName?.trim()?.toLowerCase()))
      this.tableData = result
    }

  },
  data () {
    return {
      searchClusterName: '', // 검색 할 클러스터 명
      totalResultCnt: 0,
      // 가상화율 임계치 텍스트
      virtualPerCalcText (item) { // 가상화율 임계치 텍스트
        return `${Number(item.virtualPerCalc.usageVcpu).toFixed(0)} Core /  ${Number(item.virtualPerCalc.allVcpu).toFixed(0)} Core`
      },
      hypervisorMemoryUsagePpmText (item) { // 메모리 임계치 텍스트
        const { using, total, unit } = this.compareUnit(item.tempMem.memoryUsage || 0, item.tempMem.allMem || 0)
        return `${using}${unit} / ${total}${unit}`
      },
      hypervisorDiskUsagePpmText (item) { // 디스크 임계치 텍스트
        const { using, total, unit } = this.compareUnit(item.tempDisk.storageUsageBytes || 0, item.tempDisk.allDisk || 0)
        return `${using}${unit} / ${total}${unit}`
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
      isGetClusterRequest: false,

      // 테이블 데이터
      headerMergeColumns: {
        // colSpan: [
        //   { startIdx: 1, endIdx: 2, header: 'CPU' },
        //   { startIdx: 3, endIdx: 4, header: 'MEMORY' },
        //   { startIdx: 5, endIdx: 6, header: 'STORAGE' }
        //   // ,
        //   // { startIdx: 6, endIdx: 8, header: 'NETWORK' }
        // ],
        // rowSpan: ['clusterName', 'vmCnt']
      },
      columns: [
        { header: '클러스터 명', binding: 'clusterName', width: 150, align: 'left', keyPath: 'config.POOL.clusterName' },
        { header: 'Rack No', binding: 'rackNoNumber', width: 60 },
        { header: 'CPU Core 수', binding: 'nodeCpuCoresSum', width: 100, keyPath: 'common.GRID.CLUSTER.coreCpu' },
        { header: '가상화율', binding: 'cpuManageIndicator', width: 80, customHtml: true, keyPath: 'common.GRID.NUTA.virtualRate' },
        { header: 'CPU 사용량(%)', binding: 'hypervisorCpuUsagePpmValue', customHtml: true, width: 150, keyPath: 'common.GRID.DATABASE.usageCpu' },
        { header: '가상화율 임계치(%)', binding: 'virtualPerCalcValue', customHtml: true, width: '*', keyPath: this.$v('가상화율 할당율') },
        { header: '메모리 임계치(%)', binding: 'hypervisorMemoryUsagePpmValue', customHtml: true, width: '*', keyPath: this.$v('메모리 할당율') },
        { header: '디스크 임계치(%)', binding: 'hypervisorDiskUsagePpmValue', customHtml: true, width: '*', keyPath: this.$v('디스크 할당율') },
        // { header: '총 메모리', binding: 'nodeMemoryCapacityInBytesSum', customHtml: true, width: 100 },
        // { header: '디스크 사용량', binding: 'storageUsageBytes', customHtml: true, width: 100 },
        // { header: '디스크 총 용량', binding: 'storageCapacityBytes', customHtml: true, width: 100 },
        { header: '구동중인 VM', binding: 'vmCnt', width: 100, customHtml: true, keyPath: 'config.POOL.runVM' },
        { header: '운영 여부', binding: 'powerState', customHtml: true, width: 100, keyPath: 'config.POOL.isOper' },
        { header: 'HA 노드', binding: 'haveNodes', customHtml: true, width: 100, keyPath: 'common.GRID.CLUSTER.haNode' }
      ],
      tableData: [], // 필터링 후 보여지는 데이터
      tableDataOrigin: [], // 필터링 전
      mapData: [
        { clusterName: 'SSG-K-LEINA', cpu: 375, totalCore: 536, memory: 85, totalMem: 9049.45, disk: 90, totalDisk: 406.08 },
        { clusterName: 'SSG-K-LEINB', cpu: 359, totalCore: 588, memory: 87, totalMem: 9568.66, disk: 63, totalDisk: 430.96 },
        { clusterName: 'SSG-K-LEINC', cpu: 381, totalCore: 540, memory: 87, totalMem: 9569.44, disk: 77, totalDisk: 425.46 },
        { clusterName: 'SSG-K-LEIND', cpu: 357, totalCore: 564, memory: 87, totalMem: 9569.47, disk: 76, totalDisk: 427.64 },
        { clusterName: 'SSG-K-LEEXA', cpu: 361, totalCore: 268, memory: 70, totalMem: 4532.61, disk: 42, totalDisk: 202.03 },
        { clusterName: 'SSG-K-LEEXB', cpu: 311, totalCore: 312, memory: 62, totalMem: 5034.7, disk: 48, totalDisk: 226.52 },
        { clusterName: 'SSG-K-LEBIGA', cpu: 309, totalCore: 200, memory: 90, totalMem: 5025, disk: 66, totalDisk: 135.88 },
        { clusterName: 'SSG-K-LEHIGH', cpu: 233, totalCore: 280, memory: 64, totalMem: 3772.45, disk: 21, totalDisk: 190.46 },
        { clusterName: 'SSG-K-SDNCOMMA', cpu: 374, totalCore: 424, memory: 88, totalMem: 8552.82, disk: 56, totalDisk: 308.14 },
        { clusterName: 'SSG-K-SDNCOMMB', cpu: 330, totalCore: 480, memory: 85, totalMem: 9239.34, disk: 50, totalDisk: 337.24 },
        { clusterName: 'SSG-K-SDNHIGHA', cpu: 210, totalCore: 456, memory: 70, totalMem: 6795.37, disk: 5, totalDisk: 335.2 },
        { clusterName: 'SSG-SDN-INFRA', cpu: 363, totalCore: 184, memory: 80, totalMem: 2518.4, disk: 141, totalDisk: 25.29 },
        { clusterName: 'SSG-DR-INT01', cpu: 332, totalCore: 396, memory: 84, totalMem: 7051.29, disk: 114, totalDisk: 313.87 },
        { clusterName: 'SSG-DR-EXT01', cpu: 360, totalCore: 72, memory: 66, totalMem: 1511.22, disk: 48, totalDisk: 66.78 },
        { clusterName: 'SSG-SDNSAPA', cpu: 204, totalCore: 144, memory: 85, totalMem: 4546.56, disk: 52, totalDisk: 130.53 }
      ],
      columnDataMap: {
        powerState: [
          { value: 'general', caption: this.$t('common.noOper') },
          { value: 'success', caption: this.$t('common.operNormal') },
          { value: 'error', caption: this.$t('common.operAbNormal') }
        ]

      }
    }
  }
}
</script>
