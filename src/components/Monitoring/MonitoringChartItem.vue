<template>
  <div
    class="chart-item"
    @mouseleave="onResetHighlightSymbol"
  >
    <div class="chart-header">
      {{ header }}
    </div>
    <small
      class="chart-summary"
      v-if="summary"
    >{{ summary }}</small>
    <wj-flex-chart
      chart-type="SplineSymbols"
      :symbol-size="8"
      :palette="['#3E57C9', '#F4A462', '#9e85fa']"
      :items-source="data"
      binding-x="x"
      :rendering="onRenderingChart"
      :rendered="onRenderedChart"
      :tooltip-content="tooltipContent"
      @mouseenter.native="onMouseEnter"
      @mouseleave.native="onMouseLeave"
    >
      <slot />
      <wj-flex-chart-series :binding="bindingKey" />
      <wj-flex-chart-axis
        wj-property="axisY"
        :major-unit="majorOnlyInteger ? 1 : undefined"
      />
      <wj-flex-chart-axis
        wj-property="axisX"
        binding="time"
        :overlapping-labels="0"
        :label-angle="0"
      />
      <wj-flex-chart-line-marker
        v-if="!skipKey.includes(bindingKey)"
        lines="Horizontal"
        interaction="None"
        :is-visible="true"
        :vertical-position="lineMarkerVerticalPosition"
        :content="() => formattedThreshold"
      />
      <wj-flex-chart-animation animation-mode="Series" />
    </wj-flex-chart>
  </div>
</template>

<script>
import '@grapecity/wijmo.vue2.chart'
import '@grapecity/wijmo.vue2.chart.animation'
import dayjs from 'dayjs'

// 차트 Y축에 최대값을 표시한다.
function pushMaxValueToAxis (chart) {
  const axisY = chart.axisY
  const labels = axisY.axisLabels.map(q => {
    if (q.includes(',')) {
      return parseInt(q.replace(/,/g, ''))
    }
    return parseInt(q)
  })

  if (!labels.length) return

  this.interval = labels[1] - labels[0]

  if (!this.interval) return

  if (this.yMax > parseInt(labels[labels.length - 1])) {
    // 차트의 최대 값이 Y축에 표현된 것보다 김
    const m = parseInt(labels[labels.length - 1]) + this.interval
    axisY.max = m
  }
}

