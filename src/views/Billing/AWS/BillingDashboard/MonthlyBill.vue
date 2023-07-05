<!--
  * 파일명 : MonthlyBill.vue
  * 파일 기능 : [빌링 > 대시보드 > 월별 청구금액] 차트를 입력합니다. 외부에서 날짜를 받아 데이터를 보여줍니다.
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2021-01-12
  * License By Shinsegae I&C
  * 2021-01-12 빌링 > 대쉬보드 수정
 -->

<template>
  <section
    class="monthly-bill-wrap flex-wrap"
    v-loading="isGetLoading"
  >
    <article class="-total-compare">
      <div
        v-if="status === $t('bill.monthly')"
        class="-payment"
      >
        <h6>{{ dateFormat }} {{ $t('bill.billCompare') }}</h6>
        <span><b class="-price">{{ superTotal | locale }}</b> {{ $t('common.TERMS.won') }}</span>
        <p class="-comparing">
          <!-- (전월대비 <small>{{ upDownArrow }} {{ totalGap | locale }}</small> 원) -->
        </p>
      </div>
      <div
        v-if="status === $t('bill.compare')"
        class="-payment"
      >
        <h6>{{ twoCompare[1] ? twoCompare[1].month : '' }} {{ $t('bill.billCompare') }}</h6>
        <span><b class="-price">{{ twoCompare[1] ? twoCompare[1].rate : 0 | locale }}</b> {{ $t('common.TERMS.won') }}</span>
        <p class="-comparing">
          ({{ $t('bill.comparePrev') }} <small>{{ totalGap !== 0 ? upDownArrow : '' }} {{ totalGap | locale }}</small> {{ $t('common.TERMS.won') }})
        </p>
      </div>

      <div class="compare-chart">
        <cmp-chart
          v-if="status === $t('bill.monthly')"
          :items-source="vcpuData"
          binding-x="month"
          selection-mode="Point"
          y-axis-position="None"
          :tooltip-content="compareChartTooltip"
          :chart-binding="vcpuChartBinding"
          :palette="['rgba(211, 106, 230, 1)']"
          :height="250"
          :x-axis-line="true"
          :adjust-col-width="{ set: true, width: 40 }"
        />
        <!-- :item-formatter="itemFormatter" -->

        <cmp-chart
          v-else
          :items-source="vcpuData2"
          binding-x="month"
          selection-mode="Point"
          y-axis-position="None"
          :tooltip-content="compareChartTooltip"
          :chart-binding="vcpuChartBinding"
          :palette="['rgba(211, 106, 230, 1)', 'rgba(96, 123, 237, 1)']"
          :height="250"
          :x-axis-line="true"
          :item-formatter="itemFormatter"
          :adjust-col-width="{ set: false, width: 30 }"
        />
      </div>
    </article>
    <!-- /. 청구금액 비교 -->
    <!-- ///// -->

    <article class="-total-detail">
      <div
        class="detail-statistics flex-wrap"
        v-for="(chart , idx) in chartDataList"
        :key="idx"
      >
        <div class="-left">
          <el-tooltip
            :disabled="chart.origin.length < 10"
            effect="light"
          >
            <h6>{{ chart.origin | nameOfDataCenter }}</h6>
            <div slot="content">
              {{ chart.origin }}
            </div>
          </el-tooltip>
          <p class="-payment">
            <span>{{ $t('bill.final') }}</span> <span><b>{{ chart.finalValue | locale }}</b> {{ $t('common.TERMS.won') }}</span>
          </p>
          <div class="payment-lists">
            <p><span>{{ $t('bill.claim') }}</span> <span><b>{{ chart.totalValue | locale }}</b> {{ $t('common.TERMS.won') }}</span></p>
            <p><span>{{ $t('bill.correction') }}</span> <span><b>{{ chart.addValue | locale }}</b> {{ $t('common.TERMS.won') }}</span></p>
          </div>
        </div>

        <div class="-pies">
          <div
            class="chart-area"
            v-for="(pie) in chart.pieCharData "
            :key="pie.field"
          >
            <p class="name">
              {{ $t(pie.keyPath) || pie.name }}
            </p>
            <cmp-gauge
              :sweep-angle="360"
              :width="150"
              :thickness="thickness"
              :start-angle="90"
              :range-data="pie.chartData"
              :min-max="{ min: 0, max: chart.max || 0 }"
              :id="pie.field + '-'+ chart.dataCenter"
              :tooltip-content="gaugeTooltip(pie)"
            />
          </div>
        </div>
      </div>
      <!--
      <div class="detail-statistics flex-wrap">
        <div class="-left">
          <h6>송도</h6>
          <p class="-payment">
            <span>최종</span> <span><b>{{ songdoClaim + songdoCorrec | locale }}</b> 원</span>
          </p>
          <div class="payment-lists">
            <p><span>청구</span> <span><b>{{ songdoClaim | locale }}</b> 원</span></p>
            <p><span>추가</span> <span><b>{{ songdoCorrec | locale }}</b> 원</span></p>
          </div>
        </div>

        <div class="-pies">
          <div
            class="chart-area"
            v-for="(chart) in songdoPieCharData"
            :key="chart.field"
          >
            <p class="name">
              {{ chart.name }}
            </p>
            <cmp-gauge
              :sweep-angle="360"
              :width="150"
              :thickness="thickness"
              :start-angle="90"
              :range-data="chart.chartData"
              :min-max="{ min: 0, max: superTotal }"
              :id="chart.field + '-songdo'"
              :tooltip-content="gaugeTooltip(chart)"
            />
          </div>
        </div>
      </div> -->
      <!-- /. DR 서비스 -->
    </article>
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

