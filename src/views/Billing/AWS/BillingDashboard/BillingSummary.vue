<!--
  * 파일명 : BillingSummary.vue
  * 파일 기능 :
  * 작성자 : 염창윤 외 4명
  * 최종 작성일 : 2021-01-28
  * License By Shinsegae I&C
  * 2021-01-28 트랜드 -> 트렌드 수정
 -->

<template>
  <section class="monthly-paymeny-status-wrap">
    <cmp-chart
      v-if="vmStatusTrendChartData.length > 0"
      :items-source="vmStatusTrendChartData"
      binding-x="month"
      selection-mode="Point"
      :palette="['rgba(141, 229, 167, 1)', 'rgba(115, 117, 218, 1)', 'rgba(137, 211, 240, 1)']"
      :chart-binding="vcpuChartBinding"
      chart-legend-position="None"
      :tooltip-content="tooltipContent"
      chart-type="Area"
      :initialized="initSummaryChart"
    />
    <div
      v-else
      style="height: 300px"
    />
    <!-- :initialized="initVcpuChart" -->
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'MonthlyPaymentStatus',
  props: {
    data: {
      type: Number,
      default: undefined
    },
    monthdata: {
      type: Number,
      default: 0
    }
  },
  watch: {
    data (data) {
      console.log('data', data)
      this.getGroupPrice(data)
    },
    monthdata (payload) {
      console.log('넘어오는 데이터', payload)
      this.getDefaultPrice()
    }
  },
  created () {
    var now = new Date()
    var nowYear = now.getFullYear()
    var nowMonth = now.getMonth()
    var nowDate = null
    if (nowMonth < 10) {
      nowDate = nowYear + '-' + '0' + nowMonth + '-01'
    } else {
      nowDate = nowYear + '-' + nowMonth + '-01'
    }
    console.log('오늘', nowDate)

    // 오늘로 부터 일년전 날짜 구하는 로직
    var oneYear = new Date()
    var oneYearAgo = new Date(oneYear.setFullYear(oneYear.getFullYear() - 1))
    var year = oneYearAgo.getFullYear()
    var month = oneYearAgo.getMonth()
    var yearDate = null
    if (month < 10) {
      yearDate = year + '-' + '0' + month + '-01'
    } else {
      yearDate = year + '-' + month + '-01'
    }
    this.getYearGroupBilling(yearDate, nowDate)
  },
  methods: {
    async getYearGroupBilling (from, to) {
      const period = {
        from: from,
        to: to
      }
      this.rawYearBilling = await API.billing.getTotPriceBilling(period)
      this.getDefaultPrice()
    },
    getDefaultPrice () {
      this.vmStatusTrendChartData = []
      this.rawYearBilling.map(m => {
        var date = new Date(m.billingDate)
        var year = date.getFullYear()
        var day = date.getMonth() + 1
        var rate = year + '.' + day
        this.vmStatusTrendChartData.push({
          month: rate,
          value: m.total
        })// end of push
      })// end of map
      if (this.monthdata) {
        this.vmStatusTrendChartData = this.vmStatusTrendChartData.reverse()
        this.vmStatusTrendChartData = this.vmStatusTrendChartData.slice(0, this.monthdata)
        this.vmStatusTrendChartData = this.vmStatusTrendChartData.reverse()
      }
    },
    async getGroupPrice (data) {
      this.rawYearBilling = await API.billing.getTotPriceByGroup(data)
      this.getDefaultPrice()
    },
    initSummaryChart (flex, ht) {
      flex.series[0].style = { fill: 'l(0, 0, 0, 1)#ffc000:0.1:0.12-#ffc000:1:0', stroke: '#ffc000', strokeWidth: 1 }
    },
    initMemoryChart (flex) {
      this.memoryChart = flex
    },
    /**
     * 툴팁 설정
     */
    tooltipContent (ht) {
      return `<p class="adm-chart-tooltip">
        ${ht.x}
        <span class="-name" style="color: #ffc000">
          <b class="-value">${ht.y}</b> 원
        </span>
      </p>`
    }
  },
  data () {
    return {

      vmStatusTrendChartData: [
        { month: '2019.11', value: 32 },
        { month: '2019.12', value: 32 },
        { month: '2020.01', value: 46 },
        { month: '2020.02', value: 32 },
        { month: '2020.03', value: 76 },
        { month: '2020.04', value: 32 },
        { month: '2020.05', value: 23 },
        { month: '2020.06', value: 32 },
        { month: '2020.07', value: 54 },
        { month: '2020.08', value: 32 },
        { month: '2020.09', value: 3 },
        { month: '2020.10', value: 32 }
      ],
      vcpuChartBinding: [
        { name: '트렌드', binding: 'value', chartType: 'SplineArea', splineStyle: { symbolStyle: { fill: '#ffc000', stroke: '#ffc000' }, symbolSize: 0 }, color: '#ffc000' }
        // { name: '트렌드', binding: 'value' }
        // { name: '트렌드', binding: 'value', chartType: 'SplineSymbols', splineStyle: { symbolStyle: { fill: '#ffc000', stroke: '#ffc000' }, symbolSize: 0 } }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
