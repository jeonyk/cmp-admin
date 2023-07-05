<!--
  * 파일명 : DashboardResourceTrend.vue
  * 파일 기능 : 데이터센터 내부 클러스터별 자원 트렌드 Bar 차트 (월 기준)
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 add: 로딩바 추가
 -->

<template>
  <div>
    <div class="trend-header flex-wrap">
      <h3 class="section-title">
        {{ $t('main.DASHBOARD.resTrend') }}
        <!-- 자원 트렌드 그래프 -->
      </h3>

      <div class="chart-options">
        <el-select
          v-model="trendOptionValue"
          :placeholder="$t('main.DASHBOARD.setCluster')"
          @change="filteringTrendByCluster"
          :popper-append-to-body="false"
        >
          <el-option
            v-for="item in options"
            :key="item.clusterName"
            :label="item.clusterName"
            :value="item.clusterUuid"
          />
        </el-select>
      </div>
    </div>

    <div class="dashboard-resource-trend flex-wrap -space-between">
      <article
        v-loading="vcpuLoading"
        class="chart-area"
      >
        <p class="label-title -space">
          {{ $t('main.DASHBOARD.vCpuVirtualRate') }}
          <!-- vCPU 가상화율 -->
          <span v-if="minDate && (setDateFormat(minDate) && setDateFormat(maxDate))">
            ({{ setDateFormat(minDate) }} ~ {{ setDateFormat(maxDate) }})
          </span>
        </p>
        <cmp-chart
          v-if="vcpuData.length"
          :items-source="vcpuData"
          :initialized="initVcpuChart"
          binding-x="date"
          :height="250"
          :tooltip-content="tooltipContent"
          :chart-binding="vcpuChartBinding"
          :x-label-angle="0"
          :palette="['rgba(238, 150, 89, 1)']"
          :x-axis-line="true"
          :y-title="$t('main.DASHBOARD.virtualRate') + '(%)'"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </article>
      <!-- /. Vcpu 가상화율 -->

      <article
        v-loading="memoryLoading"
        class="chart-area"
      >
        <h6 class="label-title -space">
          {{ $t('main.DASHBOARD.memoryQuota') }}
          <span v-if="minDate && (setDateFormat(minDate) && setDateFormat(maxDate))">
            ({{ setDateFormat(minDate) }} ~ {{ setDateFormat(maxDate) }})
          </span>
        </h6>
        <cmp-chart
          v-if="memoryData.length"
          :items-source="memoryData"
          :initialized="initMemoryChart"
          binding-x="date"
          :height="250"
          :tooltip-content="tooltipContent"
          :chart-binding="memoryChartBinding"
          :x-label-angle="0"
          :palette="['rgba(115, 161, 245, 1)']"
          :x-axis-line="true"
          y-title="Memory(%)"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </article>
      <!-- /. 메모리 할당량 -->

      <article
        v-loading="diskLoading"
        class="chart-area"
      >
        <h6 :class="['label-title', { '-space': !diskData.length}]">
          {{ $t('main.DASHBOARD.vDiskQuota') }}
          <span
            v-if="minDate && (setDateFormat(minDate) && setDateFormat(maxDate))"
          >
            ({{ setDateFormat(minDate) }} ~ {{ setDateFormat(maxDate) }})
          </span>
        </h6>

        <div
          v-if="diskData.length"
          class="disk-graph"
        >
          <div class="-labels flex-wrap -flex-end">
            <chart-label
              :label="$t('main.DASHBOARD.total')"
              color="#98D3DF"
            />
            <chart-label
              :label="$t('main.DASHBOARD.usage')"
              color="#16A3BF"
            />
          </div>
          <!-- /. 전체량, 사용량 -->

          <cmp-chart
            :items-source="diskData"
            :initialized="initDiskChart"
            binding-x="date"
            :height="250"
            :tooltip-content="diskTooltipContent"
            :chart-binding="virtualDiskChart"
            :x-label-angle="0"
            :palette="['rgba(22, 163, 191, 1)', 'rgba(152, 211, 223, 1)']"
            :x-axis-line="true"
            y-title="Disk(TB)"
            stacking="Stacked"
          />
        </div>
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import ChartLabel from './ChartLabel'
import API from '@sd-fe/cmp-core'

