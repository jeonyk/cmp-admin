<!--
  * 파일명 : CMPChart.vue
  * 파일 기능 : CMP 차트 컴포넌트
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-01-17
  * License By Shinsegae I&C
  * 2021-01-17 대시보드 수정
 -->

 <template>
  <div class="cmp-chart-wrap">
    <!-- {{ chartBinding }} -->
    <wj-flex-chart
      v-if="itemsSource"
      class="cmp-chart"
      ref="chart"
      :items-source="itemsSourceCollection"
      :item-formatter="initItemFormatter"
      :initialized="stacking==='Stacked'?null:init"
      :binding-x="bindingX"
      :chart-type="chartType"
      :id="id"
      :height="height"
      :header="header"
      :palette="palette"
      :interpolate-nulls="interpolateNulls"
      :legend-toggle="legendToggle"
      :style="`height: ${height}px`"
      :rendering="rendering"
      :rendered="rendered"
      :stacking="stacking"
      :selection-mode="selectionMode"
      :selection-changed="selectionChanged"
      :tooltip-content="tooltipContent"
    >
      <wj-flex-chart-plot-area :style="axisStyle" />
      <wj-flex-chart-legend :position="chartLegendPosition" />
      <wj-flex-chart-axis
        wj-property="axisX"
        :title="xTitle"
        :min="xMinMax.min"
        :max="xMinMax.max"
        :label-align="xAxisLabelAlign"
        :position="xAxisPosition"
        :label-angle="xLabelAngle"
        :axis-line="xAxisLine"
        :major-grid="xMajorGrid"
      />
      <!-- :item-formatter="xItemFormatter" -->
      <wj-flex-chart-axis
        wj-property="axisY"
        :title="yTitle"
        :min="yMinMax.min"
        :max="yMinMax.max"
        :label-align="yAxisLabelAlign"
        :item-formatter="yItemFormatter"
        :position="yAxisPosition"
        :axis-line="yAxisLine"
        :major-grid="yMajorGrid"
      />

      <wj-flex-chart-series
        v-for="c in chartBinding"
        :key="c.binding"
        :name="c.name"
        :binding="c.binding"
      />
      <wj-flex-chart-animation
        v-if="chartAnimation !== 'None'"
        :animation-mode="chartAnimation"
      />
    </wj-flex-chart>
    <template v-else>
      <div class="empty-data">
        {{ $v('데이터가 없습니다.') }}
      </div>
    </template>
  </div>
</template>
<script>
import * as wjCore from '@grapecity/wijmo'
import * as wjChart from '@grapecity/wijmo.chart'

