<!--
  * 파일명 : DashboardResourceTrend.vue
  * 파일 기능 : 데이터센터 내부 클러스터별 자원 트렌드 Bar 차트 (월 기준)
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 add: 로딩바 추가
 -->

<template>
  <div v-loading="loading">
    <div class="trend-header flex-wrap">
      <h3 class="section-title">
        {{ $t('main.DASHBOARD.resTrend') }}
        <!-- 자원 트렌드 그래프 -->
      </h3>
    </div>

    <div class="dashboard-resource-trend flex-wrap -space-between">
      <span class="sync-time">{{ $v('동기화 시간 :') }} {{ time }}</span>
      <!-- /. 동기화 시간 -->

      <article class="chart-area">
        <p class="label-title -space">
          {{ $v('vCPU 신청량') }}
          <span v-if="vcpuData.length">
            ({{ setDateFormat2(vcpuData) }})
          </span>
        </p>
        <cmp-chart
          v-if="vcpuData.length"
          :items-source="vcpuData"
          :initialized="initVcpuChart"
          binding-x="month"
          :height="250"
          :tooltip-content="tooltipContent"
          :chart-binding="vcpuChartBinding"
          :x-label-angle="0"
          :palette="['rgba(234, 83, 82, 1)', 'rgba(234, 83, 82, 0.3)']"
          :x-axis-line="true"
          stacking="Stacked"
          y-title="신청량 (Core)"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </article>
      <!-- /. Vcpu 가상화율 -->

      <article class="chart-area">
        <h6 class="label-title -space">
          {{ $v('메모리 신청량') }}
          <span v-if="memoryData.length">
            ({{ setDateFormat2(memoryData) }})
          </span>
        </h6>
        <cmp-chart
          v-if="memoryData.length"
          :items-source="memoryData"
          :initialized="initMemoryChart"
          binding-x="month"
          :height="250"
          :tooltip-content="tooltipContent"
          :chart-binding="memoryChartBinding"
          :x-label-angle="0"
          :palette="['rgba(228, 150, 75, 1)', 'rgba(228, 150, 75, 0.3)']"
          :x-axis-line="true"
          stacking="Stacked"
          y-title="신청량 (TB)"
        />
        <div
          v-else
          class="empty-zone"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </article>
      <!-- /. 메모리 할당량 -->

      <article class="chart-area">
        <h6 :class="['label-title', { '-space': !diskData.length}]">
          디스크 신청량
          <span v-if="diskData.length">
            ({{ setDateFormat2(diskData) }})
          </span>
        </h6>

        <div
          v-if="diskData.length"
          class="disk-graph"
        >
          <cmp-chart
            :items-source="diskData"
            :initialized="initDiskChart"
            binding-x="month"
            :height="250"
            :tooltip-content="tooltipContent"
            :chart-binding="diskChartBinding"
            :x-label-angle="0"
            :palette="['rgba(78, 174, 211, 1)', 'rgba(78, 174, 211, 0.3)']"
            :x-axis-line="true"
            stacking="Stacked"
            y-title="신청량 (TB)"
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

<script>import ConvertLangUtils from '@/components/Utils/ConvertLangUtils'
import API from '@sd-fe/cmp-core'