export default {
  name: 'MonitoringChartItem',
  props: {
    /**
     * 임계치
     */
    threshold: {
      type: [Number, String],
      default: '0'
    },
    /**
     * 차트 데이터
     */
    data: {
      type: Array,
      required: true
    },
    /**
     * 바인딩될 키
     */
    bindingKey: {
      type: String,
      required: true
    },
    /**
     * 제목
     */
    header: {
      type: String,
      default: ''
    },
    /**
     * 차트 설명
     */
    summary: {
      type: String,
      default: ''
    }
  },
  computed: {
    /**
     * y축 값은 정수여야 하는가
     */
    majorOnlyInteger () {
      if (!this.data.every(Boolean)) return undefined

      return [
        'networkReceivedRateKbps',
        'networkTransmittedRateKbps',
        'controllerNumIops'
      ].includes(this.bindingKey)
    },
    skipKey () {
      return ['networkReceivedRateKbps', 'networkTransmittedRateKbps']
    },
    formattedThreshold () {
      return this.threshold ? Number(this.threshold).toLocaleString() : '0'
    },
    yMax () {
      return Math.max(...this.data.map(d => d[this.bindingKey]))
    },
    /**
     * Y축 임계치 표시 위치 지정
     */
    // lineMarkerVerticalPosition () {
    //   const threshold = parseInt(this.threshold) || 0

    //   // Y축에 최대값은 유동적으로 변경될 수 있음
    //   // 데이터의 최대값으로 임계치 표시 마커의 오프셋을 계산하게 되면
    //   // 잘못된 위치에 노출될 수도 있어 실제 그리드에서 Y축 최대값으로 대치하여
    //   // 라인 마커의 오프셋을 계산함
    //   if (!this.chart) return 0

    //   const yMax = this.chart.axisY.max || 0

    //   if (threshold > yMax) {
    //     return 0
    //   } else if (threshold === 0) {
    //     return 1
    //   } else {
    //     return 1 - threshold / yMax
    //   }
    // },
    /**
     * 툴팁 단위 bindingKey별로 다른 단위
     */
    itemUnit () {
      switch (this.bindingKey) {
        case 'hypervisorCpuUsagePpm': // [NX] CPU 사용률 (%)
        case 'memoryUsagePpm': // [NX, EC2] 메모리 사용률 (%)
        case 'controllerUserBytes': // [NX] 디스크 사용률 (%)
        case 'cpuUtilization': // [EC2] CPU 사용률 (%)
        case 'timeSpentIdle': // [EBS] 유휴시간 (%)
        case 'burstBalance': // [EBS] 버스트 잔고 (%)
          return '%'

        case 'networkReceivedRateKbps': // [NX] 네트워크 패킷 수신율 (kBps)
        case 'networkTransmittedRateKbps': // [NX] 네트워크 패킷 전송율 (kBps)
          return 'kBps'
        case 'controllerNumIops': // [NX] 컨트롤러 IOPS (IOPS)
        case 'controllerIoBandwidthKbps': // [NX] 컨트롤러 평균 I/O 대역폭 (IOPS)
          return 'IOPS'
        case 'controllerAvgIoLatencyUsecs': // [NX] 컨트롤러 평균 I/O 지연율 (IOPS)
          return 'ms'

        case 'diskReadBytes': // [EC2] 디스크 읽기 (바이트)
        case 'diskWriteBytes': // [EC2] 디스크 쓰기 (바이트)
        case 'networkIn': // [EC2] 네트워크 입력 (바이트)
        case 'networkOut': // [EC2] 네트워크 출력 (바이트)
          return 'byte'
        case 'diskReadOps': // [EC2] 디스크 읽기 작업 (작업)
        case 'diskWriteOps': // [EC2] 디스크 쓰기 작업 (작업)
        case 'networkPacketIn': // [EC2] 네트워크 패킷 입력 (개수)
        case 'networkPacketOut': // [EC2] 네트워크 출력 (개수)
        case 'cpuCreditBalance': // [EC2] CPU 크레딧 밸런스 (개수)
        case 'statusCheckFailed': // [EC2] 상태 검사 실패 (시스템)(개수)
        case 'statusCheckFailedSystem': // [EC2] 상태 검사 실패 (전체)(개수)
        case 'statusCheckFailedInstance': // [EC2] 상태 검사 실패 (인스턴스)(개수)
        case 'queueLength': // [EBS] 평균 대기열 길이 (작업)
          return '개'

        case 'readBandwidth': // [EBS] 읽기 대역폭 (KiB/s)
        case 'writeBandwidth': // [EBS] 쓰기 대역폭 (KiB/s)
          return 'KiB/s'

        case 'readIops': // [EBS] 읽기 처리량 (Ops/s)
        case 'writeIops': // [EBS] 쓰기 처리량 (Ops/s)
          return 'Ops/s'

        case 'avgReadBytes': // [EBS] 평균 읽기 크기 (KiB/op)
        case 'avgWriteBytes': // [EBS] 평균 쓰기 크기 (KiB/op)
          return 'KiB/op'

        case 'avgReadTime': // [EBS] 평균 읽기 지연 시간 (ms/op)
        case 'avgWriteTime': // [EBS] 평균 쓰기 지연 시간 (ms/op)
          return 'ms/op'

        default:
          return ''
      }
    }
  },
  watch: {
    // isMouseEntered: {
    //   immediate: true,
    //   handler (entered) {
    //     if (this.chart) {
    //       const chart = this.chart.hostElement
    //       const lineMarkerEl = chart.querySelector(
    //         '.wj-chart-linemarker-container'
    //       )
    //       if (lineMarkerEl) {
    //         if (entered) {
    //           lineMarkerEl.classList.remove('hidden')
    //         } else {
    //           lineMarkerEl.classList.add('hidden')
    //         }
    //       }
    //     }
    //   }
    // }
  },
  mounted () {
    document.body.classList.add('tooltip-reverse')
  },
  beforeDestroy () {
    document.body.classList.remove('tooltip-reverse')
  },
  methods: {
    onResetHighlightSymbol () {
      if (this.skipKey.includes(this.bindingKey)) return
      this.chart.hostElement
        .querySelectorAll('ellipse')
        .forEach(el => el.classList.remove('entering'))
    },
    // hideLineMarker () {
    //   if (this.chart) {
    //     const chartEl = this.chart.hostElement
    //     const lineMarkerEl = chartEl.querySelector(
    //       '.wj-chart-linemarker-container'
    //     )

    //     if (lineMarkerEl) {
    //       lineMarkerEl.classList.add('hidden')
    //     }
    //   }
    // },
    onRenderedChart (chart) {
      pushMaxValueToAxis.call(this, chart)

      if (this.skipKey.includes(this.bindingKey)) {
        chart.tooltip.cssClass = 'monitor-tooltip'
        return
      }
      const host = chart.hostElement
      const wrapper = host.querySelector('.wj-chart-linemarker')
      const hline = wrapper.querySelector('.wj-chart-linemarker-hline')
      const hlineTop = hline.style.top
      const content = wrapper.querySelector('.wj-chart-linemarker-content')

      content.style.top = `calc(${hlineTop} - 12.5px)`
      this.chart = chart

      if (this.chart && this.chart.tooltip) {
        this.chart.tooltip.cssClass = 'monitor-tooltip'
      }

      // this.hideLineMarker()
      const zones = this.chart.hostElement.querySelectorAll('.alarm-zone')
      const ellipses = this.chart.hostElement.querySelectorAll('ellipse')

      zones.forEach((zone, zoneIdx) => {
        zone.addEventListener('mouseenter', e => {
          this.onResetHighlightSymbol()
          ellipses[zoneIdx].classList.add('entering')
        })

        zone.addEventListener('mouseleave', e => {
          const whitelist = ['line', 'ellipse']
          if (!whitelist.includes(e.toElement?.tagName)) {
            ellipses[zoneIdx].classList.remove('entering')
          }
        })
      })

      const threshold = parseInt(this.threshold) || 0
      const yMax = parseInt(chart.axisY.axisLabels[chart.axisY.axisLabels.length - 1]) || 0

      if (threshold > yMax) {
        this.lineMarkerVerticalPosition = 0
      } else if (threshold === 0) {
        this.lineMarkerVerticalPosition = 1
      } else {
        this.lineMarkerVerticalPosition = 1 - threshold / yMax
      }
    },
    onMouseEnter () {
      this.isMouseEntered = true
    },
    onMouseLeave () {
      this.isMouseEntered = false
    },
    tooltipContent (hit) {
      const date = dayjs(
        new Date(hit.item.raw.createTime || hit.item.raw.timestamp)
      ).format('YYYY-MM-DD HH:mm:ss')
      let value = Number(hit.item[this.bindingKey]).toFixed(2)

      if (hit.item[this.bindingKey] % 1 === 0) value = parseInt(value)

      return `
      <div class="custom-tooltip-monitor">
        <span class="normal date">${date}</span>
        <span class="em">${value.toLocaleString()}</span>
        <span class="normal">${this.itemUnit}</span>
      </div>`
    },
    renderThreshold ({ engine }, chart) {
      if (!this.chart) return

      this.offset = 0
      this.tempOffset = null

      const hostEl = chart.hostElement
      const plot = hostEl.querySelector('.wj-plot-area rect')
      const plotWidth = parseInt(plot.width.baseVal.value)
      // const hostWidth = hostEl.clientWidth

      // 강조 막대 사이즈
      const emSize = plotWidth / chart.itemsSource.length

      // 임계치 강조 표시가 x로부터 얼마만큼 떨어져야 할지
      // const offset = (hostWidth - plotWidth) - 15
      const offset = chart._plotRect.left

      this.offset = offset

      if (chart && chart.itemsSource && chart.itemsSource.length) {
        chart.itemsSource.forEach((data, i) => {
          let innerTempOffset = offset + i * emSize

          if (this.tempOffset) {
            innerTempOffset = this.tempOffset + emSize
          }

          if (data[this.bindingKey] > this.threshold) {
            engine.fill = 'l(0, 1, 0, 0.5)#131D48-#2A3B89:1:0'
            engine.drawRect(innerTempOffset, 0, emSize, 100, 'alarm-zone')
          } else if (data[this.bindingKey] <= this.threshold) {
            engine.fill = 'l(0, 1, 0, 0)transparent-transparent:1:0'
            engine.drawRect(innerTempOffset, 0, emSize, 100, 'alarm-zone')
          }

          this.tempOffset = innerTempOffset
        })
      }
    },
    onRenderingChart (s, e) {
      s.axisY.min = 0
      // s.axisY.max = this.yMax

      this.renderThreshold(e, s)
    }
  },
  data: () => ({
    lineMarkerVerticalPosition: 0,
    isMouseEntered: false,
    offset: 0,
    chart: null,
    tempOffset: null,
    interval: 0
  })
}
</script>