export default {
  name: 'MonthlyBill',
  props: {
    dataCenter: {
      type: Array,
      required: true
    },
    status: {
      type: String,
      default: undefined
    },
    startDate: {
      type: String,
      default: undefined
    },
    endDate: {
      type: String,
      default: undefined
    },
    currentDate: {
      type: String,
      default: undefined
    },
    ownerCompanyIdx: {
      type: Number,
      default: null
    }
  },
  filters: {
    nameOfDataCenter (value) {
      if (typeof value === 'string') {
        return value.length >= 10 ? value.slice(0, 10) + '...' : value
      }
      return value
    }
  },
  computed: {
    dateFormat () {
      return this.defaultDate ? Dayjs(new Date(this.defaultDate)).format('YYYY.M') : ''
    }
  },
  watch: {
    async status (stat) {
      // this.getCompareChartData(stat)
      if (this.status === this.$t('bill.monthly')) {
        this.getRangeChartData(this.defaultDate)
      } else {
        this.initChart()
        if (this.startDate && this.endDate) {
          await this.getStartDateBillingData(this.startDate)
          await this.getEndDateBillingData(this.endDate)
        } else if (!this.startDate && !this.enddate) {
          await this.getStartDateBillingData(this.$options.filters.dateAdd(new Date(), 'month', -1))
          await this.getEndDateBillingData(new Date())
        }
      }
    },
    startDate (date) {
      if (this.endDate) {
        this.initChart()
        this.getStartDateBillingData(date)
      }
    },
    endDate (date) {
      if (this.startDate) {
        this.initChart()
        this.getEndDateBillingData(date)
      }
    },
    currentDate (date) {
      this.defaultDate = this.currentDate
      this.getRangeChartData(this.defaultDate)
    },
    async ownerCompanyIdx (val) {
      if (this.status === this.$t('bill.monthly')) {
        this.getRangeChartData(this.defaultDate)
      } else {
        this.initChart()
        if (this.startDate && this.endDate) {
          await this.getStartDateBillingData(this.startDate)
          await this.getEndDateBillingData(this.endDate)
        } else if (!this.startDate && !this.enddate) {
          await this.getStartDateBillingData(this.$options.filters.dateAdd(new Date(), 'month', -1))
          await this.getEndDateBillingData(new Date())
        }
      }
    }
  },
  async created () {
    await this.getMonthChartData()
    // this.getCompareChartData(this.status)
  },
  methods: {
    initChart () {
      this.twoCompare = []
      this.vcpuData2 = []
      this.chartDataList = []
    },
    async getStartDateBillingData (newDate) {
      try {
        this.isGetLoading = true
        newDate = new Date(newDate)
        // const monthBefore = new Date(newDate)
        // monthBefore.setMonth(monthBefore.getMonth() - 1)

        // const startDate = monthBefore.getFullYear() + '-' + (monthBefore.getMonth() < 9 ? '0' + (monthBefore.getMonth() + 1) : (monthBefore.getMonth() + 1))
        const endDate = newDate.getFullYear() +
       '-' + (newDate.getMonth() < 9 ? '0' + (newDate.getMonth() + 1) : (newDate.getMonth() + 1))

        this.startDateBillingData = await API.billing.getBillingReportRange({ startDate: endDate, endDate: endDate, ownerCompanyIdx: this.ownerCompanyIdx })

        this.setBillingChartData()
        this.isGetLoading = false
      } catch (err) {
        console.error(err)
        this.isGetLoading = false
      }
      // },

      // this.startDateBillingData = await API.billing.getGroupBillingReportByDate(date)
      // this.setBillingChartData()
    },
    async getEndDateBillingData (newDate) {
      try {
        this.isGetLoading = true
        newDate = new Date(newDate)
        // const monthBefore = new Date(newDate)
        // monthBefore.setMonth(monthBefore.getMonth() - 1)

        // const startDate = monthBefore.getFullYear() + '-' + (monthBefore.getMonth() < 9 ? '0' + (monthBefore.getMonth() + 1) : (monthBefore.getMonth() + 1))

        const endDate = newDate.getFullYear() +
       '-' + (newDate.getMonth() < 9 ? '0' + (newDate.getMonth() + 1) : (newDate.getMonth() + 1))

        this.endDateBillingData = await API.billing.getBillingReportRange({ startDate: endDate, endDate: endDate, ownerCompanyIdx: this.ownerCompanyIdx })

        this.setBillingChartData()
        this.isGetLoading = false
      } catch (err) {
        console.error(err)
        this.isGetLoading = false
      }

      // this.endDateBillingData = await API.billing.getGroupBillingReportByDate(date)
      // this.setBillingChartData()
    },
    settingChartDate (data) {
      let billingDate = null
      const curData = []
      const beforeData = []
      data.forEach(e => {
        billingDate = this.$options.filters.date(e.date, 'YYYY-MM')
        if (this.defaultDate === billingDate) {
          curData.push(e)
        } else {
          beforeData.push(e)
        }
      })
      this.rawRecentGroupBilling = curData
      this.lastMonthGroupBilling = beforeData
    },

    async getRangeChartData (newDate) {
      try {
        this.isGetLoading = true
        newDate = new Date(newDate)
        const monthBefore = new Date(newDate)
        monthBefore.setMonth(monthBefore.getMonth() - 1)

        const startDate = monthBefore.getFullYear() + '-' + (monthBefore.getMonth() < 9 ? '0' + (monthBefore.getMonth() + 1) : (monthBefore.getMonth() + 1))
        const endDate = newDate.getFullYear() +
       '-' + (newDate.getMonth() < 9 ? '0' + (newDate.getMonth() + 1) : (newDate.getMonth() + 1))

        const data = await API.billing.getBillingReportRange({ startDate: startDate, endDate: endDate, ownerCompanyIdx: this.ownerCompanyIdx })
        this.settingChartDate(data)
        this.setBillingChartData()
        this.isGetLoading = false
      } catch (err) {
        console.error(err)
        this.isGetLoading = false
      }
    },

    async getMonthChartData () {
      try {
        this.isGetLoading = true
        const data = await API.billing.getBillingReportNow({ ownerCompanyIdx: this.ownerCompanyIdx })
        this.defaultDate = this.$options.filters.date(this.currentDate, 'YYYY-MM')
        this.settingChartDate(data)
        this.setBillingChartData()
        this.isGetLoading = false
      } catch (error) {
        console.error(error)
        this.isGetLoading = false
      }

      // this.rawRecentGroupBilling = await API.billing.getBillingReportNow()
      // console.log(this.rawRecentGroupBilling)
      // debugger
      // if (this.rawRecentGroupBilling) {
      //   this.currentDate = `${new Date(this.rawRecentGroupBilling[0].billingDate).getFullYear()}.${new Date(this.rawRecentGroupBilling[0].billingDate).getMonth() + 1}`
      // }
      // this.lastMonthGroupBilling = await API.billing.getMonthBeforeGroupBilling()
      // this.setBillingChartData()
    },
    setBillingChartData () {
      if (this.status === this.$t('bill.monthly')) {
        this.setOnlyCompareData(this.rawRecentGroupBilling, this.lastMonthGroupBilling)
        this.setTwoCompareData(this.lastMonthGroupBilling, this.rawRecentGroupBilling)
      } else {
        this.setOnlyCompareData(this.endDateBillingData, this.startDateBillingData)
        this.setTwoCompareData(this.startDateBillingData, this.endDateBillingData)
      }

      // if (this.startDate && this.endDate) {
      //   this.setTwoCompareData(this.startDateBillingData, this.endDateBillingData)
      // } else {
      //   this.setTwoCompareData(this.lastMonthGroupBilling, this.rawRecentGroupBilling)
      // }
      this.getCompareChartData(this.status)
    },
    setOnlyCompareData (thisMonth, lastMonth) {
      const chartData = []
      let total = 0
      const chartMap = new Map()

      if (this.dataCenter) {
        this.dataCenter.forEach(d => {
          chartMap.set(d.cateKey, { dataCenter: d.cateKey.replace(/\?|\s/g, ''), origin: d.cateKey })
        })
      }

      const lastMonthTotalMap = new Map()
      if (thisMonth) {
        let obj = null
        thisMonth.forEach(m => {
          obj = chartMap.get(m.dataCenter)
          if (!obj) return
          total += m.total
          obj = {
            ...obj,
            dataCenter: m.dataCenter,
            serverCorrection: m.serverCorrection,
            groupCorrection: m.groupCorrection,
            distribute: m.distribute,
            heoseon: m.heoseon,
            sosan: m.sosan,
            hwSum: m.hwSum,
            swSum: m.swSum,
            addValue: (m.serverCorrection ? m.serverCorrection : 0) +
            (m.groupCorrection ? m.groupCorrection : 0),
            totalValue: (m.hwSum ? m.hwSum : 0) + (m.swSum ? m.swSum : 0) +
            (m.distribute ? m.distribute : 0) +
            (m.heoseon ? m.heoseon : 0) +
            (m.sosan ? m.sosan : 0),
            finalValue: m.total
          }
          chartMap.set(m.dataCenter, obj)
        })

        let lastMonthTotal = 0
        lastMonth.forEach(m => {
          lastMonthTotal = lastMonthTotalMap.has(m.dataCenter) ? lastMonthTotalMap.get(m.dataCenter) : 0
          lastMonthTotal += m.total
          lastMonthTotalMap.set(m.dataCenter, lastMonthTotal)
        })
      }

      chartMap.forEach((value, key) => {
        if (this.status === this.$t('bill.monthly')) {
          value.max = value.finalValue
        } else {
          if (lastMonthTotalMap.has(key)) {
            value.max = value.finalValue < lastMonthTotalMap.get(key) ? lastMonthTotalMap.get(key) : value.finalValue
          }
        }
        chartData.push(value)
      })
      // chartData.push(obj)
      this.superTotal = total
      this.chartDataList = chartData
      // this.superTotal = 0
      // let lastMonthTotal = 0
      // let total = 0
      // this.gimpoClaim = 0
      // this.songdoClaim = 0
      // this.gimpoCorrec = 0
      // this.songdoCorrec = 0
      // if (lastMonth.length > 0) {
      //   lastMonth.forEach(d => {
      //     lastMonthTotal += d.total
      //   })
      // }
      // if (thisMonth.length > 0) {
      //   thisMonth.forEach(d => {
      //     total += d.total
      //     this.gimpoClaim += d.gimpoDistribute + d.gimpoHwSum + d.gimpoSwSum
      //     this.songdoClaim += d.songdoDistribute + d.songdoHwSum + d.songdoSwSum + d.hoeseon + d.sosan
      //     this.gimpoCorrec += d.gimpoServerCorrection + d.gimpoGroupCorrection
      //     this.songdoCorrec += d.songdoServerCorrection + d.songdoGroupCorrection
      //   })
      // }
      this.onlyCompare = [{
        month: Dayjs(this.defaultDate).format('YYYY.M'),
        rate: total,
        color: '#d36ae6'
      }]
      // this.superTotal = total
      // this.totalGap = total - lastMonthTotal
      // this.totalGap >= 0 ? this.upDownArrow = '↑' : this.upDownArrow = '↓'

      /** TODO 이건 나중에 살리자 */
      this.dataCenterPriceInfo(thisMonth, lastMonth)
    },
    setTwoCompareData (arr1, arr2) {
      let arr1Total = 0
      let arr2Total = 0
      let date1 = ''
      let date2 = ''
      // this.superTotal = 0
      // this.gimpoClaim = 0
      // this.songdoClaim = 0
      // this.gimpoCorrec = 0
      // this.songdoCorrec = 0
      let valiArray = []
      if (arr1.length > 0) {
        arr1.forEach(d => {
          if (!this.dataCenter.find(e => d.dataCenter)) return
          valiArray.push(d)
          arr1Total += d.total
        })
      }
      arr1 = valiArray
      valiArray = []

      if (arr2.length > 0) {
        arr2.forEach(d => {
          if (!this.dataCenter.find(e => d.dataCenter)) return
          valiArray.push(d)
          arr2Total += d.total
          // this.gimpoClaim += d.gimpoDistribute + d.gimpoHwSum + d.gimpoSwSum
          // this.songdoClaim += d.songdoDistribute + d.songdoHwSum + d.songdoSwSum + d.hoeseon + d.sosan
          // this.gimpoCorrec += d.gimpoServerCorrection + d.gimpoGroupCorrection
          // this.songdoCorrec += d.songdoServerCorrection + d.songdoGroupCorrection
        })
      }
      arr2 = valiArray
      if (this.startdate) {
        const startDateArr = this.startDate.split('-')
        date1 = `${startDateArr[0]}.${startDateArr[1]}`
      } else if (arr1 && arr1.length > 0) {
        date1 = `${new Date(arr1[0].date).getFullYear()}.${new Date(arr1[0].date).getMonth() + 1}`
      }
      if (this.enddate) {
        const endDateArr = this.startDate.split('-')
        date2 = `${endDateArr[0]}.${endDateArr[1]}`
      } else if (arr2 && arr2.length > 0) {
        date2 = `${new Date(arr2[0].date).getFullYear()}.${new Date(arr2[0].date).getMonth() + 1}`
      }
      this.twoCompare = [
        {
          month: date1,
          rate: arr1Total,
          color: '#607bed'
        },
        {
          month: date2,
          rate: arr2Total,
          color: '#d36ae6'
        }
      ]
      this.date1 = date1
      this.date2 = date2
      // this.superTotal = arr2Total
      this.totalGap = arr2Total - arr1Total
      this.totalGap >= 0 ? this.upDownArrow = '↑' : this.upDownArrow = '↓'
      this.dataCenterPriceInfo(arr2, arr1)
    },
    dataCenterPriceInfo (recentList, monthList) {
      this.unitPriceMap = new Map()
      const getEachSums = (monthType, key) => {
        const reducer = (acc, curr) => acc + curr
        if (!monthType || monthType.length === 0) return 0
        return monthType.map(list => list[key] ? list[key] : 0).reduce(reducer)
      }

      const gaugeGraphSetting = (data, propsName) => {
        return propsName.map(items => {
          let chartData = []

          if (this.status === this.$t('bill.monthly')) {
            // 월별 그래프일 경우
            let max = 0
            if (data.length > 0) {
              max = getEachSums(data, items.field)
            }
            chartData = [{ field: items.field + '_data', max: max, color: '#d36ae6' }]
          } else {
            // 비교 그래프일 경우
            let list = []
            const color = ['#607bed', '#d36ae6']
            let monthType = null
            let max = 0
            // let total = 0
            chartData = color.map((color, idx) => {
              list = []
              monthType = idx === 0 ? monthList : recentList
              max = 0
              if (data && data.length > 0 && monthType.length > 0) {
                monthType.forEach(e => {
                  if (e.dataCenter === data[0].dataCenter) {
                    // total = 0
                    list.push(e)
                  }
                })
              }
              max = getEachSums(list, items.field)
              return { field: `${items.field}_compare${idx}`, max: max, color: color }
            })
          }
          return { ...items, chartData }
        })
      }

      // 김포 gauge 그래프 세팅
      if (this.chartDataList) {
        this.chartDataList.forEach(chart => {
          chart.pieCharData = gaugeGraphSetting([chart], JSON.parse(JSON.stringify(this.pieCharData)))
        })
      }
      // this.gimpoPieCharData = gaugeGraphSetting({})
      // // 송도 gauge 그래프 세팅
      // this.songdoPieCharData = gaugeGraphSetting({})
    },
    initVcpuChart (flex) {
      this.vcpuChart = flex
    },
    itemFormatter (engine, ht, defaultR) {
      engine.stroke = ht.item.color
      engine.fill = ht.item.color
      defaultR()
    },
    /**
     * 툴팁 설정
     */
    compareChartTooltip (ht) {
      const tooltipData = this.status === this.$t('bill.monthly') ? this.vcpuData : this.vcpuData2
      const result = tooltipData.map(data => {
        const innerText = data.month ? `
          ${Dayjs(new Date(data.month)).format('YYYY.M')}
            <span class="-name" style="color: ${data.color}">
              <b class="-value">${data.rate.toLocaleString()}</b> ${this.$t('common.TERMS.won')}
            </span>
          ` : `<span style="color: #bbb; line-height: 1.5">${this.$t('bill.noCompareData')}</span>`

        return `<p class="adm-chart-tooltip">${innerText}</p>`
      })

      return result.join('')
    },
    getCompareChartData (status) {
      if (status === this.$t('bill.compare')) {
        this.vcpuData2 = this.twoCompare
        this.thickness = 0.25
        if (this.startDate && this.endDate) {
          this.setTwoCompareData(this.startDateBillingData, this.endDateBillingData)
        }
      } else {
        this.vcpuData = this.onlyCompare
        this.thickness = 0.125
      }
    },
    setBarchartWidth (engine, ht, defaultFormat) {
      const elements = engine.element
      const series = elements.querySelectorAll('.wj-series-group g')
      series.forEach((s, idx) => {
        let transX
        if (series.length === 2) transX = 11
        else transX = 2
        s.setAttribute('style', `transform: translateX(${transX}px);`)
        s.querySelectorAll('rect').forEach(rect => {
          rect.setAttribute('width', 30)
          rect.setAttribute('x', rect.getAttribute('x') + 30)
        })
      })
    },
    gaugeTooltip (data) {
      const values = data?.chartData.map(c => c.max.toLocaleString())

      const gaugeData = this.status === this.$t('bill.compare') ? [
        { date: this.date1, color: '#607bed' }, { date: this.date2, color: '#d36ae6' }
      ] : [
        { date: this.defaultDate, color: '#d36ae6' }
      ]

      const innerText = gaugeData.map((val, idx) => {
        const { date, color } = val

        const hasData = date ? `
          ${Dayjs(new Date(date)).format('YYYY.M')} <span class="-name"> <b class="-value" style="color: ${color}">${values[idx]}</b> ${this.$t('common.TERMS.won')}</span>
        ` : `
          <span style="font-size: 12px; color: #bbb; line-height: 1.5">${this.$t('bill.noCompareData')}</span>
        `
        return `<p>${hasData}</p>`
      })

      return `<div class="adm-chart-tooltip -divided"> <strong>${this.$t(data?.keyPath) || data?.name}</strong> ${innerText.length > 1 ? innerText.join('') : innerText} </div>`
    }
  },
  data () {
    return {
      unitPriceMap: null,
      isGetLoading: false,
      chartDataList: [],
      defaultDate: '',
      date1: '',
      date2: '',
      filteredRecentGroupBilling: [],
      filteredLastMonthGroupBilling: [],
      filteredStartDateData: [],
      filteredEndDateData: [],
      superTotal: 0,
      // gimpoClaim: 0,
      // songdoClaim: 0,
      // gimpoCorrec: 0,
      // songdoCorrec: 0,
      startDateBillingData: [],
      endDateBillingData: [],
      upDownArrow: '',
      totalGap: 0,
      rawRecentGroupBilling: [],
      lastMonthGroupBilling: [],
      pieCharData: [
        {
          field: 'hwSum',
          name: 'H/W',
          price: 0,
          chartData: []
        },
        {
          field: 'swSum',
          name: 'S/W',
          price: 0,
          chartData: []
        },
        {
          field: 'heoseon',
          name: '회선',
          price: 0,
          chartData: [],
          keyPath: 'bill.circuit'
        },
        {
          field: 'sosan',
          name: '소산',
          price: 0,
          chartData: [],
          keyPath: 'bill.diss'
        },
        {
          field: 'distribute',
          name: '공통배분',
          price: 0,
          chartData: [],
          keyPath: 'bill.commonAllo'
        }
      ],
      // gimpoPieCharData: [
      //   {
      //     field: 'gimpoHwSum',
      //     name: 'H/W',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'gimpoSwSum',
      //     name: 'S/W',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'h',
      //     name: '회선',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 's',
      //     name: '소산',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'gimpoDistribute',
      //     name: '공통배분',
      //     price: 999999,
      //     chartData: []
      //   }
      // ],
      // songdoPieCharData: [
      //   {
      //     field: 'songdoHwSum',
      //     name: 'H/W',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'songdoSwSum',
      //     name: 'S/W',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'hoeseon',
      //     name: '회선',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'sosan',
      //     name: '소산',
      //     price: 999999,
      //     chartData: []
      //   },
      //   {
      //     field: 'songdoDistribute',
      //     name: '공통배분',
      //     price: 999999,
      //     chartData: []
      //   }
      // ],
      vcpuData: [],
      vcpuData2: [],
      onlyCompare: [
        // { month: '2019.09', rate: 6000, color: '#d36ae6' }
      ],
      twoCompare: [
        // { month: '2019.09', rate: 6000, color: '#d36ae6' },
        // { month: '2019.10', rate: 40000, color: '#607bed' }
      ],
      compareColor: ['rgba(255, 187, 85)'],
      vcpuChartBinding: [{ binding: 'rate' }],
      // rangeGaugeStacks: [],
      // compareData: {
      //   onlyRangeGaugeStacks: [
      //     { field: 'dfdf', max: 300, color: '#d36ae6' }
      //   ],
      //   twoRangeGaugeStacks: [
      //     { field: 'dfdf', max: 300, color: '#d36ae6' }, // 이번달
      //     { field: 'dd', max: 500, color: '#607bed' } // 지난달
      //   ]
      // },
      thickness: 0.25
    }
  }
}
</script>