export default {
  name: 'DashboardVirtualization',
  props: {
    time: {
      type: String,
      default: undefined
    },
    region: {
      type: String,
      default: undefined
    },
    csp: {
      type: String,
      default: undefined
    }
  },
  mixins: [ConvertLangUtils],
  watch: {
    region (region) {
      this.getTrend1(region)
    }
  },
  methods: {
    /**
     * 트렌드 데이터
     */
    async getTrend1 (regionName) {
      const params = regionName === 'all' ? undefined : regionName
      try {
        this.loading = true
        const param = {
          regionName: params,
          moduleType: this.csp
        }
        const { data } = await API.aws.getTrendResources({ ...param })

        this.setRegionBasedData(data)
      } catch (error) {

      } finally {
        this.loading = false
      }
    },

    /**
     * 데이터 형식을 가공합니다.
     */
    setRegionBasedData (data) {
      const months = {}
      const types = ['disk', 'memory', 'vcpu']
      const keys = ['min', 'max', 'avg']

      // 전체 트렌드 그래프 순회
      data.forEach(({ projectIdx, trend: trends }) => {
        trends.forEach(({ createMonth, ...values }) => {
          if (!months[createMonth]) months[createMonth] = { ...values }
          else {
            // console.log(createMonth, values)

            // 각 disk/memory/vcpu 를 돌면서
            for (const type of types) {
              // min/max/avg 값을 누적으로 더함
              for (const key of keys) {
                const value = values[type][key]
                months[createMonth][type][key] += value

                // 🌸 디버깅용
                // if (createMonth === '2021-06' && type === 'vcpu' && key === 'min') {
                //   console.log(`${createMonth}.${type} += ${key}: ${value}`)
                //   test += value
                // }
              }
            }
          }
        })
      })

      return this.devideTrendData(months)
    },

    /**
     * 데이터의 GB / MB 확인합니다
     */
    devideTrendData (data) {
      // 일단 데이터 텅비우기
      this.vcpuData = []
      this.memoryData = []
      this.diskData = []

      // memory / disk
      const mb = data => {
        const value = this.$options.filters.MB(data).split(' ')
        return { val: Number(value[0]), unit: value[1] }
      }
      const gb = data => {
        const value = this.$options.filters.MB(data * 1024).split(' ')
        return { val: Number(value[0]), unit: value[1] }
      }

      // 데이터 세팅
      for (const createMonth in data) {
        const { vcpu, disk, memory } = data[createMonth]

        const month = this.convertMonth(Number(createMonth.split('-')[1]))
        const monthFormat = createMonth.replace('-', '.')

        const { min: memoryMin, max: memoryMax, avg: memoryAvg } = memory
        const { min: diskMin, max: diskMax, avg: diskAvg } = disk

        // { min, max, avg, minUnit, maxUnit, avgUnit }
        const vcpuData = { ...vcpu, minUnit: 'Core', maxUnit: 'Core', avgUnit: 'Core' }
        const memoryData = { min: mb(memoryMin).val, minUnit: mb(memoryMin).unit, max: mb(memoryMax).val, maxUnit: mb(memoryMax).unit, avg: mb(memoryAvg).val, avgUnit: mb(memoryAvg).unit }
        const diskData = { min: gb(diskMin).val, minUnit: gb(diskMin).unit, max: gb(diskMax).val, maxUnit: gb(diskMax).unit, avg: gb(diskAvg).val, avgUnit: gb(diskAvg).unit }

        this.vcpuData.push({ month, monthFormat, ...vcpuData, type: 'vcpu' })
        this.memoryData.push({ month, monthFormat, ...memoryData, type: 'memory' })
        this.diskData.push({ month, monthFormat, ...diskData, type: 'disk' })
      }

      // 날짜별로 sorting
      const sort = (a, b) => {
        if (a.monthFormat > b.monthFormat) return 1
        else if (a.monthFormat < b.monthFormat) return -1
        return 0
      }

      this.vcpuData.sort(sort)
      this.memoryData.sort(sort)
      this.diskData.sort(sort)
    },

    /**
     * 툴팁 설정
     */
    tooltipContent (ht) {
      const { type, min, max, avg, minUnit, maxUnit, avgUnit } = ht.item
      const color = {
        vcpu: '#EA5352',
        memory: '#E4964B',
        disk: '#4EAED3'
      }[type]

      const locale = data => data.toLocaleString()

      return `<p style="color: ${color}"><b> ${locale(avg)} ${avgUnit}</b> <span>(Min : ${locale(min)} ${minUnit}, Max : ${locale(max)} ${maxUnit})</span></p>`
    },

    setDateFormat2 (data) {
      const startMonth = data[0].monthFormat
      const endMonth = data[data.length - 1].monthFormat
      return `${startMonth} ~ ${endMonth}`
    },

    initVcpuChart (flex) {
      this.vcpuChart = flex
    },
    initMemoryChart (flex) {
      this.memoryChart = flex
    },
    initDiskChart (flex) {
      this.diskChart = flex
    }
  },
  data () {
    return {
      loading: false,
      vcpuData: [],
      memoryData: [],
      diskData: [],

      vcpuChartBinding: [
        { name: 'min', binding: 'min' },
        { name: 'max', binding: 'max' },
        { name: 'avg', binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 2 } }
      ],
      memoryChartBinding: [
        { name: 'min', binding: 'min' },
        { name: 'max', binding: 'max' },
        { name: 'avg', binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 2 } }
      ],
      diskChartBinding: [
        { name: 'min', binding: 'min' },
        { name: 'max', binding: 'max' },
        { name: 'avg', binding: 'avg', color: '#FFFFFF', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#FFFFFF', stroke: '#FFFFFF' }, symbolSize: 2 } }
      ]
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
  }
  .dashboard-resource-trend {
    position: relative;
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
