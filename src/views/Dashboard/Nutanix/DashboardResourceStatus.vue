<!--
  * 파일명 : DashboardResourceStatus.vue
  * 파일 기능 : 데이터센터 내부 클러스터별 자원 현황 (할당량 + 사용률) Bar 그래프
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 Update: 대시보드 가상화율만 임계치 설정
 -->

<template>
  <section
    class="dashboard-resource-trend"
    v-loading="loading"
  >
    <article class="chart-area">
      <div class="label-wrapper flex-wrap">
        <h6 class="label-title">
          {{ $t('main.DASHBOARD.vCpuVirtualRate') }}
        </h6>
        <div class="-labels flex-wrap">
          <chart-label
            v-for="label in vcpuLabels"
            :key="label.color"
            :label="$t(label.keyPath) || label.label"
            :color="label.color"
          />
        </div>
      </div>

      <div class="chart-wrap">
        <cmp-chart
          :item-formatter="vcpuIF"
          v-if="vcpuData.length"
          :height="setBarChartHeight(vcpuData)"
          :items-source="vcpuData"
          :initialized="initVcpuChart"
          binding-x="clusterName"
          chart-type="Bar"
          :chart-binding="vcpuChartBinding"
          :palette="['rgba(137, 211, 240, 1)', 'rgba(217, 82, 82, 1)']"
          :y-axis-line="true"
          :x-major-grid="true"
          :y-major-grid="false"
          :tooltip-content="tooltipFormat"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </article>
    <!-- /. Vcpu 가상화율 -->

    <article class="chart-area">
      <div class="label-wrapper flex-wrap">
        <h6 class="label-title">
          {{ $t('main.DASHBOARD.vCpuUtil') }}
        </h6>
        <small style="display: block; height: 25px;" />
      </div>

      <div class="chart-wrap">
        <cmp-chart
          :item-formatter="vcpuIF"
          v-if="vcpuUsageData.length"
          :height="setBarChartHeight(vcpuUsageData)"
          :items-source="vcpuUsageData"
          :initialized="initVcpuChart"
          binding-x="clusterName"
          chart-type="Bar"
          :chart-binding="vcpuChartBinding"
          :palette="['rgba(137, 211, 240, 1)', 'rgba(217, 82, 82, 1)']"
          :y-axis-line="true"
          :x-major-grid="true"
          :y-major-grid="false"
          :tooltip-content="tooltipFormat"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </article>
    <!-- /. Vcpu 사용률 -->

    <article class="chart-area">
      <div class="label-wrapper flex-wrap">
        <h6 class="label-title">
          {{ $t('main.DASHBOARD.memoryQuota') }}
        </h6>
        <div class="-labels flex-wrap -flex-end">
          <chart-label
            v-for="label in memoryLabels"
            :key="label.color"
            :label="$t(label.keyPath) || label.label"
            :color="label.color"
          />
        </div>
      </div>

      <div class="chart-wrap">
        <cmp-chart
          :item-formatter="memoryIF"
          v-if="memoryData.length"
          :height="setBarChartHeight(memoryData)"
          :items-source="memoryData"
          :initialized="initMemoryChart"
          binding-x="clusterName"
          chart-type="Bar"
          :chart-binding="memoryChartBinding"
          :palette="['rgba(141, 208, 191, 1)']"
          :y-axis-line="true"
          :x-major-grid="true"
          :y-major-grid="false"
          :tooltip-content="tooltipFormat"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </article>
    <!-- /. 메모리 할당량 -->

    <article class="chart-area">
      <div class="label-wrapper flex-wrap">
        <h6 class="label-title">
          {{ $t('main.DASHBOARD.memoryUtil') }}
        </h6>
        <small style="display: block; height: 25px;" />
      </div>

      <div class="chart-wrap">
        <cmp-chart
          :item-formatter="memoryIF"
          v-if="memoryUsageData.length"
          :height="setBarChartHeight(memoryUsageData)"
          :items-source="memoryUsageData"
          :initialized="initMemoryChart"
          binding-x="clusterName"
          chart-type="Bar"
          :chart-binding="memoryChartBinding"
          :palette="['rgba(141, 208, 191, 1)']"
          :y-axis-line="true"
          :x-major-grid="true"
          :y-major-grid="false"
          :tooltip-content="tooltipFormat"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </article>
    <!-- /. 메모리 사용률 -->

    <article class="chart-area">
      <div class="label-wrapper flex-wrap">
        <h6 class="label-title">
          {{ $t('main.DASHBOARD.diskQuota') }}
        </h6>
        <div class="-labels flex-wrap -flex-end">
          <chart-label
            v-for="label in diskLabels"
            :key="label.color"
            :label="$t(label.keyPath) || label.label"
            :color="label.color"
          />
        </div>
      </div>

      <div class="chart-wrap">
        <cmp-chart
          :item-formatter="diskIF"
          v-if="diskData.length"
          :height="setBarChartHeight(diskData)"
          :items-source="diskData"
          :initialized="initVcpuChart"
          binding-x="clusterName"
          chart-type="Bar"
          :chart-binding="vcpuChartBinding"
          :palette="['rgba(137, 211, 240, 1)', 'rgba(217, 82, 82, 1)']"
          :y-axis-line="true"
          :x-major-grid="true"
          :y-major-grid="false"
          :tooltip-content="tooltipFormat"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </article>
    <!-- /. Disk 할당량 -->

    <article class="chart-area">
      <div class="label-wrapper flex-wrap">
        <h6 class="label-title">
          {{ $t('main.DASHBOARD.diskUtil') }}
        </h6>
        <small style="display: block; height: 25px;" />
      </div>

      <div class="chart-wrap">
        <cmp-chart
          :item-formatter="diskIF"
          v-if="diskUsageData.length"
          :height="setBarChartHeight(diskUsageData)"
          :items-source="diskUsageData"
          :initialized="initVcpuChart"
          binding-x="clusterName"
          chart-type="Bar"
          :chart-binding="vcpuChartBinding"
          :palette="['rgba(137, 211, 240, 1)', 'rgba(217, 82, 82, 1)']"
          :y-axis-line="true"
          :x-major-grid="true"
          :y-major-grid="false"
          :tooltip-content="tooltipFormat"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </article>
    <!-- /. Disk 사용률 -->
  </section>
