<template>
  <div
    class="chart-area"
    :style="'noborder: 1px solid #E1E1E1 !important'"
  >
    <div class="set-option">
      <ul class="legends">
        <li
          v-for="{ name, fill } in chartLegend"
          :key="name"
        >
          <span
            class="circle"
            :style="`border: 3px solid ${fill}`"
          />
          <span class="name">{{ name }}</span>
        </li>
      </ul>
      <!-- /. 범례 -->
      <el-radio-group
        class="radio-switch-group"
        v-model="LineOrBar"
      >
        <el-radio-button :label="'Line'">
          {{ $v('선 그래프') }}
        </el-radio-button>
        <el-radio-button :label="'Bar'">
          {{ $v('막대 그래프') }}
        </el-radio-button>
      </el-radio-group>
      <!-- /. 그래프 스타일 선택 -->
    </div>
    <template
      v-if="graphOption.stacking==='Stacked'"
    >
      <cmp-stacked-chart
        v-loading="isLoading"
        :items-source="data.length > 0 ? data : initData"
        :initialized="initChart"
        binding-x="date"
        selection-mode="Point"
        :chart-binding="graphChartBinding"
        :stacking="graphOption.stacking"
        :chart-type="graphOption.graphType"
        :tooltip-content="tooltipContent"
        :axis-style="axisStyle"
        :height="chartHeight"
        :palette="graphChartBinding.map((itm) => itm.splineStyle.symbolStyle.fill)"
      />
    </template>
    <template v-else>
      <cmp-chart
        v-loading="isLoading"
        :items-source="data"
        :initialized="initChart"
        binding-x="date"
        selection-mode="Point"
        :chart-binding="graphChartBinding"
        :stacking="graphOption.stacking"
        :chart-type="graphOption.graphType"
        :tooltip-content="tooltipContent"
        :axis-style="axisStyle"
        :height="chartHeight"
      />
    </template>
  </div>
</template>

<script>
// import '@grapecity/wijmo.styles/wijmo.css'
import '@grapecity/wijmo'
import '@grapecity/wijmo.chart'
// import _CMPChart from '@/components/Wijmo/CMPChart/CMPChart.vue'
// import _CMPStackedChart from '@/components/Wijmo/CMPChart/CMPStackedChart.vue'

export default {
  name: 'DashboardBillingChart',
  components: {
    // 'cmp-stacked-chart': CMPStackedChart
  },
  async mounted () {
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    binding: {
      type: Array,
      default: () => []
    },
    tooltip: {
      type: Array,
      default: () => []
    },
    tooltipUnit: {
      type: String,
      default: null
    },
    chartHeight: {
      type: Number,
      default: 280
    },
    axisStyle: {
      type: String,
      default: ''
    },
    isLoading: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      async handler (data) {
        await this.initDashboard()
      }
    },
    LineOrBar: {
      immediate: true,
      handler (LineOrBar) {
        let chartType = 'LineSymbols'
        this.graphOption = {
          graphType: 'Column',
          stacking: 'None'
        }
        if (LineOrBar.includes('Bar')) {
          chartType = undefined // 막대 타입일때
          this.graphOption = {
            graphType: 'Column',
            stacking: 'Stacked'
          }
        } else {
          this.graphChartBinding = [ // 그래프 차트 바인딩. https://www.grapecity.com/wijmo/demos/Chart/Bar/StackedBar/purejs
            ...this.binding.map((itm) => {
              itm.chartType = chartType
            })
          ]
        }
        // console.log('binding:', LineOrBar, this.binding)
        this.graphChartBinding = this.binding
      }
    }
  },
  computed: {
    /**
     * 차트 범례 설정
     * graphChartBinding 을 이용하여 범례를 설정합니다.
     * @return Array
     */
    chartLegend () {
      return this.graphChartBinding.map(({ name, splineStyle }) => {
        const { fill } = splineStyle.symbolStyle
        return { name, fill }
      })
    }
  },
  methods: {
    async initDashboard () {
      // console.log('graphData:', this.data)
      this.LineOrBar = 'Line'
      if (this.data.length < 1) {
        const initGraph = Array.from({ length: 12 }, (_, idx) => {
          const initItem = {
            date: `${idx + 1}월`
          }
          const targets = this.tooltip
          targets.map((itm) => {
            initItem[itm] = 0
          })
          return initItem
        })
        this.initData = initGraph
      }
    },
    tooltipContent (row) {
      const targets = this.tooltip
      const item = row.item
      let content = `${item.date}분 청구금</br>`
      targets.map((itm) => {
        if (this.tooltipUnit === '원') {
          content += `</br>${itm}: ${item[itm].toLocaleString()} 원`
        } else if (this.tooltipUnit === '$') {
          content += `</br>${itm}: $ ${item[itm].toLocaleString()}`
        }
      })
      return content
    },
    /**
     * Series Chart 설정
     */
    initChart (chart) {
      for (let i = 0; i < chart.series.length; i++) {
        chart.series[i].style = { strokeWidth: 1 }
      }
    }
  },
  data: () => ({
    expectBillings: null,
    LineOrBar: null, // 그래프 옵션
    graphOption: {
      graphType: null,
      stacking: null
    },
    initData: [],
    graphData: [ // 그래프 데이터
    ],
    graphChartBinding: [ // 그래프 차트 바인딩
    ]
  })
}
</script>

<style lang="scss" scoped>
.integrated-dashboard {
  &-wrapper {

    .set-option {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      // margin-bottom: 15px;

      .legends {
        display: flex;
        align-items: center;
        margin-right: $gap-m;

        li {
          display: flex;
          align-items: center;
          margin-left: $gap;
        }

        .circle {
          display: block;
          width: 15px; height: 15px;
          border-radius: 50%;
          margin-right: 5px;
          box-sizing: border-box;
        }
      }
    }

    .radio-switch-group {
      &::v-deep {
        height: 30px;

        input:checked + span {
          height: 27px;
        }

        span {
        }

        .el-radio-button.is-active
        .el-radio-button__inner:hover { color: #333; }
      }
    }
  }

  &-counter {
    display: grid;
    row-gap: 15px;
  }
}
</style>
