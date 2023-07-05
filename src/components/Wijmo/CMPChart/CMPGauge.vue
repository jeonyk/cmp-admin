<!--
  * 파일명 : CMPGauge.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-11-23
  * License By Shinsegae I&C
  * 2020-11-23 fix: <shp-gauge> 좌우 반전
 -->

<template>
  <div
    class="cmp-gauge"
    :id="id"
  >
    <wj-radial-gauge
      :min="minMax.min"
      :max="minMax.max"
      :value="value"
      :step="step"
      :thickness="thickness"
      :tick-spacing="0"
      :thumb-size="thumbSize"
      :sweep-angle="sweepAngle"
      :start-angle="startAngle"
      :stack-ranges="true"
      :is-read-only="true"
      :auto-scale="true"
      :initialized="init"
      :style="`width: ${width}px`"
    >
      <wj-range
        v-for="data in rangeData"
        :key="data.field"
        :min="0"
        :max="data.max"
        :color="data.color"
      />
    </wj-radial-gauge>

    <!-- v-wj-tooltip="tooltipContent" -->
  </div>
</template>

<script>
import { Tooltip } from '@grapecity/wijmo'

export default {
  name: 'CMPGauge',
  props: {
    rangeData: { // 기본 데이터를 배열 형태로 받습니다
      type: Array,
      default: () => [],
      required: true
    },
    minMax: { // 게이지의 최소/최댓값 지정
      type: Object,
      default: () => { return { min: 0, max: 100 } }
    },
    width: { // 너비 지정
      type: Number,
      default: 200
    },
    value: { // 기본 값 value 지정 (?)
      type: Number,
      default: 0
    },
    step: { // readOnly 가능한 경우 - step 지정
      type: Number,
      default: 10
    },
    thickness: { // 게이지 두께 지정
      type: Number,
      default: 0.1
    },
    thumbSize: { // 게이지 thumb(?) 크기 지정
      type: Number,
      default: 0.1
    },
    sweepAngle: { // arc의 angle 지정
      type: Number,
      default: 180
    },
    startAngle: {
      type: Number,
      default: 0
    },
    id: { // tooltip을 사용하려면 id가 필요합니다! 지정해주세요..
      type: String,
      default: undefined
    },
    tooltipContent: { // tooltip html 태그를 string으로 입력해주세요
      type: String,
      default: undefined
    }
  },
  watch: {
    rangeData (data) {
      this.tooltipGenerator()
    }
  },
  methods: {
    init (gauge) {
      gauge.hasShadow = false
      gauge.showText = false

      if (this.tooltipContent) this.tooltipGenerator()
    },
    tooltipGenerator () {
      var tt = new Tooltip()
      tt.showAtMouse = true
      tt.showDelay = 0

      this.$nextTick(() => {
        tt.setTooltip(`#${this.id}`, this.tooltipContent)
      })
    }
  },
  data () {
    return {
      gauge: null
    }
  }
}
</script>

<style lang="scss">
.cmp-gauge {
  .wj-gauge .wj-ticks {
      stroke-width: 2px;
      stroke: white;
  }
  .wj-gauge {
    .wj-face {
      path {
        fill: #363a3f;
        stroke: transparent
      }
    }
    div[wj-part=dsvg] {
      svg[wj-part=svg] {
        transform: scaleX(-1);
      }
    }
  }
}
</style>