export default {
  name: 'DashboardVirtualization',
  components: {
    'chart-label': ChartLabel
  },
  props: {
    region: {
      type: String,
      default: undefined
    },
    csp: {
      type: String,
      default: undefined
    }
  },
  watch: {
    region (region) {
      this.getTrend()
      this.trendFilterBySource(region)
    },
    trendCpuData (data) {
      this.vcpuData = this.setTooltipColor(data, '#EE9659')
      this.vcpuLoading = false
    },
    trendMemoryData (data) {
      this.memoryData = this.setTooltipColor(data, '#73A1F5')
      this.memoryLoading = false
    },
    trendDiskData (data) {
      this.diskData = this.setDiskTooltipColor(data, '#16A3BF')
      this.diskLoading = false
    }
  },
  methods: {
    async getTrend () {
      // console.log('%c @@ getTrend', 'color: #FC94FF')
      const params = {
        moduleType: this.csp
      }
      const response = await API.metering.getTrend({ ...params })

      // 초기에 한번만 데이터 세팅하고, 나머지는 프론트에서 ui가 변경될 때만 사용합니다.
      this.setTrend(response.data)

      const dates = []
      response.data.forEach(element => {
        dates.push(new Date(element.date))
      })

      this.minDate = new Date(Math.min.apply(null, dates))
      this.maxDate = new Date(Math.max.apply(null, dates))
    },
    /**
     * [자원 트렌드] 데이터 세팅
     */
    setTrend (data) {
      const trendCpuList = []
      const trendMemList = []
      const trendDiskList = []
      const allClusterNameList = []

      for (const d of data) {
        const { date, clusterName, clusterUuid, cpuUsagePct, memUsagePct, region } = d
        const dataObj = {
          date: new Date(date).getMonth() + 1 + '월',
          clusterName,
          clusterUuid,
          region
        }
        const cpuObj = { ...dataObj, rate: cpuUsagePct }
        const memObj = { ...dataObj, rate: memUsagePct }

        trendCpuList.push(cpuObj)
        trendMemList.push(memObj)

        let diskObj = {}
        for (var i = 0; i < 10; i++) {
          d.diskTotSize = d.diskTotSize / 1024
          d.diskUseSize = d.diskUseSize / 1024
          if (d.diskTotSize > 0 && d.diskTotSize < 1024) {
            diskObj = {
              date: new Date(d.date).getMonth() + 1 + '월',
              all: d.diskTotSize,
              usage: d.diskUseSize,
              clusterName,
              clusterUuid,
              region
            }
            break
          }
        }
        trendDiskList.push(diskObj)

        const clusterNameObj = { clusterName, region, clusterUuid }
        allClusterNameList.push(clusterNameObj)
      }

      this.clusterNameList = allClusterNameList

      // 여기서 평균을 구해야겠네?
      const avgCpuData = this.getMonthAvg(trendCpuList)
      const avgMemoryData = this.getMonthAvg(trendMemList)
      const avgDiskData = this.getMonthAvg(trendDiskList)

      this.rawTrendCpuData = avgCpuData
      this.rawTrendMemoryData = avgMemoryData
      this.rawTrendDiskData = avgDiskData

      this.trendFilterBySource(this.region)
    },
    /**
     * [자원 리젼] > 김포|송도|부산... 선택시 발생하는 이벤트
     * @param {String} center
     */
    trendFilterBySource (region = this.region) {
      // const filteredclsNames = region ? this.clusterNameList.filter(cluster => cluster.region === region) : this.clusterNameList
      const filteredclsNames = region === 'all' ? [...this.clusterNameList] : this.clusterNameList.filter(cluster => cluster.region === region)
      const clusterName = Array.from(new Set(filteredclsNames.map(cluster => cluster.clusterUuid)))

      // [클러스터] 선택옵션 세팅
      this.options = clusterName.map(d => {
        let clusterName
        filteredclsNames.forEach(list => {
          if (list.clusterUuid === d) clusterName = list.clusterName
          return false
        })
        return { clusterName, clusterUuid: d, region }
      })

      // 전체
      this.options.unshift({ clusterName: this.$t('main.DASHBOARD.all'), clusterUuid: 'all', region: 'all' })

      // 자원트렌드 > 클러스터 초기값 세팅 => 초기값은 '전체'로..!
      if (this.options.length) this.trendOptionValue = this.options[0].clusterUuid
      else this.trendOptionValue = ''

      this.filteringTrendByCluster(this.trendOptionValue)
    },
    /**
     * [클러스터 옵션 리스트] 선택시 발생하는 이벤트
     * @param {String} clusterUuid
     */
    filteringTrendByCluster (clusterUuid) {
      if (!clusterUuid) {
        this.trendCpuData = []
        this.trendMemoryData = []
        this.trendDiskData = []
      } else if (clusterUuid === 'all') { // 전체
        this.trendCpuData = this.getAllMonthAvg(this.rawTrendCpuData, '#89d3f0')
        this.trendMemoryData = this.getAllMonthAvg(this.rawTrendMemoryData, '#8dd0bf')
        this.trendDiskData = this.getAllMonthAvg(this.rawTrendDiskData, '#878dff')
      } else { // 리스트 선택시
        this.trendCpuData = this.rawTrendCpuData.filter(cpu => cpu.clusterUuid === clusterUuid)
        this.trendMemoryData = this.rawTrendMemoryData.filter(mem => mem.clusterUuid === clusterUuid)
        this.trendDiskData = this.rawTrendDiskData.filter(disk => disk.clusterUuid === clusterUuid)
      }
    },
    /**
     * [클러스터 옵션 리스트] 가 '전체' 일 때 모든 데이터 월 평균을 구해서 입력
     * (전체 일땐 리전 전체 평균, 김포일땐 김포 전체 평균, 송도일땐 송도 전체 평균)
     */
    getAllMonthAvg (data, color) {
      const filteredcls = this.region === 'all' ? [...data] : data.filter(cluster => cluster.region === this.region)
      const dates = Array.from(new Set(filteredcls.map(cls => cls.date)))

      const allMonthAverage = dates.map(date => {
        const months = filteredcls.filter(cls => cls.date === date)
        const keys = Object.keys(months[0])

        // 평균값 계산중..
        const getAvg = (key) => months.map(cls => cls[key]).reduce((acc, curr) => acc + curr) / months.length

        if (keys.indexOf('all') === -1) {
          // 가상디스크 할당량 데이터 세팅
          return { date, color, avg: getAvg('rate'), rate: getAvg('rate') }
        } else {
          // vCPU 가상화율, 메모리 할당량 데이터 세팅
          return { date, color, avg: getAvg('all'), all: getAvg('all'), usage: getAvg('usage') }
        }
      })

      return allMonthAverage
    },
    getMonthAvg (data) {
      const avg = this.getAllMonthAvg(data)

      return data.map(item => {
        const result = { ...item }
        result.avg = avg.filter(d => d.date === item.date)[0]?.avg
        return result
      })
    },

    // =====
    // =====
    // =====
    // =====

    setTooltipColor (list, color) {
      return list.map(data => {
        data.color = color
        return data
      })
    },
    setDiskTooltipColor (list, color) {
      return list.map(data => {
        data.rate = data.all - data.usage
        data.color = color
        return data
      })
    },
    initVcpuChart (flex) {
      this.vcpuChart = flex
    },
    initMemoryChart (flex) {
      this.memoryChart = flex
    },
    initDiskChart (flex) {
      this.diskChart = flex
    },
    /**
     * 툴팁 설정
     */
    tooltipContent (ht) {
      const color = ht.name === this.$t('main.DASHBOARD.average') ? '#979797' : ht.item.color // 평균
      const date = `${ht.item.date} ${ht.name === this.$t('main.DASHBOARD.average') ? this.$t('main.DASHBOARD.average') : ''}`
      return `<span>${date}
        <b style="color: ${color}">${parseFloat(ht.y.toFixed(2)).toLocaleString()} %</b>
      </span>`
    },
    diskTooltipContent (ht) {
      const color = ht.name === this.$t('main.DASHBOARD.average') ? '#979797' : ht.item.color // 평균
      const date = `${ht.item.date} ${ht.name === this.$t('main.DASHBOARD.average') ? this.$t('main.DASHBOARD.average') : ''}`
      const total = ht.item.all
      const usage = ht.item.usage
      // const usage = ht.y // hover 된 막대의 값

      if (ht.name === this.$t('main.DASHBOARD.average')) {
        return `${date} <b style="color: ${color}"> ${parseFloat(ht.y.toFixed(2)).toLocaleString()}</b>`
      } else { // 전체량/평균량
        return `<span>
        ${this.$t('main.DASHBOARD.total')} <b style="color: #98D3E9">${parseFloat(total.toFixed(2)).toLocaleString()} TB</b> <br>
        ${this.$t('main.DASHBOARD.usage')} <b style="color: ${color}">${parseFloat(usage.toFixed(2)).toLocaleString()} TB</b>
        </span>`
      }
    },
    setDateFormat (date) {
      const getYearRange = date ? date.getFullYear() : ''
      const getDateRange = date ? date.getMonth() + 1 : ''

      if (isNaN(getYearRange) || isNaN(getDateRange)) return false
      return `${getYearRange}.${getDateRange}`
    }
  },
  data () {
    return {
      vcpuLoading: true,
      memoryLoading: true,
      diskLoading: true,
      vcpuData: [],
      memoryData: [],
      diskData: [],
      cluster: '',

      vcpuChartBinding: [
        { name: 'vCPU 가상화율', binding: 'rate' },
        { name: this.$t('main.DASHBOARD.average'), binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 3 } } // 평균
      ],
      memoryChartBinding: [
        { name: '메모리 할당량', binding: 'rate' },
        { name: this.$t('main.DASHBOARD.average'), binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 3 } } // 평균
      ],
      virtualDiskChart: [
        { name: this.$t('main.DASHBOARD.usage'), binding: 'usage' }, // 사용량
        { name: this.$t('main.DASHBOARD.total'), binding: 'rate' }, // 전체량
        { name: this.$t('main.DASHBOARD.average'), binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 3 } } // 평균
      ],

      options: {},
      trendOptionValue: '',
      minDate: null,
      maxDate: null,
      trendCpuData: [],
      trendMemoryData: [],
      trendDiskData: [],
      rawTrendCpuData: [],
      rawTrendMemoryData: [],
      rawTrendDiskData: [],
      clusterNameList: []
    }
  }
}
</script>
<style lang="scss" scoped>
  .trend-header {
    margin-bottom: 60px;

    .section-title {
      font-size: 24px;
      margin-right: $gap;
      color: $white;
    }

    .chart-options {
      width: 145px;
    }
  }
  .dashboard-resource-trend {
    .chart-area {
      height: 260px;
      flex: 0 0 440px;
      > .label-title {
        margin-bottom: $gap-s;
        color: $light-gray;
        height: 16px;
        font-size: 16px;
        font-weight: bold;
        font-style: normal;
        letter-spacing: -0.4px;
        color: #E1E1E1;
        span {
          font-family: 'Roboto';
          display: inline-block;
          line-height: 12px;
          font-weight: normal;
          font-size: 13px;
          letter-spacing: -0.4px;
        }
      }
      > .-space { margin-bottom: $gap; }

      .disk-graph {
        position: relative;
        .-labels {
          position: absolute;
          bottom: calc(100% + 10px); right: 0;
        }
      }
    }
  }
</style>
