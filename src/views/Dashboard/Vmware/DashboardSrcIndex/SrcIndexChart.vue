
<template>
  <section
    class="cluster-index-wrapper"
    v-loading="loading"
  >
    <h4 class="cluster-label">
      {{ data.name ? data.name : '-' }}
    </h4>
    <!-- /. 클러스터 개요 -->

    <ul class="datacenter-labels">
      <li>{{ data.region ? data.region : '-' }}</li>
      <li v-if="data.type === 'node'">
        {{ data.clusterInfo.name }}
      </li>
    </ul>
    <!-- /. 데이터 센터 위치 라벨 -->

    <div class="nutanix-alert">
      <div
        class="alert-content"
        v-for="(count, key) in alertContents"
        :key="key"
      >
        <span>{{ alertKeys(key) }}</span>
        <strong :class="[{ '-critical': key === 'critical' }, { '-warning': key === 'warning' }]">
          {{ count | locale }}
          <!-- Count -->
        </strong>
      </div>
    </div>
    <!-- /. Nutanix Alert -->

    <div class="cluster-usage">
      <h5 class="small-tit">
        {{ $t('main.DASHBOARD.usage') }}
        <!-- 사용량 -->
      </h5>

      <ul class="usage-list">
        <li
          v-for="item in usageData"
          :key="`_${item.label}`"
        >
          <strong>{{ item.label }}</strong>
          <el-progress
            v-if="item.percent"
            class="progress"
            :percentage="item.percent > 100 ? 100 : item.percent"
            :width="110"
            :show-text="false"
            :stroke-width="7"
            :status="item.status"
          />
          <span class="text">
            <strong>{{ item.percent }}</strong>%
          </span>
        </li>
      </ul>
    </div>
    <!-- /. 사용량 -->

    <div class="vertualization-quota-rate">
      <h5 class="small-tit">
        {{ $t('main.DASHBOARD.virtualRate') }}<b>&</b>{{ $t('main.DASHBOARD.quota') }}
        <!-- 가상화율<b>&</b>할당률 -->
      </h5>

      <ul class="rate-chart">
        <li
          v-for="item in virtualizeRate"
          :key="`__${item.title}`"
        >
          <div class="graph">
            <el-progress
              ref="usage-list"
              type="dashboard"
              :percentage="item.percent"
              :status="item.status"
              :show-text="false"
              :stroke-width="7"
              :width="140"
              stroke-linecap="round"
            />

            <p
              class="text -na"
              v-if="item.field === 'disk' && item.value === 0"
            >
              <span><b>N/A</b></span>
            </p>
            <p
              class="text"
              v-else
            >
              <!-- 임계치 :: 최대임계치 -->
              <small>{{ $t('main.DASHBOARD.threshold') }}: {{ item.max }}</small>

              <span><b>{{ item.value }}</b>%</span>
            </p>
          </div>

          <div class="virtualization-info">
            <strong>
              <el-tooltip
                class="item"
                effect="light"
                placement="bottom-start"
                popper-class="disk-tooltip-content"
                v-if="item.field === 'disk' && item.value === 0"
              >
                <span
                  slot="content"
                  class="tooltip-content"
                  v-html="$t('main.DASHBOARD.information')"
                />
                <i class="mdi mdi-information-outline" />
              </el-tooltip>
              <!-- /. information -->

              {{ item.title }}
            </strong>
            <p
              class="rank"
              v-if="item.subTit && showSpareRank(item.spareRank) && data.type === 'node'"
            >
              <!-- 여유 n 순위 -->
              <i>{{ item.subTit }}</i>
              {{ $t('main.DASHBOARD.spare') }}
              <span v-html="$t('main.DASHBOARD.rank', { spare: item.spareRank })" />
            </p>
            <p
              v-else
              class="-empty"
            />
          </div>
        </li>
      </ul>
    </div>
    <!-- /. 가상화율 & 할당률 -->
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'SrcIndexChart',
  props: {
    data: {
      type: [Object, null],
      default: () => {}
    }
  },
  watch: {
    data (data) {
      // console.log(data.type, ' 선택~')

      this.getAlertCnt(data)
      this.getUsagePercent(data)
      this.getAssignPercent(data)
    }
  },
  methods: {
    async getAlertCnt (data) {
      const isCluster = data.type === 'cluster'
      const { children, vmCnt, vmRun } = data

      // cluster / node 일때 설정 다르게 설정
      let clsVmCnt = 0
      if (isCluster) {
        // VM Count = node 의 vmCnt 를 모두 더한값
        data.children.forEach(node => (clsVmCnt += node.vmCnt ? node.vmCnt : 0))
      }
      const contents = isCluster ? { clsNodeCnt: children.length - 1, clsVmCnt } : { nodeVmCount: vmCnt, nodeRunVM: vmRun }

      try {
        this.loading = true

        // 클러스터 / 노드 cnt 설정
        let payload = {}

        if (isCluster) payload = { elementIdx: data.elementIdx }
        else payload = { elementIdx: data?.clusterInfo.elementIdx, hostUuid: data.uuid }

        const response = await API.compute.getAlertCnt(payload)
        const { criticalCnt, warningCnt } = response

        this.alertContents = {
          critical: criticalCnt,
          warning: warningCnt,
          ...contents
        }
      } catch (error) {
        this.alertContents = { critical: 0, warning: 0, ...contents }
      } finally {
        this.loading = false
      }
    },
    /**
     * [사용량] 데이터 세팅
     */
    getUsagePercent (data) {
      // 데이터 없으면 초기화
      if (!data.usagePct) {
        this.usageData = [
          { field: 'cpu', label: 'CPU', percent: 0 },
          { field: 'memory', label: 'Memory', percent: 0 },
          { field: 'disk', label: 'Disk', percent: 0 }
        ]
        return
      }

      this.usageData = this.usageData.map(item => {
        // 소수점 내림
        const percent = Math.floor(data.usagePct[item.field])

        // 🟡 임시 임계치?
        let status
        if (percent > 60 && percent < 80) status = 'warning'
        else if (percent >= 80) status = 'exception'

        return { ...item, percent, status }
      })
    },
    /**
     * [가상화율 & 할당률] 데이터 세팅
     */
    getAssignPercent (data) {
      // 데이터 없으면 초기화
      if (!data.assignPct) {
        this.virtualizeRate = [
          { percent: 0, max: 0, value: 0, field: 'cpu', title: `vCPU ${this.$t('main.DASHBOARD.virtualRate')}`, subTit: 'vCPU' }, // vCPU 가상화율
          { percent: 0, max: 0, value: 0, field: 'memory', title: `Memory ${this.$t('main.DASHBOARD.quota')}`, subTit: 'Memory' }, // Memory 할당률
          { percent: 0, max: 0, value: 0, field: 'disk', title: `Disk ${this.$t('main.DASHBOARD.quota')}` } // Disk 할당률
        ]
        return
      }

      this.virtualizeRate = this.virtualizeRate.map(item => {
        const assignPct = data.assignPct[item.field]
        const { value, standard1, standard2 } = assignPct

        // Cluster 일 경우 밖에서 rank 정의 || Node 일 경우 우측 Node Top 10 에서 rank 정의
        const nodeTop10 = this.$parent.nodeTop10
        const rank = assignPct.rank ? assignPct.rank : nodeTop10[item.field]

        // 여유 n 순위
        let spareRank = 1
        if (rank) {
          for (let i = 0; i < rank.length + 1; i++) {
            const rankInfo = rank[i]
            if (rankInfo && (data.name === rankInfo.clusterName || data.name === rankInfo.name)) {
              spareRank = i + 1
              break
            }
          }
        }

        const { max } = data.assignPct
        const calculate = isNaN(value / max) ? 0 : (value / max) * 100
        const percent = calculate > 100 ? 100 : calculate

        let status
        if (value > standard1 && value < standard2) status = 'warning'
        else if (value >= standard2) status = 'exception'

        // value: 데이터 , percent: 그래프 데이터, max: 임계치, spareRank: 여유 n 순위, status: 임계치 over 여부
        return { ...item, value, percent, max, spareRank, status }
      })
    }
  },
  data () {
    return {
      loading: false,
      alertContents: {},
      alertKeys: (key) => ({
        critical: 'Critical',
        warning: 'Warning',
        clsNodeCnt: 'Node Count', // cluster
        clsVmCnt: 'Vm Count',
        nodeVmCount: 'Vm Count', // node
        nodeRunVM: 'Run VM'
      }[key]),
      usageData: [
        { field: 'cpu', label: 'CPU', percent: 0 },
        { field: 'memory', label: 'Memory', percent: 0 },
        { field: 'disk', label: 'Disk', percent: 0 }
      ],
      virtualizeRate: [
        { field: 'cpu', title: `vCPU ${this.$t('main.DASHBOARD.virtualRate')}`, subTit: 'vCPU' }, // vCPU 가상화율
        { field: 'memory', title: `Memory ${this.$t('main.DASHBOARD.quota')}`, subTit: 'Memory' }, // Memory 할당률
        { field: 'disk', title: `Disk ${this.$t('main.DASHBOARD.quota')}` } // Disk 할당률
      ],
      showSpareRank (rank) {
        return rank <= 5
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.cluster-index-wrapper {
  padding: 35px 40px 40px 40px;
  box-sizing: border-box;

  .cluster-label {
    font-weight: bold;
    font-size: 22px;
    margin: 0;
    color: $white;
  }

  .datacenter-labels {
    margin: 15px 0 25px 0;
    margin-bottom: 30px;

    li {
      display: inline-block;
      line-height: 28px;
      height: 26px;
      padding: 0 15px;
      border: 1px solid #e1e1e1;
      border-radius: 25px;
      font-size: 13px;
      margin-right: $gap-s;
      &:last-child { margin: 0 }
    }
  }

  .nutanix-alert {
    height: 90px;
    border: 1px solid rgba(93, 103, 255, 0.3);
    background-color: #212643;
    box-shadow: 0px 0px 15px rgba(93, 103, 255, 0.2);
    border-radius: $radius-m;
    margin-bottom: 40px;
    padding: 0 $gap-s;
    display: grid;
    grid-template-columns: 125px 125px 125px 125px;
    align-items: center;

    .alert-content {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      position: relative;
      color: $white;

      &::after {
        content: '';
        position: absolute;
        height: $gap-m;
        width: 1px;
        right: 0;
        background-color: #303555;
      }
      &:last-child { &::after { content: none } }

      span {
        font-size: 13px;
        color: #E1E1E1;
        display: block;
        margin-bottom: $gap-s;
      }

      strong {
        font-size: 16px;
        &.-critical { color: $main-red }
        &.-warning { color: $yellow }
      }
    }
  }

  // ====
  // ====
  // ====

  .small-tit {
    color: $white;
    font-size: 16px;
    padding-bottom: 5px;
    border-bottom: 1px solid #2B2D51;
    margin-bottom: $gap;

    b { font-weight: 300; }
  }

  .cluster-usage {
    margin-bottom: 50px;

    .usage-list {
      li {
        display: flex;
        align-items: center;
        justify-content: space-between;

        &:nth-child(2) { margin: 20px 0; }

        > strong { flex: 0 0 80px; }

        .progress { flex: 0 0 380px; }

        .text {
          display: block;
          margin-left: $gap-m;
          strong {
            font-weight: bold;
            font-size: 20px;
          }
        }
      }
    }
  }

  .vertualization-quota-rate {
    .rate-chart {
      padding: $gap;
      display: flex;
      align-items: center;
      justify-content: space-between;

      > li {
        display: flex;
        align-items: center;
        flex-direction: column;
      }

      .graph {
        position: relative;

        .text {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          font-size: 16px;
          font-weight: normal;

          &.-na { color: $input-placeholder }

          small {
            display: block;
            font-size: 11px;
            color: $input-placeholder;
            margin-bottom: 3px;
          }

          b {
            font-size: 22px;
            color: $white;
          }
        }
      }
    }

    .virtualization-info {
      text-align: center;
      width: 95%;

      strong {
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 12px;
          font-weight: 400;
          display: block;
          margin-right: 5px;
          color: $primary;
          height: 15px;
          display: flex;
          align-items: center;
        }
      }

      .rank {
        margin-top: 11px;
        font-size: 13px;
        text-decoration: underline;
      }

      .-empty {
        height: 25px;
      }
    }
  }
}
</style>

<style lang="scss">
.cluster-index-wrapper {
  .el-progress-bar__inner { background: $sea-blue; box-shadow: 0px 0px 10px rgba(25, 119, 210, 0.5); }
  .is-warning { .el-progress-bar__inner { background: $yellow; box-shadow: 0px 0px 10px rgba(206, 125, 59, 0.5); } }
  .is-exception { .el-progress-bar__inner { background: $main-red; box-shadow: 0px 0px 10px rgba(205, 83, 158, 0.5); } }

  .el-progress-circle {
    svg {
      overflow: visible;
    }
  }

  .el-progress-circle__track { stroke: rgba(120, 123, 255, 0.28); }
  .el-progress-bar__outer { background-color: #292C51; overflow: visible }

  .el-progress-circle__path {
    stroke: $sea-blue;
    filter: drop-shadow(0px 0px 10px rgba(25, 119, 210, 0.5));
  }
  .is-exception {
    .el-progress-circle__path {
      stroke: $main-red;
      filter: drop-shadow(0px 0px 10px rgba(206, 125, 59, 0.5));
     }
  }
  .is-warning {
    .el-progress-circle__path {
      stroke: $yellow;
      filter: drop-shadow(0px 0px 10px rgba(206, 125, 59, 0.5));
    }
  }
}

.el-tooltip__popper.is-light {
  &.disk-tooltip-content {
    width: 210px;
    text-align: center;
    font-size: 12px;
    font-weight: 400;
    padding: $gap-s $gap;
  }
}

</style>