<style lang="scss" scoped>
.monthly-bill-wrap {
  // barchart 비교 영역
  .-total-compare {
    flex: 0 0 280px;
    height: 420px;
    background: $black;
    border-radius: $radius-m;
    box-shadow: 2.5px 4.3px 5px 0 rgba(102, 102, 102, 0.1);
    margin-right: $gap;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: flex-start;
    justify-content: space-between;

    .-payment {
      text-align: center;
      line-height: 20px;
      min-height: 20px;
      > h6 {
        text-align: center;
        margin-top: $gap * 2;
        margin-bottom: 25px;
        color: $light-gray;
        font-size: 13px;
        line-height: 13px;
      }
      .-price {
        font-size: 24px;
        color: $vivid-pink;
      }
      .-comparing {
        margin-top: $gap-s;
        font-size: 12px;
        color: $light-gray;
        line-height: 12px;
        height: 12px;
        small {
          font-size: 12px;
          color: #f74b4b;
          .compare-icon {
            font-size: 10px;
            display: inline-block;
            height: 8px;
          }
        }
      }
    }
    .compare-chart {
      height: 250px;
      width: 150px;
      margin-bottom: $gap;
    }
  }

  // 통합 인프라 / DR 서비스 스타일
  .-total-detail {
    flex: 1 1 auto;
    flex-direction: column;
    align-self: flex-start;

    > div {
      border: solid 1px $main-black;
      flex: 0 0 200px;
      width: 100%;
      box-shadow: 2.5px 4.3px 5px 0 rgba(102, 102, 102, 0.1);
      border-radius: $radius-m;
      box-sizing: border-box;
    }

    & > .detail-statistics:not(:last-child) { margin-bottom: $gap; }

    .detail-statistics {
      > div {
        flex: 1 1 auto;
        height: 100%;
        box-sizing: border-box;

        &.-left {
          flex: 0 0 290px;
          height: 160px;
          padding: $gap-s 50px;
          border-right: 1px dashed $gray;

          h6 {
            font-size: 16px;
            line-height: 16px;
            font-weight: bold;
            letter-spacing: -0.4x;
            margin-bottom: $gap;
          }

          .-payment {
            display:flex;
            justify-content: space-between;
            margin-bottom: $gap;
            height: 17px;
            align-items: center;
            font-size: 13px;
            line-height: 13px;
            > span {
              > b {
                font-size: 20px;
                color: $vivid-pink;
              }
            }
          }

          .payment-lists {
            border-top: 1px solid $border-color;
            padding-top: $gap;
            > p {
              &:first-child { margin-bottom: $gap; }
              color: $light-gray;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              line-height: 13px;
              height: 13px;
              b { font-weight: normal; }
            }
          }
        }

        &.-pies {
          padding: 15px 50px;
          display: flex;
          align-items: center;

          .chart-area {
            position: relative;
            .name {
              position: absolute;
              display: flex;
              flex-direction: column;
              color: #b4b4b4;
              font-size: 16px;
              border-radius: 50%;
              top: calc(50% - 55px);
              left: calc(50% - 55px);
              width: 110px; height: 110px;
              align-items: center;
              justify-content: center;
              word-break: break-all;
              text-align: center;
              > b {
                color: $white;
                margin-top: 5px;
                display: block;
                line-height: 16px;
                > small {
                  font-weight: normal;
                  display: inline-block;
                  line-height: 13px;
                  font-size: 13px;
                }
              }
            }
            width: 150px;
            height: 150px;
            margin-right: 40px;
            &:last-child { margin: 0 }
          }
        }
      }
    }
  }
}
</style>