</template>

<script>
import ChartLabel from './ChartLabel'
import ClusterUsageMixin from './DashboardRegion/ClusterUsageMixin'

export default {
  name: 'DashboardResourceStatus',
  components: {
    'chart-label': ChartLabel
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
  created () {
    this.init(this.rawClusters)
  },
  methods: {
    async init (rawClusters = this.rawClusters) {
      const chartDatas = await this.getClusterUsageLists(rawClusters)
      const { vcpuData, vcpuUsageData, memoryData, memoryUsageData, diskData, diskUsageData } = chartDatas

      this.vcpuData = [...vcpuData]
      this.vcpuUsageData = [...vcpuUsageData]
      this.memoryData = [...memoryData]
      this.memoryUsageData = [...memoryUsageData]
      this.diskData = [...diskData]
      this.diskUsageData = [...diskUsageData]
    },

    // ===
    // ===
    // ===

    initVcpuChart (flex) {
      this.vcpuChart = flex
    },
    initMemoryChart (flex) {
      this.memoryChart = flex
    },
    /**
     * 여유/적정 판단 및 컬러 설정
     * @param { engine, ht, defaultR } - wijmo itemFormatter paramter
     * @param data 세팅해줄 데이터값
     */
    setIF ({ engine, ht, defaultR }, data) {
      const standard1 = ht.item.standard1
      const standard2 = ht.item.standard2

      if (ht.y < standard1) { // 여유
        engine.stroke = data.properColor
        engine.fill = data.properColor
      } else if (ht.y > standard1 && ht.y <= standard2) { // 적정
        engine.stroke = '#F4A462'
        engine.fill = '#F4A462'
      } else if (ht.y > standard2) { // 경고
        engine.stroke = '#FA5657'
        engine.fill = '#FA5657'
      }

      if (!standard1 && !standard2) {
        engine.stroke = data.properColor
        engine.fill = data.properColor
      }

      defaultR()
    },
    vcpuIF (engine, ht, defaultR) {
      const itemFormatterData = { properColor: '#1977D2' }
      return this.setIF({ engine, ht, defaultR }, itemFormatterData)
    },
    memoryIF (engine, ht, defaultR) {
      const itemFormatterData = { properColor: '#1977D2' }
      return this.setIF({ engine, ht, defaultR }, itemFormatterData)
    },
    diskIF (engine, ht, defaultR) {
      const itemFormatterData = { properColor: '#1977D2' }
      return this.setIF({ engine, ht, defaultR }, itemFormatterData)
    },
    /**
     * 툴팁 설정
     */
    tooltipFormat (ht) {
      return this.setTooltip(ht, { color: '#1977D2' })
    },
    setTooltip (ht, { color }) {
      const exception = '#F4A462' // 경고
      const warning = '#FA5657' // 위험

      const standard1 = ht.item.standard1
      const standard2 = ht.item.standard2

      let degree = [this.$t('main.DASHBOARD.relax'), color] // 기본
      if (standard1 && standard1) {
        if (ht.y > standard1 && ht.y <= standard2) degree = ['경고', exception]
        else if (ht.y > standard2) degree = [this.$t('main.DASHBOARD.excess'), warning]
      }

      return this.ttContents({
        name: ht.item.clusterName,
        color: degree[1],
        deg: degree[0],
        value: ht.value
      })
    },
    ttContents (data) {
      const { name, color, value } = data
      const isFloat = Number(value % 1 === 0 ? value : value.toFixed(2)).toLocaleString()
      return `<span>${name} <b style="color: ${color}">${isFloat}%</b> </span>`
    }
  },
  data () {
    return {
      loading: false,
      elements: null,
      vcpuData: [],
      vcpuUsageData: [],
      vcpuLabels: [
        { label: '여유', color: '#1977D2', keyPath: 'main.DASHBOARD.relax' },
        { label: '초과', color: '#FA5657', keyPath: 'main.DASHBOARD.excess' }
      ],
      memoryData: [],
      memoryUsageData: [],
      memoryLabels: [
        { label: '여유', color: '#1977D2', keyPath: 'main.DASHBOARD.relax' },
        { label: '초과', color: '#FA5657', keyPath: 'main.DASHBOARD.excess' }
      ],
      diskData: [],
      diskUsageData: [],
      diskLabels: [
        { label: '여유', color: '#1977D2', keyPath: 'main.DASHBOARD.relax' },
        { label: '초과', color: '#FA5657', keyPath: 'main.DASHBOARD.excess' }
      ],
      cluster: '',
      vcpuChartBinding: [{ name: 'vCPU 가상화율', binding: 'rate' }],
      memoryChartBinding: [{ name: '메모리 할당량', binding: 'rate' }],
      setBarChartHeight: (data) => {
        // 1개: 55, 2개: 35, 3개: 30, 4개: 25
        const times = { 1: 55, 2: 39, 3: 30, 4: 25 }
        const height = data.length < 5 ? times[data.length] : 20

        return data.length * height
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .dashboard-resource-trend {
    display: grid;
    grid-template-columns: repeat(2, calc(50% - 30px));
    grid-template-rows: repeat(3, 1fr);
    column-gap: $gap-m;
    row-gap: $gap-m;
    height: inherit;

    .chart-area {
      display: flex;
      flex-direction: column;

      .label-wrapper {
        margin-bottom: $gap;
        justify-content: space-between;
        > .label-title {
          margin-bottom: $gap-s;
          color: $light-gray;
          height: 16px;
          font-size: 16px;
          font-weight: bold;
          font-style: normal;
          letter-spacing: -0.4px;
          color: #b4b4b4;
        }
      }
      .chart-wrap {
        // height: 130px;
        flex: 1 1 auto;
        max-height: 180px;
        overflow-y: auto;
      }
    }
  }
</style>
