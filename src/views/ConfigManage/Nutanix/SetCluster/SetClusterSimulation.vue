<template>
  <div
    class="component"
  >
    <back-before-page class="before-page-btn" />
    <button
      style="position:absolute; top:200px; right:0px; height:100px; opacity:0;"
      @click="test"
    >
      test
    </button>
    <filtering-component
      @reset-data="() => {
        searchClusterName = ''
        onSearch(searchClusterName)
      }"
      style="margin-top:50px;"
    >
      <div class="filter-form">
        <span class="filter-name">{{ $t('common.PLACEHOLDER.search') }}</span>
        <div class="filter-options">
          <el-input
            v-model="searchClusterName"
            :placeholder="$t('config.POOL.enterCluster')"
            @input="onSearch"
          />
        </div>
      </div>
    </filtering-component>
    <total-count
      class="total-count-wrap"
      :total-count="totalResultCnt"
    >
      <div v-loading="isLoading">
        <button
          class="button"
          type="is-primary"
          @click="resetSimulation"
          :disabled="!hasSimulatedCluster"
        >
          적용 초기화
        </button>
        <button
          class="button"
          type="is-primary"
          style="margin-left:20px;"
          @click="isVisible = true"
        >
          시뮬레이션 적용
        </button>
      </div>
    </total-count>
    <div
      v-if="isLoading"
      v-loading="isLoading"
      style="height:300px;"
    />
    <cmp-grid
      :element-loading-text="$t('common.PLACEHOLDER.loadingWait')"
      :loading="isLoading"
      :item-source="computedClusterWithHosts"
      :columns="columns"
      :header-merge="headerMergeColumns"
      :selectable="true"
      :column-data-map="columnDataMap"
      @total-count="cnt => totalResultCnt = cnt"
      :use-excel-download="true"
    >
      <!--  시뮬레이션 적용 유무 -->
      <template #isSimulated="{row}">
        <button
          v-if="row.isSimulated"
          class="button"
          type="is-primary"
          style="border-radius:20px;"
        >
          {{ $v('적용') }}
        </button>
        <div v-else>
          -
        </div>
      </template>
      <!-- CPU 코어 가상화율(AS-IS)-->
      <template #virtualPerCalcValue="{row}">
        <div class="progressbar-wrap">
          <progress-bar
            :value="row.vmCpuSum"
            :total="row.nonNodeCpuSum"
            :notice-percent="row.firstCpuPercent"
            :alert-percent="row.secondCpuPercent"
          />
          <el-tooltip
            :content="hypervisorCpu(row.vmCpuSum ,row.nonNodeCpuSum )"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ hypervisorCpu(row.vmCpuSum ,row.nonNodeCpuSum ) }}
            </span>
          </el-tooltip>
        </div>
      </template>
      <!-- MEMORY 임계치(AS-IS)-->
      <template #hypervisorMemoryUsagePpmValue="{row}">
        <div class="progressbar-wrap">
          <progress-bar
            :value="row.memorySum"
            :total="row.nonMemorySum"
            :notice-percent="row.firstMemoryPercent"
            :alert-percent="row.secondMemoryPercent"
          />
          <el-tooltip
            :content="hypervisorMemory(row.memorySum, row.nonMemorySum)"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              <!-- {{ row.memorySum + ' / ' + row.nonMemorySum }} -->
              {{ hypervisorMemory(row.memorySum, row.nonMemorySum) }}
            </span>
          </el-tooltip>
        </div>
      </template>
      <!-- DISK 임계치(AS-IS) -->
      <template #hypervisorDiskUsagePpmValue="{row}">
        <div class="progressbar-wrap">
          <progress-bar
            :value="row.diskSum"
            :total="row.nonDiskSum"
            :notice-percent="row.firstDiskPercent"
            :alert-percent="row.secondDiskPercent"
          />
          <el-tooltip
            :content="hypervisorMemory(row.diskSum, row.nonDiskSum)"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ hypervisorMemory(row.diskSum, row.nonDiskSum) }}
            </span>
          </el-tooltip>
        </div>
      </template>
      <!-- CPU 코어 가상화율(TO-BE) -->
      <template #afterVirtualPerCalcValue="{row}">
        <div
          v-if="row.isSimulated"
          class="progressbar-wrap"
        >
          <progress-bar
            :value="row.afterVmCpuSum"
            :total="row.afterNonNodeCpuSum"
            :notice-percent="row.firstCpuPercent"
            :alert-percent="row.secondCpuPercent"
          />
          <el-tooltip
            :content="hypervisorCpu(row.afterVmCpuSum ,row.afterNonNodeCpuSum )"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ hypervisorCpu(row.afterVmCpuSum ,row.afterNonNodeCpuSum ) }}
            </span>
          </el-tooltip>
        </div>
        <div v-else>
          -
        </div>
      </template>
      <!-- MEMORY 메모리 가상화율(TO-BE) -->
      <template #afterHypervisorMemoryUsagePpmValue="{row}">
        <div
          v-if="row.isSimulated"
          class="progressbar-wrap"
        >
          <progress-bar
            :value="row.afterMemorySum"
            :total="row.afterNodeMemorySum"
            :notice-percent="row.firstMemoryPercent"
            :alert-percent="row.secondMemoryPercent"
          />
          <el-tooltip
            :content="hypervisorMemory(row.afterMemorySum, row.afterNodeMemorySum)"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              <!-- {{ row.afterMemorySum + ' / ' + row.afterNodeMemorySum }} -->
              {{ hypervisorMemory(row.afterMemorySum, row.afterNodeMemorySum) }}
            </span>
          </el-tooltip>
        </div>
        <div v-else>
          -
        </div>
      </template>
      <!-- DISK 가상화율(TO-BE) -->
      <template #afterHypervisorDiskUsagePpmValue="{row}">
        <div
          v-if="row.isSimulated"
          class="progressbar-wrap"
        >
          <progress-bar
            :value="row.afterDiskSum"
            :total="row.afterNonDiskSum"
            :notice-percent="row.firstDiskPercent"
            :alert-percent="row.secondDiskPercent"
          />
          <el-tooltip
            :content="hypervisorMemory(row.afterDiskSum, row.afterNonDiskSum)"
            placement="top"
            effect="light"
          >
            <span class="progress-desc ellipsis-wrap">
              {{ hypervisorMemory(row.afterDiskSum, row.afterNonDiskSum) }}
            </span>
          </el-tooltip>
        </div>
        <div v-else>
          -
        </div>
      </template>
    </cmp-grid>

    <cluster-simulation-form
      :data="clustersWithHosts"
      :is-visible="isVisible"
      @close="isVisible = false"
      @apply="applySimulation"
    />
  </div>