export default {
  name: 'CMPChart',
  props: {
    chartBinding: {
      type: Array,
      required: true,
      default: () => []
      // { // 기본 데이터 형태
      //   name: 'vCPU 가상화율', binding: 'rate',
      //   chartType: 'SplineSymbols' // [옵션]
      //   splineStyle: { symbolStyle: { fill: 'red', stroke: 'gold' }, symbolSize: 1 } [spline] 사용시 - spline 스타일
      // }
    },
    rendering: {
      type: Function,
      default: undefined
    },
    rendered: {
      type: Function,
      default: undefined
    },
    itemsSource: { // 데이터
      type: Array,
      default: () => [],
      required: true
    },
    itemFormatter: {
      type: Function,
      default: undefined
    },
    initialized: {
      type: Function,
      default: () => {}
    },
    bindingX: {
      type: String,
      default: undefined,
      required: true
    },
    chartType: {
      type: String,
      default: 'Column',
      validator (value) {
        return ['Column', 'Bar', 'Area'].includes(value)
      }
    },
    adjustColWidth: { // Column 차트일 경우, width 를 조정할 것인지 설정합니다.
      type: Object,
      default: () => { return { set: true, width: 11 } }
      // set: width 조정 여부, width: 너비 크기
    },
    id: {
      type: String,
      default: ''
    },
    height: {
      type: Number,
      default: 300
    },
    header: {
      type: String,
      default: undefined
    },
    palette: {
      type: Array,
      default: () => [
        'rgba(50, 161, 255, 1)',
        'rgba(32, 208, 191, .8)',
        'rgba(47, 141, 250, .8)',
        'rgba(248, 199, 83, .8)',
        'rgba(236, 126, 48, .8)',
        'rgba(26, 168, 121, .8)',
        'rgba(21, 83, 182, .8)',
        'rgba(189, 65, 227, .8)',
        'rgba(204, 145, 124, .8)',
        'rgba(81, 109, 136, .8)'
      ]
    },
    // Line, Area 차트에서 끊어진 부분 연결 사용 여부
    interpolateNulls: {
      type: Boolean,
      default: true
    },
    // legend 토글 사용 여부
    legendToggle: {
      type: Boolean,
      default: false
    },
    // Stack 사용 여부, None=0, Stacked=1, Stacked100pc=2
    stacking: {
      type: String,
      default: 'None'
    },
    selectionMode: {
      type: String,
      default: 'None'
    },
    selectionChanged: {
      type: Function,
      default: () => {}
    },
    tooltipContent: {
      type: [Function, String, Number, Object, Array],
      default: undefined
    },

    // legend
    chartLegendPosition: {
      type: String,
      default: 'None',
      validator (value) {
        return ['None', 'Top', 'Bottom', 'Left', 'Right'].includes(value)
      }
    },
    // axis
    xTitle: {
      type: String,
      default: ''
    },
    yTitle: {
      type: String,
      default: ''
    },
    xLabelAngle: { // x축 라벨의 기울기를 조절합니다
      type: Number,
      default: undefined
    },
    xMinMax: {
      type: Object,
      default: () => { return { min: null, max: null } }
    },
    yMinMax: {
      type: Object,
      default: () => { return { min: null, max: null } }
    },
    xAxisLabelAlign: {
      type: String,
      default: undefined,
      validator (value) {
        return ['left', 'right'].includes(value)
      }
    },
    yAxisLabelAlign: {
      type: String,
      default: undefined,
      validator (value) {
        return ['top', 'bottom'].includes(value)
      }
    },
    xAxisPosition: {
      type: String,
      default: 'Bottom',
      validator (value) {
        return ['Top', 'Bottom', 'None'].includes(value)
      }
    },
    yAxisPosition: {
      type: String,
      default: 'Left',
      validator (value) {
        return ['Top', 'Left', 'None'].includes(value)
      }
    },
    xItemFormatter: {
      type: Function,
      default: () => { // 기본: 날짜(DATE)
        // if (this.bindingX === 'DATE') {
        //   console.log(this.bindingX)
        //   return 'DATE'
        // }
      }
    },
    yItemFormatter: {
      type: Function,
      default: undefined
    },

    // 마커 설정
    markerLines: {
      type: String,
      default: 'None',
      validator (value) {
        return ['None', 'Both', 'Vertical', 'Horizontal'].includes(value)
      }
    },
    markerInteraction: {
      type: String,
      default: 'None',
      validator (value) {
        return ['None', 'Move', 'Drag'].includes(value)
      }
    },
    markerContent: {
      type: Function,
      default: undefined
    },

    // 차트와 라벨이 인접한 라인(시작지점)을 추가할 것인지?
    xAxisLine: {
      type: Boolean,
      default: false
    },
    yAxisLine: {
      type: Boolean,
      default: false
    },
    // 차트 내부 가이드 라인 ... (가로줄만 있는게 default)
    xMajorGrid: { // 세로줄
      type: Boolean,
      default: false
    },
    yMajorGrid: { // 가로줄
      type: Boolean,
      default: true
    },
    symbolMarker: {
      type: String,
      default: undefined,
      validator (value) {
        return ['Box', 'Dot'].includes(value)
      }
    },
    axisStyle: {
      type: String,
      default: ''
    },

    chartAnimation: {
      type: String, // None (없음), All, Point, Series
      default: 'Point'
    }
  },
  computed: {
    itemsSourceCollection: {
      get () {
        return this.itemsSource
      },
      set (newVal) {
        return newVal
      }
    }
  },
  methods: {
    init (chart) {
      this.chart = chart
      chart.axisY.overlappingLabels = 1
      chart.axisX.overlappingLabels = 1

      if (this.stacking) this.chart.stacking = this.stacking
      if (this.markerLines && this.markerLines !== 'None') this.createMarker(chart)

      this.initialized(chart)
    },
    initItemFormatter (engine, ht, render) {
      render()

      if (this.itemFormatter) this.itemFormatter(engine, ht, render)

      // Column 그래프 너비 조절
      if (this.chartType === 'Column' && this.adjustColWidth.set) {
        if (ht.pointIndex === this.itemsSource.length - 1) {
          const hostElement = ht.series.hostElement
          const childrens = hostElement.querySelectorAll('rect')

          childrens.forEach(el => {
            const width = el.width.baseVal.value
            const defaultX = Number(el.x.baseVal.valueAsString)
            el.width.baseVal.value = this.adjustColWidth.width
            el.x.baseVal.valueAsString = defaultX + (width / 2) - (this.adjustColWidth.width / 2)
          })
        }
      }

      this.setMaxAxisValue({ engine, ht, render })
    },
    /**
     * 매번 max 값이 움직여야한다면 여기서 수정
     * 모든 values중 가장 큰 value를 기준으로 (Column)상단 / (Bar)좌측에 공간을 만듭니다.
     */
    setMaxAxisValue ({ engine, ht, render }) {
      const chart = ht.chart
      const chartBindings = chart.series.map(s => s.binding)
      const values = []

      // if (this.stacking === 'Stacked') { // 예외가 있을 수 있어서 주석..
      const bindings = []
      this.itemsSource.forEach(item => {
        const allBindingVal = {}
        chartBindings.forEach(name => { allBindingVal[name] = item[name] })
        bindings.push(allBindingVal)
      })

      bindings.map(binding => {
        let maxData = 0
        for (const key in binding) maxData += binding[key]
        return values.push(maxData)
      })
      // } else {
      //   this.itemsSource.forEach(item => {
      //     chartBindings.forEach(name => values.push(item[name]))
      //   })
      // }

      const sortedVal = values.sort((val1, val2) => {
        if (val1 > val2) return -1
        else if (val1 < val2) return 1
        else return 0
      })[0]

      if (sortedVal > 0) ht.chart.axisY.max = this.chartType === 'Column' ? sortedVal + (sortedVal / 5) : undefined
      ht.chart.axisX.max = this.chartType === 'Bar' ? sortedVal + (sortedVal / 20) : undefined
    },
    /**
     * 차트 마커 설정
     */
    createMarker (chart) {
      const marker = new wjChart.LineMarker(chart, {
        lines: this.markerLines,
        interaction: this.markerInteraction,
        alignment: 'Top',
        content: () => {
          return this.getMarkercontent(new wjCore.Point(this.pt.x, NaN))
        }
      })
      marker.positionChanged.addHandler((marker, point) => {
        this.pt = point
        var timer
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          this.changeMarker(chart, marker)
        }, 500)
      })
    },
    changeMarker (curChart, marker) {
      if (this.chart) {
        const element = this.chart.hostElement.querySelector('.wj-chart-linemarker')
        if (this.chart === curChart) element.style.display = 'block'
        else element.style.display = 'none'
      }
    },
    /**
     * 마커에 표시되는 내용 세팅
     */
    getMarkercontent (pt) {
      if (!this.chart || !this.chart.itemsSource) return false

      const ht = this.chart.series[0].hitTest(pt)
      const item = this.chart.itemsSource[ht.pointIndex]

      if (!item) return false

      if (this.markerContent) {
        // setTimeout(() => {
        return this.markerContent(this.chart, ht)
        // }, 200)
      } else {
        let content = ''

        if (ht.x && ht.y !== null) {
          content += `${ht.x} <br>`
        }
        content += ht.y
        return content
      }
    }
  },
  data () {
    return {
      pt: ''
    }
  }
}
</script>
