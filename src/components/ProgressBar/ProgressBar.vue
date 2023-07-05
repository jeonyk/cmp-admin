<!--
  * 파일명 : ProgressBar.vue
  * 파일 기능 : 프로그레스바 컴포넌트
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-25
  * License By Shinsegae I&C
  * 2021-01-25 fix: [그리드 솔팅] - 호스트 목록
 -->

<template>
  <section class="progress-bar">
    <div
      class="progress-percent"
      :style="{height: height}"
    >
      <div
        class="percent-bar"
        :style="{
          width: !isNaN(incrDecrRate) && Math.sign(incrDecrRate) === -1 ? Number(percentage) + Number(incrDecrRate) + '%' : percentage + '%',
          backgroundImage: computePalette && computePalette.length ? `linear-gradient(to left, ${computePalette[0]}, ${computePalette[1]})` : 'none'
        }"
      />
      <div
        v-if="!isNaN(incrDecrRate)"
        class="percent-bar incr-decr-bar"
        :style="{
          width: Math.sign(incrDecrRate) === 1 ? Number(percentage) + Number(incrDecrRate) + '%' : Number(percentage) + '%',
          border: Math.sign(incrDecrRate) === 1 ? incrDecrRateBorder : 'none',
          backgroundColor: Math.sign(incrDecrRate) === 1 ? 'transparent' : '#a1a1a1',
          backgroundImage: 'none'
        }"
      />
    </div>
    <span class="progress-text">
      {{ percentage }}%
      <span
        v-if="!isNaN(incrDecrRate)"
        class="incr-decr-text"
      >
        (
        <span v-if="Math.sign(incrDecrRate) === 1">+</span>
        {{ incrDecrRate }}
        %)
      </span>
    </span>
  </section>
</template>

<script>
export default {
  name: 'ProgressBar',
  props: {
    total: {
      type: Number,
      default: 0
    },
    value: {
      type: [Number, String],
      default: 0
    },
    customPercentage: {
      type: Number,
      default: undefined
    },
    alertPercent: { // [경고] 프로그레스바 붉은 계통의 경고 표시는 몇 퍼센트부터 적용할 것인지? 임계치 퍼센트로
      type: Number,
      default: 100
    },
    noticePercent: { // [주의] 프로그레스바 노란 계통의 주의 표시는 몇 퍼센트부터 적용할 것인지? 임계치 퍼센트로
      type: Number,
      default: 0
    },
    incrDecrRate: { // 증감률 표시
      type: [Number, String],
      default: undefined
    },
    // label: {
    //   type: Number,
    //   default: 0
    // },
    palette: {
      type: Array,
      default () {
        // return ['#44c8b4', '#1f46a3']
        return ['#1977d2', '#1977d2']
      }
    },
    alertPalette: {
      type: Array,
      default () {
        // return ['#d98b52', '#d95252']
        return ['#fa5657', '#fa5657']
      }
    },
    noticePalette: {
      type: Array,
      default () {
        return ['#F4A462', '#F4A462']
      }
    },
    height: {
      type: String,
      default: '15px'
    }
  },
  computed: {
    percentage () {
      let percent
      if (this.customPercentage !== undefined) percent = this.customPercentage
      else percent = this.value / this.total * 100
      // return Math.round(percent)
      if (isNaN(percent)) {
        return 0
      }
      return percent.toFixed(2)
    },
    computePalette () {
      let selectPl

      if (this.noticePercent) {
        if (this.percentage > this.alertPercent) selectPl = 'alertPalette'
        else if (this.percentage < this.alertPercent && this.percentage > this.noticePercent) selectPl = 'noticePalette'
        else selectPl = 'palette'
      } else {
        this.percentage > this.alertPercent
          ? selectPl = 'alertPalette'
          : selectPl = 'palette'
      }
      return [
        this[selectPl][0],
        this[selectPl][1]
      ]
    }
  },
  watch: {
    computePalette: {
      immediate: true,
      handler (newVal) {
        if (newVal?.length) {
          this.incrDecrRateBorder = `1px solid ${newVal[0]}`
        }
      }
    }
  },
  created () {
    if (typeof this.value === 'string') this.val = Number(this.value)
    else this.val = this.value

    if (Array.isArray(this.val)) {
      this.valuesTotal = this.val.reduce((a, b) => a + b)
    }
  },
  methods: {

  },
  data () {
    return {
      val: undefined,
      incrDecrRateBorder: 'none' // 증감률 border 스타일
    }
  }
}
</script>

<style lang="scss" scoped>
  .progress-bar {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 160px;
    .progress-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      // padding-left: 50px;
      color: #ffffff;
      font-size: 12px;
      font-weight: bold;
      line-height: 15px;
      z-index: 3;
      white-space: nowrap;
      .incr-decr-text {
        font-size: 11px;
        font-weight: normal;
      }
    }
    .progress-percent {
      flex: 1 1 auto;
      position: relative;
      width: 100%;
      height: 15px;
      border-radius: $radius-r;
      background-color: $main-gray;
      overflow: hidden;
      .percent-bar {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        height: 100%;
        border-radius: $radius-r;
        background-image: linear-gradient(to left,  #8dd0bf, #89d3f0);
        z-index: 2;
        transition: all .25s;
        &.incr-decr-bar {
          z-index: 1
        }
      }
    }
  }
</style>