</template>
<script>
import API from '@sd-fe/cmp-core'
import ClusterSimulationForm from './ClusterSimulationForm.vue'
import { cloneDeep, isEqual } from 'lodash'
import { mapState } from 'vuex'
import BackBeforePage from '@/components/BackBeforePage/BackBeforePage.vue'

export default {
  name: 'SetCluster',
  components: {
    ClusterSimulationForm,
    BackBeforePage
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
        // this.testCluster()
        // this.getClusterList(newVal)
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    hasSimulatedCluster () {
      return this.computedClusterWithHosts.some(cluster => cluster.isSimulated)
    },
    computedClusterWithHosts () {
      return this.clustersWithHosts.map(x => {
        //  vmCpuSum                     - vm(POWER_STATE = ‘ON’) - numCpus
        // vmMemSum                      - vm(POWER_STATE = ‘ON’) - memoryCapacityInBytes
        // vdiskCapacitySum              - vm - diskCapacityInBytes
        // nonNodeCpuSum                 - host -  numCpuCores
        // nonNodeMemSum                 - host - memoryCapacityInBytes
        // nonNodeStorageCapacityBytes   - host - storageCapacityBytes
        // x.powerState === 'ON'
        const vmCpuSum = this.getSum(x.hosts, x => x.powerState === 'ON', 'numVcpus')
        const memorySum = this.getSum(x.hosts, x => x.powerState === 'ON', 'memoryCapacityInBytes')
        const diskSum = this.getSum(x.hosts, () => true, 'diskCapacityInBytes')

        const nonNodeCpuSum = x.hosts.filter(x => !x.isHA).reduce((acc, cur) => acc + cur.numCpuCores, 0)
        const nonMemorySum = x.hosts.filter(x => !x.isHA).reduce((acc, cur) => acc + cur.memoryCapacityInBytes, 0)
        const nonDiskSum = x.hosts.filter(x => !x.isHA).reduce((acc, cur) => acc + cur.storageCapacityBytes, 0)

        const afterVmCpuSum = this.getSum(x.afterHosts, x => x.powerState === 'ON', 'numVcpus')
        const afterMemorySum = this.getSum(x.afterHosts, x => x.powerState === 'ON', 'memoryCapacityInBytes')
        const afterDiskSum = this.getSum(x.afterHosts, () => true, 'diskCapacityInBytes')

        const afterNonNodeCpuSum = x.afterHosts.filter(x => !x.isHA).reduce((acc, cur) => acc + cur.numCpuCores, 0)
        const afterNodeMemorySum = x.afterHosts.filter(x => !x.isHA).reduce((acc, cur) => acc + cur.memoryCapacityInBytes, 0)
        const afterNonDiskSum = x.afterHosts.filter(x => !x.isHA).reduce((acc, cur) => acc + cur.storageCapacityBytes, 0)
        const isSimulated = !isEqual(x.hosts, x.afterHosts)

        return {
          isSimulated: isSimulated,
          clusterName: x.clusterName,
          clusterId: x.clusterId,

          ...{ // numCpuCores
            vmCpuSum: vmCpuSum,
            nonNodeCpuSum: nonNodeCpuSum,
            virtualPerCalcValue: (vmCpuSum / nonNodeCpuSum) * 100,
            afterVmCpuSum: afterVmCpuSum, // 기존 before vmCpuSum 과 nonNodeCpuSum 을 비교 하여 변경
            afterNonNodeCpuSum: afterNonNodeCpuSum,
            afterVirtualPerCalcValue: isSimulated ? (afterVmCpuSum / afterNonNodeCpuSum) * 100 : '-',
            firstCpuPercent: x.firstCpuPercent,
            secondCpuPercent: x.secondCpuPercent

          },
          ...{
            memorySum: memorySum,
            nonMemorySum: nonMemorySum,
            hypervisorMemoryUsagePpmValue: (memorySum / nonMemorySum) * 100,
            afterMemorySum: afterMemorySum,
            afterNodeMemorySum: afterNodeMemorySum,
            afterHypervisorMemoryUsagePpmValue: isSimulated ? (afterMemorySum / afterNodeMemorySum) * 100 : '-',
            firstDiskPercent: x.firstDiskPercent,
            secondDiskPercent: x.secondDiskPercent
          },
          ...{
            diskSum: diskSum,
            nonDiskSum: nonDiskSum,
            hypervisorDiskUsagePpmValue: (diskSum / nonDiskSum) * 100,
            afterDiskSum: afterDiskSum,
            afterNonDiskSum: afterNonDiskSum,
            afterHypervisorDiskUsagePpmValue: isSimulated ? (afterDiskSum / afterNonDiskSum) * 100 : '-',
            firstMemoryPercent: x.firstMemoryPercent,
            secondMemoryPercent: x.secondMemoryPercent
          },
          hosts: [...x.hosts], // 새로운 hosts 배열을 생성합니다.
          afterHosts: [...x.afterHosts]
        }
      })
    }
  },
  async mounted () {
    this.mapClusters()
  },
  methods: {
    test () {
      this.testMode = true
      this.mapClusters()
    },
    onSearch (keyword) {
      if (keyword.trim()) {
        this.clustersWithHosts = this.clonedClusters.filter(x => x.clusterName.toLowerCase().includes(keyword))
      } else {
        this.clustersWithHosts = this.clonedClusters
      }
    },

    getSum (items, filter, property) {
      return items.flatMap(item => item.vms)
        .map(x => {
          return {
            ...x,
            diskCapacityInBytes: x.diskCapacityInBytes || 0
          }
        }) // 가용량 디스크 할당률 0 퍼센트 출력 이슈
        .filter(filter)
        .reduce((acc, cur) => acc + cur[property], 0)
    },
    getVmsSum (items, filter, property) {
      return items.flatMap(item => item.vms)
        .filter(filter)
        .reduce((acc, cur) => acc + cur[property], 0)
    },
    resetSimulation () {
      if (this.hasSimulatedCluster) {
        this.$confirm(this.$v('초기화 하시겠습니까?')).then(() => {
          this.clustersWithHosts = this.clonedClusters
          this.$alert('초기화 완료되었습니다.')
        }).catch(() => false)
      } else {
        this.$alert('시뮬레이션이 적용된 클러스터가 없습니다.')
      }
    },
    applySimulation (params) {
      const { selectedCluster, type, data, mode, transferTo } = params
      const clonedList = cloneDeep(this.clustersWithHosts)
      const cluster = clonedList.find(x => x.clusterName === selectedCluster)
      //  vmCpuSum                     - vm(POWER_STATE = ‘ON’) - numCpus
      // vmMemSum                      - vm(POWER_STATE = ‘ON’) - memoryCapacityInBytes
      // vdiskCapacitySum              - vm - diskCapacityInBytes
      // nonNodeCpuSum                 - host -  numCpuCores
      // nonNodeMemSum                 - host - memoryCapacityInBytes
      // nonNodeStorageCapacityBytes   - host - storageCapacityBytes
      if (mode === 'CREATE' && type === 'HW') {
        const newHosts = data.map(host => {
          const random = (Math.random() * 100000).toFixed(0)
          return {
            hostName: 'Added-Host' + random,
            numCpuCores: Number(host.cpu),
            memoryCapacityInBytes: Number(host.memory) * 1024 * 1024 * 1024,
            storageCapacityBytes: Number(host.disk) * 1024 * 1024 * 1024,
            hostUuid: host.hostUuid,
            vms: []
          }
        })

        this.clustersWithHosts = clonedList.map(x => {
          if (x.clusterName === selectedCluster) {
            return {
              ...x,
              afterHosts: [...x.afterHosts, ...newHosts]
            }
          } else {
            return {
              ...x
            }
          }
        })
      }

      if (mode === 'TRANSFER' && type === 'VM') {
        const vmIds = data.map(x => x.vmUuid)
        this.clustersWithHosts = clonedList.map(x => {
          console.log('TRANFERRT 예쩡 VMS')
          // console.log(newVms)
          if (x.clusterName === selectedCluster) {
            const filteredVms = x.afterHosts?.map(host => {
              const vms = host.vms.filter(vm => !vmIds.includes(vm.vmUuid))
              return {
                ...host,
                vms: vms
              }
            })
            return {
              ...x,
              afterHosts: filteredVms
            }
          }

          if (x.clusterName === transferTo) {
            console.log('나 보여요 ??@?@?@??@?')
            console.log('#TRANSFADS', x)
            return {
              ...x,
              afterHosts: [
                {
                  ...x.afterHosts?.[0],
                  vms: [...x.afterHosts[0]?.vms, ...data]
                },
                ...x.afterHosts.slice(1)

              ]
            }
          }
          return {
            ...x
          }
        })
      }

      if (mode === 'CREATE' && type === 'VM') {
        try {
          // 추가될 각 VM의 수량은 data 배열의 각 원소마다 개별적으로 정해짐
          const newVms = data.flatMap(vmData => {
            const { amount } = vmData
            const random = (Math.random() * 100000).toFixed(0)
            const vms = []
            for (let i = 0; i < amount; i++) {
              const vm = {
                powerState: 'ON',
                vmName: 'Added-VM-' + random,
                numVcpus: Number(vmData.cpu),
                memoryCapacityInBytes: Number(vmData.memory) * 1024 * 1024 * 1024,
                diskCapacityInBytes: Number(vmData.disk) * 1024 * 1024 * 1024
              }
              vms.push(vm)
            }
            return vms
          })
          console.log('추가 될 vms 들 host 의 0번째 vms 속성으로 들어가야함', newVms)

          this.clustersWithHosts = clonedList.map(x => {
            if (x.clusterName === selectedCluster) {
              return {
                ...x,
                afterHosts: [
                  {
                    ...x.afterHosts[0],
                    vms: [...x.afterHosts?.[0]?.vms, ...newVms]
                  },
                  ...x.afterHosts.slice(1)

                ]
              }
            } else {
              return {
                ...x
              }
            }
          })
        } catch (err) {
          console.log(err)
        }
      }

      if (mode === 'DELETE' && type === 'HW') {
        const hostIds = data.map(x => x.hostUuid)

        const afterHosts = cluster.afterHosts.filter(x => !hostIds.includes(x.hostUuid))
        this.clustersWithHosts = clonedList.map(x => {
          if (x.clusterName === selectedCluster) {
            return {
              ...x,
              afterHosts: afterHosts
            }
          } else {
            return {
              ...x
            }
          }
        })
      }

      if (mode === 'DELETE' && type === 'VM') {
        const vmIds = data.map(x => x.vmUuid)
        this.clustersWithHosts = clonedList.map(x => {
          if (x.clusterName === selectedCluster) {
            const filteredVms = x.afterHosts.map(host => {
              const vms = host.vms.filter(vm => !vmIds.includes(vm.vmUuid))
              return {
                ...host,
                vms: vms
              }
            })
            return {
              ...x,
              afterHosts: filteredVms
            }
          }
          return {
            ...x
          }
        })
      }
    },
    async mapClusters () {
      try {
        this.isLoading = true
        const data = await API.compute.getElementListSimple()

        let dataList
        if (this.testMode) {
          dataList = [...data, ...data]
        } else {
          dataList = data
        }

        const clusters = dataList.map(x => ({
          clusterUuid: x.uuid,
          clusterName: x.clusterName,
          firstCpuPercent: x.firstCpuPercent,
          secondCpuPercent: x.secondCpuPercent,
          firstMemoryPercent: x.firstMemoryPercent,
          secondMemoryPercent: x.secondMemoryPercent,
          firstDiskPercent: x.firstDiskPercent,
          secondDiskPercent: x.secondDiskPercent,
          vmCpuSum: x.vmCpuSum,
          vmMemSum: x.vmMemSum,
          vdiskCapacitySum: x.vdiskCapacitySum
        }))
        if (this.testMode) {
          clusters.map(x => {
            x.clusterUuid = x.clusterUuid + Math.random()
            x.clusterName = x.clusterName + Math.random()
          })
        }

        const clustersWithHosts = []
        for (const cluster of clusters) {
          const hosts = await API.compute.getHostList(cluster.clusterUuid)
          console.log('#FETCH HOST DATA')

          console.log(hosts)
          // ### 임시
          const hostIds = hosts.map(host => host.hostUuid)
          const headers = {
            userId: this.user.userId,
            isAdmin: true
          }
          const vmsPromises = hostIds.map(hostId => API.compute.getCustomVms({
            hostUuid: hostId
          }, headers))
          const vmsByHosts = await Promise.all(vmsPromises)

          hosts.forEach((host, index) => {
            host.vms = vmsByHosts[index]
          })

          clustersWithHosts.push({
            ...cluster,
            clusterId: cluster.clusterUuid,
            clusterName: cluster.clusterName,
            hosts: hosts,
            afterHosts: hosts
          })

          const foundCluster = clustersWithHosts.find(c => c.clusterName === cluster.clusterName)

          const vmCpuSum = this.getSum(foundCluster.hosts, x => x.powerState === 'ON', 'numVcpus')
          const memorySum = this.getSum(foundCluster.hosts, x => x.powerState === 'ON', 'memoryCapacityInBytes')
          const diskSum = this.getSum(foundCluster.hosts, () => true, 'diskCapacityInBytes')
          const random = Math.random() * 100000
          const newVm = {
            vmUuid: 'Unregister-VM-' + random,
            powerState: 'ON',
            numVcpus: cluster.vmCpuSum - vmCpuSum,
            memoryCapacityInBytes: cluster.vmMemSum - memorySum,
            diskCapacityInBytes: cluster.vdiskCapacitySum - diskSum
          }
          clustersWithHosts.forEach(c => {
            if (c.clusterName === cluster.clusterName) {
              const lastIndex = c.hosts.length - 1
              const updatedVms = [...c.hosts[lastIndex].vms, newVm]
              const updatedHosts = [
                ...c.hosts.slice(0, lastIndex),
                { ...c.hosts[lastIndex], vms: updatedVms }
              ]
              c.hosts = updatedHosts
              c.afterHosts = updatedHosts
            }
          })
        }

        this.clonedClusters = cloneDeep(clustersWithHosts)
        this.clustersWithHosts = clustersWithHosts
      } catch (err) {
        console.log(err)
      } finally {
        this.isLoading = false
      }
    }

  },
  data () {
    return {
      testMode: false,
      isLoading: false,
      clustersWithHosts: [],
      originData: [],
      isVisible: false,
      searchClusterName: '', // 검색 할 클러스터 명
      totalResultCnt: 0,
      // virtualPerCalcText (vmCpuSum = 0, nonNodeCpuSum = 0) { // 가상화율 임계치 텍스트
      //   return `${Number(vmCpuSum).toFixed(0)} Core /  ${Number(nonNodeCpuSum).toFixed(0)} Core`
      // },
      // hypervisorMemoryUsagePpmText (item) { // 메모리 임계치 텍스트
      //   const { using, total, unit } = this.compareUnit(item.tempMem.memoryUsage || 0, item.tempMem.allMem || 0)
      //   return `${using}${unit} / ${total}${unit}`
      // },
      // hypervisorDiskUsagePpmText (item) { // 디스크 임계치 텍스트
      //   const { using, total, unit } = this.compareUnit(item.tempDisk.storageUsageBytes || 0, item.tempDisk.allDisk || 0)
      //   return `${using}${unit} / ${total}${unit}`
      // },
      hypervisorCpu (vmCpuSum = 0, nonNodeCpuSum = 0) { // 가상화율 임계치 텍스트
        return `${Number(vmCpuSum).toFixed(0)} Core /  ${Number(nonNodeCpuSum).toFixed(0)} Core`
      },
      hypervisorMemory (left, right) { // 메모리 임계치 텍스트
        const { using, total, unit } = this.compareUnit(left || 0, right || 0)
        return `${using}${unit} / ${total}${unit}`
      },
      hypervisorDisk (left, right) { // 디스크 임계치 텍스트
        const { using, total, unit } = this.compareUnit(left || 0, right || 0)
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

      // 테이블 데이터
      headerMergeColumns: {
        colSpan: [
          { startIdx: 2, endIdx: 4, header: 'AS-IS' },
          { startIdx: 5, endIdx: 7, header: 'TO-BE' }
        ],
        rowSpan: ['isSimulated', 'clusterName']
      },
      columns: [
        { header: '시뮬레이션 적용 여부', binding: 'isSimulated', width: 150, align: 'center', customHtml: true },
        { header: '클러스터 명', binding: 'clusterName', width: 150, align: 'left', customHtml: true },
        { header: this.$v('가상화율 할당율'), binding: 'virtualPerCalcValue', customHtml: true, width: '*' },
        { header: this.$v('메모리 할당율'), binding: 'hypervisorMemoryUsagePpmValue', customHtml: true, width: '*' },
        { header: this.$v('디스크 할당율'), binding: 'hypervisorDiskUsagePpmValue', customHtml: true, width: '*' },
        { header: this.$v('가상화율 할당율'), binding: 'afterVirtualPerCalcValue', customHtml: true, width: '*' },
        { header: this.$v('메모리 할당율'), binding: 'afterHypervisorMemoryUsagePpmValue', customHtml: true, width: '*' },
        { header: this.$v('디스크 할당율'), binding: 'afterHypervisorDiskUsagePpmValue', customHtml: true, width: '*' }
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

<style lang="scss" scoped>
.component {
  &::v-deep {
    .before-page-btn {
      span {
        transform:translateY(-10%);
      }
    }
  }
}

</style>
