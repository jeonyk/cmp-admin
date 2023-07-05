<!--
  * 파일명 : CMPPieChart.vue
  * 파일 기능 : 파이 차트 컴포넌트
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-12-02
  * License By Shinsegae I&C
  * 2020-12-02 Merge branch 'dev' of http://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/markupfix
 -->

<template>
  <div class="cmp-pie-chart-wrap">
    <wj-flex-pie
      v-if="itemsSource"
      class="cmp-pie-chart"
      :initialized="init"
      :items-source="itemsSourceCollection"
      :binding-name="bindingName"
      :binding="binding"
      :header="header"
      :titles="titles"
      :inner-radius="innerRadius"
      :selected-item-offset="selectedItemOffset"
      :palette="palette"
      :selection-mode="selectionMode"
      :start-angle="startAngle"
      :style="`display: block; height: ${height}px; width: ${height}px;`"
      :offset="offset"
      :item-formatter="itemFormatter"
      :selection-changed="selectionChanged"
    >
      <wj-flex-pie-data-label
        :position="labelPosition"
        :content="labelContent"
      />
      <wj-flex-chart-legend :position="chartLegendPosition" />
      <wj-flex-chart-animation
        :animation-mode="animationMode"
        easing="Linear"
        :duration="300"
      />
    </wj-flex-pie>

    <template v-else>
      <div class="empty-data">
        {{ $v('데이터가 없습니다.') }}
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'CMPPieChart',
  props: {
    height: { // 차트의 width/height 를 직접적으로 할당합니다.
      type: Number,
      default: 300
    },
    initialized: { // 외부에서 custom
      type: Function,
      default: () => {}
    },
    itemsSource: { // 데이터
      type: Array,
      default: () => []
    },
    bindingName: {
      type: String,
      default: ''
    },
    binding: {
      type: String,
      default: ''
    },
    header: {
      type: String,
      default: undefined
    },
    titles: {
      type: Array,
      default: () => []
    },

    // chart 모양
    innerRadius: { // 내부에 빈 공간 radius
      type: Number,
      default: 0
    },
    // selectedItemPosition: {
    //  type: String,
    //  default: none
    // },
    selectedItemOffset: { // 선택된 파이차트의 강조(?) offset을 지정합니다
      type: Number,
      default: 0
    },
    palette: { // chart의 컬러를 설정합니다.
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
    selectionMode: { // 차트를 선택하면 표시할 방식을 선택합니다
      type: String,
      default: 'None',
      validator (value) {
        return ['None', 'Point', 'Series'].includes(value)
      }
    },
    selectionChanged: {
      type: Function,
      default: undefined
    },
    startAngle: {
      type: Number,
      default: 0
    },

    // label 관련
    labelPosition: { // label 위치
      type: String,
      default: 'Inside',
      validator (value) {
        return ['Inside', 'Outside', 'Center'].includes(value)
      }
    },
    labelContent: {
      type: [Function, String, Number, Object, Array],
      default: undefined
    },
    chartLegendPosition: {
      type: String,
      default: 'None',
      validator (value) {
        return ['None', 'Top', 'Bottom', 'Left', 'Right'].includes(value)
      }
    },
    animationMode: {
      type: String,
      default: 'Point',
      validator (value) {
        return ['Point', 'Series', 'All'].includes(value)
      }
    },

    tooltipContent: { // 툴팁..
      type: [Function, String, Number, Object, Array],
      default: undefined
    },
    offset: {
      type: Number,
      default: 0
    },
    itemFormatter: {
      type: Function,
      default: undefined
    }
  },
  computed: {
    itemsSourceCollection: {
      get () { return this.itemsSource },
      set (newVal) { return newVal }
    }
  },
  methods: {
    init (chart) {
      this.chart = chart
      this.initialized(chart)

      // 툴팁 내용 설정
      this.chart.tooltip.content = this.tooltipContent
    }
  },
  data () {
    return {

    }
  }
}
</script>
<style lang="scss" scoped>
  .cmp-pie-chart-wrap {
    > .cmp-pie-chart {
      height: 100%;
    }
  }
</style>