<style lang="scss" scoped>
$chart-width: 520px;
$chart-height: 190px;
$chart-gap: 30px;

.chart-item {
  /* width: 490px; */
  padding: $chart-gap;
  box-sizing: border-box;
  background-color: $dark-navy;
  overflow: hidden;
  position: relative;
  border-radius: 6px;

  &::v-deep {
    .wj-flexchart {
      width: calc(#{$chart-width} - #{$chart-gap * 2});
      height: calc(#{$chart-height} - #{$chart-gap * 2});

      .wj-chart-linemarker {
        background: none;

        &-content {
          box-shadow: none;
          background-color: $purple;
          color: $white;
          padding: 3px 6px;
          border-radius: 50px;
          box-sizing: border-box;
          position: relative;
          // left: -35px;
          right: calc(100% + 8px);
          font-size: 13px;
        }

        &-hline {
          background: none;
          border-bottom: 1px dashed $purple;
        }
      }

      ellipse {
        stroke: transparent;
        fill: transparent;

        &.entering {
          stroke-width: 3;
          stroke: #3e57c9;
          fill: white;
        }
      }
    }

    .wj-label {
      fill: $input-placeholder !important;
    }

    .wj-axis-x {
      .wj-line {
        stroke: $purple-gray;
      }
    }

    .wj-axis-y {
      .wj-gridline {
        stroke: $dark-slate !important;
      }
    }

    /* .wj-chart-linemarker-container {
      &.hidden {
        display: none;
      }
    } */
  }

  .chart-header {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: $gap-s;
  }

  .chart-summary {
    font-size: 13px;
    margin-top: 5px;
    color: $input-placeholder;
  }
}
</style>

<style lang="scss">
.custom-tooltip-monitor {
  .normal {
    color: #e1e1e1;
  }

  .date {
    margin-right: $gap-s;
  }

  .em {
    font-weight: bold;
    color: $white;
  }
}

.monitor-tooltip {
  background-color: $dark-slate !important;
  border: none !important;
  padding: 5px 11px !important;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.15) !important;
  border-radius: 6px !important;

  &::before {
    background-color: $dark-slate !important;
    border: none !important;
  }
}
</style>
