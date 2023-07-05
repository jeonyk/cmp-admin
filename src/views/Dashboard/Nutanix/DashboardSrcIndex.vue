
<template>
  <div class="dashboard-src-index-wrapper">
    <h3 class="section-title3">
      {{ $t('main.DASHBOARD.srcIdx') }}
      <!-- 자원 개요 -->

      <small>
        {{ $t('main.DASHBOARD.referenceTime') }}
        : {{ selCluster ? selCluster.updateTime : null | date }}
        <!-- 기준 시각 -->
      </small>
    </h3>

    <!-- <button
      class="button cluster-status"
      type="is-primary"
      @click="openClusterStatusModal"
      >
      ❌ 클러스터 현황
      {{ $t('main.DASHBOARD.clusterStatus') }}
    </button> -->
    <!-- /. 헤더 -->

    <section class="index-section">
      <article class="-left">
        <div
          class="cluster-list"
          v-loading="loading"
        >
          <search-index
            title="Cluster"
            :route-to="{ name: 'set-cluster' }"
            :data="clusterList"
            @change="changeClusterOpt"
          />
          <search-index
            :title="selCluster && selCluster.name ? selCluster.name : '-'"
            :route-to="{ name: 'set-host' }"
            :data="nodeList"
            @change="changeClusterOpt"
            ref="nodeList"
          />
        </div>
        <!-- /. 클러스터 / 개요 검색 -->

        <div
          class="cluster-index"
          v-loading="loading"
        >
          <src-index-chart :data="chartData" />
        </div>
        <!-- /. 차트 -->
      </article>
      <!-- /. 클러스터, 자원 개요, 차트 -->

      <article
        class="-right"
        v-loading="loading"
      >
        <src-index-node-detail
          :data="nodeTop10"
          :cluster="selCluster"
          @selectedNode="selectedNode"
        />
      </article>
      <!-- /. 노드 리스트 -->
    </section>

    <!-- ❌ 클러스터 현황 모달 (삭제) -->
    <!-- <el-dialog
      :title="$t('main.DASHBOARD.clusterStatus')"
      :visible.sync="clusterStatusModalVisible"
      width="90vw"
      top="5vh"
      append-to-body
    >
      <div style="height: 80vh; overflow-y: auto;">
        <dashboard-resource-status
          :region="region"
          v-if="clusterStatusModalVisible"
          :raw-clusters="rawClusters"
        />
      </div>
    </el-dialog> -->
  </div>
</template>

<script>
// import DashboardResourceStatus from './DashboardResourceStatus'
import ClusterUsageMixin from './DashboardRegion/ClusterUsageMixin'
import SearchIndex from './DashboardSrcIndex/SearchIndex'
import SrcIndexChart from './DashboardSrcIndex/SrcIndexChart'
import SrcIndexNodeDetail from './DashboardSrcIndex/SrcIndexNodeDetail'

export default {
  name: 'DashboardSrcIndex',
  components: {
    SearchIndex,
    SrcIndexChart,
    SrcIndexNodeDetail
    // DashboardResourceStatus ❌ 클러스터 현황 모달 (삭제)
  },
  mixins: [ClusterUsageMixin],
  props: {
    region: {
      type: String,
      default: undefined
    },
    rawClusters: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    async region (region) {
      // 전체 일때 분기처리
      const rawClusters = region === 'all' ? this.rawClusters : this.rawClusters.filter(cls => cls.center === region)
      await this.setClusterTop5Data(this.rawClusters)
      this.setClusterList(rawClusters)
    }
  },
  methods: {

    /**
     * 클러스터 순위를 가져옵니다.
     * 클러스터현황 > 팝업 데이터와 동일하므로, mixin 을 사용합니다.
     */
    async setClusterTop5Data (rawClusters = this.rawClusters) {
      // ClusterUsageMixin.js 함수
      const { vcpuData, memoryData } = await this.getClusterUsageLists(rawClusters)
      const vcpuRank = vcpuData
      const memoryRank = memoryData
      this.clusterSapreRank = { vcpuRank, memoryRank }
    },
    setClusterList (rawClusters = this.rawClusters) {
      this.loading = true

      // 임계치 바탕으로 sorting 할 수 있도록 세팅 :: 임계치 초과(알파벳순) => 2 임계치 초과(알파벳순) => 알파벳순
      const standardSorting = (data) => {
        const extract = (items, exceed) => items.filter(data => data.exceeded === exceed)
        const sortList = (list) => {
          return list.sort((a, b) => {
            if (a.name > b.name) return 1
            else if (a.name < b.name) return -1
            else return 0
          })
        }

        let result = []
        for (let e = 2; e >= 0; e--) {
          const extracted = extract(data, e)
          const sorted = sortList(extracted)
          result = result.concat(sorted)
        }
        return result
      }

      // 내부 클러스터 리스트 생성
      const clusterInfos = rawClusters.map(cls => {
        // 클러스터 리스트 세팅
        const {
          clusterName, // 클러스터 이름
          clusterUuid, // 클러스터 Uuid
          hosts, // 노드리스트
          elementIdx, // element Idx
          virtualPercent, // 최대 가상화율
          firstCpuPercent, // cpu 1차 임계치
          firstDiskPercent, // disk 1차 임계치
          firstMemoryPercent, // memory 1차 임계치
          secondCpuPercent, // cpu 2차 임계치
          secondDiskPercent, // disk 2차 임계치
          secondMemoryPercent, // memory 2차 임계치
          cpuManageIndicator, // cpu 관리지표
          memoryManageIndicator, // disk 관리지표
          diskManageIndicator, // memory 관리지표
          cpuUsagePct, // cpu 가상화율 in cluster
          memUsagePct, // memory 할당률 in cluster
          diskCapacityPct, // disk 할당률 in cluster
          hypervisorCpuUsage, // CPU 사용량 in cluster
          hypervisorMemoryUsage, // Memory 사용량 in cluster
          diskUsagePct, // Disk 사용량 in cluster
          center, // 리전
          jobs
        } = cls

        // 임계치 넘는지 확인할 수 있는 지역 함수 :: 1 임계치 초과(알파벳순) => 2 임계치 초과(알파벳순) => 알파벳순
        // 둘중하나라도 넘는경우임
        const getExceededVal = ({ cpuPct, memPct, diskPct }) => {
          // first~ : 1차 임계치
          // second~ : 2차 임계치

          let value = 0
          const diskFirstCompare = diskPct ? diskPct > firstDiskPercent : false // node - disk 는 비교할 키가 없음
          const diskSecondCompare = diskPct ? diskPct > secondDiskPercent : false // node - disk 는 비교할 키가 없음

          const overFirst = cpuPct > firstCpuPercent || memPct > firstMemoryPercent || diskFirstCompare
          const overSecond = cpuPct > secondCpuPercent || memPct > secondMemoryPercent || diskSecondCompare

          value += overFirst ? 1 : 0
          value += overSecond ? 1 : 0

          return value
        }

        // 각 내용의 1차 / 2차 임계치 요소 정리
        const cpuExceeded = { standard1: firstCpuPercent, standard2: secondCpuPercent }
        const memoryExceeded = { standard1: firstMemoryPercent, standard2: secondMemoryPercent }
        const diskExceeded = { standard1: firstDiskPercent, standard2: secondDiskPercent }

        // 클러스터의 가장 최근 동기화 시간 확인
        let updateTime = null
        // const debuggingUpdateTime = [] // 🌸 디버깅용
        if (jobs) {
          for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i]
            if (job.updateTime && updateTime < job.updateTime) updateTime = job.updateTime
            // debuggingUpdateTime.push(job.updateTime)
          }
        }
        // console.log(updateTime, debuggingUpdateTime.sort().reverse()) // 🌸 디버깅용

        // === 노드 세팅 ===
        const nodes = hosts?.map(host => {
          const {
            nodeName, // node 이름
            hostUuid, // node Uuid
            cpuUsagePct, // cpu 가상화율 in node
            memUsagePct, // memory 할당률 in node
            // diskUsagePct, // disk 할당률 in node (노드는 사용 X)
            totalNumVms, // VM Count in node
            numVms, // Run VM in node
            hypervisorCpuUsagePpm, // CPU 사용량 in node
            hypervisorMemoryUsagePpm, // Memory 사용량 in node
            storageUsageBytes, // Disk 사용량 in node
            storageCapacityBytes // Disk 총량 in node
          } = host

          // 노드의 [사용량] progress bar 데이터
          const usagePct = { // % 만 보여줌
            cpu: (hypervisorCpuUsagePpm / 10000),
            memory: (hypervisorMemoryUsagePpm / 10000),
            disk: (storageUsageBytes / storageCapacityBytes) * 100
          }

          // 노드의 [가상화율 & 할당률]
          const assignPct = {
            max: virtualPercent, // 해당 클러스터의 최대 가상화율
            cpu: { value: cpuUsagePct, indicator: cpuManageIndicator, ...cpuExceeded },
            memory: { value: memUsagePct, indicator: memoryManageIndicator, ...memoryExceeded },
            disk: { value: 0, indicator: diskManageIndicator } // 노드에는 disk 할당량이 없음..!!
          }

          // 상위 클러스터 정보
          const clusterInfo = { name: clusterName, uuid: clusterUuid, elementIdx }

          const exceeded = getExceededVal({ cpuPct: cpuUsagePct, memPct: memUsagePct }) // 노드 가상화율이 임계치 넘는지 확인
          const structure = { type: 'node', name: nodeName, uuid: hostUuid, exceeded, region: center }
          const nodeInfo = { vmCnt: totalNumVms, vmRun: numVms, usagePct, assignPct }
          return { ...structure, ...nodeInfo, clusterInfo }
        })

        // 노드 sorting
        const nodeList = standardSorting(nodes || [])

        // 노드 리스트 0번째에 All 항목 추가
        const all = { type: 'node', name: 'All', uuid: 'all', exceeded: 0 }
        nodeList.unshift(all)
        // /. ==== 🚩🚩🚩 노드 세팅 완료 🚩🚩🚩 ===

        // 클러스터의 [사용량] progress bar 데이터
        const usagePct = {
          cpu: hypervisorCpuUsage,
          memory: hypervisorMemoryUsage,
          disk: diskUsagePct
        }

        // 클러스터의 [가상화율 & 할당률]
        const { vcpuRank, memoryRank } = this.clusterSapreRank
        const assignPct = {
          max: virtualPercent, // 최대 가상화율
          cpu: { rank: vcpuRank, value: cpuUsagePct, indicator: cpuManageIndicator, ...cpuExceeded },
          memory: { rank: memoryRank, value: memUsagePct, indicator: memoryManageIndicator, ...memoryExceeded },
          disk: { value: diskCapacityPct, indicator: diskManageIndicator, ...diskExceeded }
        }

        // 클러스터 가상화율이 임계치 넘는지 확인
        const exceeded = getExceededVal({ cpuPct: cpuUsagePct, memPct: memUsagePct, diskPct: diskCapacityPct })
        const structure = { type: 'cluster', name: clusterName, uuid: clusterUuid, exceeded, region: center }
        const clusterInfo = { usagePct, assignPct, elementIdx }

        return { ...structure, ...clusterInfo, children: nodeList, updateTime }
        // /. === 클러스터 세팅 ===
      })

      // 클러스터 sorting
      const clusterList = standardSorting(clusterInfos)
      this.clusterList = clusterList

      // ===
      // ===
      // ===

      if (this.clusterList.length) {
        // 처음 시작시 첫 번째 클러스터 / 노드 자동 선택
        this.selCluster = this.clusterList[0]
        this.nodeList = this.clusterList[0].children
      } else {
        this.selCluster = {}
        this.nodeList = []
      }

      this.loading = false
    },
    /**
     * 우측 노드 top 10 데이터 설정
     */
    setNodeTop10List (selCluster = this.selCluster) {
      this.loading = true
      const nodes = selCluster?.children.filter(data => data.uuid !== 'all')

      const nodeTop10Format = key => {
        return nodes.map(node => ({
          name: node.name, // 노드의 이름
          uuid: node.uuid, // 노드의 uuid
          value: node.assignPct[key].value, // vCPU 가상화율 || 메모리 할당률
          max: node.assignPct.max // 최대 가상화율
        }))
      }

      const vcpuNodeTop10 = nodeTop10Format('cpu') // vCPU 가상화율 노드 10
      const memoryNodeTop10 = nodeTop10Format('memory') // 메모링 가상화율 노드 10

      const geSortedtData = rawData => {
        return rawData.sort((a, b) => {
          if (a.value > b.value) return 1
          else if (a.value < b.value) return -1
          else return 0
        })
      }

      this.nodeTop10 = {
        cpu: geSortedtData(vcpuNodeTop10),
        memory: geSortedtData(memoryNodeTop10)

      }

      this.loading = false
    },
    /**
     * 선택된 cluster 정보를 저장 + 내부의 nodes 를 보여줍니다
     * 선택된 node 정보를 저장
     */
    changeClusterOpt (item) {
      // element / node 리스트가 없을 경우 모두 리셋
      // 리팩토링 및 퍼포먼스 이슈 해결 필요! 🍏
      if (!item) {
        this.chartData = {}
        this.selCluster = {}
        this.nodeTop10 = {
          cpu: [],
          memory: []
        }
        return
      }

      if (item.type === 'cluster') { // 클러스터 선택시
        this.selCluster = item
        this.nodeList = item.children
        this.setNodeTop10List(item) // node Top 10 리스트 설정

        // 노드 선택 된 상태에서 => 클러스터 선택시, 노드는 0번째 (All)가 선택되어야함
        if (this.chartData.type === 'node') {
          const ref = this.$refs.nodeList
          ref.clickEvent(ref.result[0])
        }
      }

      this.chartData = item

      // node 를 All 선택할 경우, 해당 클러스터로 설정
      if (item.name === 'All') this.chartData = this.selCluster
    },
    /**
     * 우측 노드 Top 10 리스트에서 선택된 아이템을
     * 좌측 데이터 + 리스트에서 선택되도록 설정
     * 데이터 선택시에 내부 검색데이터 초기화
     */
    selectedNode (item) {
      const node = this.nodeList.filter(data => data.uuid === item.uuid)

      const ref = this.$refs.nodeList
      ref.searchText = ''
      ref.result = ref.rawData
      ref.clickEvent(node[0])
    },
    openClusterStatusModal () {
      this.clusterStatusModalVisible = true
    }
  },
  data () {
    return {
      loading: true,
      clusterStatusModalVisible: false,
      selCluster: { name: '-' },
      chartData: {},
      clusterList: [],
      nodeList: [],
      nodeTop10: {},
      clusterSapreRank: null
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-src-index-wrapper {
  position: relative;

  .cluster-status {
    position: absolute;
    top: -$gap-s; right: 0;
  }

  .index-section {
    display: grid;
    grid-template-columns: 1100px 480px;
    height: 750px;
    column-gap: $gap;

    > article {

      &.-left {
        display: flex;
        background: linear-gradient(90deg, #141335 -2.29%, #212643 100.34%);
        box-shadow: 10px 10px 80px rgba(10, 16, 34, 0.6);
        border-radius: $radius-m;

        .cluster-list {
          flex: 0 0 500px;
          border-radius: $gap-s $gap $gap $gap-s;
          background-color: #1F2341;
          display: flex;
          > div { flex: 1 1 50%; }
        }
        .cluster-index {
          flex: 0 0 600px;
        }
      }

      &.-right {
        background-color: #1F2341;
        box-shadow: 10px 10px 60px rgba(10, 16, 34, 0.89);
        border-radius: $radius-m;
      }
    }
  }
}
</style>
