<template>
  <div class="tab-chart">
    <h3>{{ fieldName }} 월별 청구 금액 (최근 12개월)</h3>
    <template v-if="!isDataLoading && existData">
      <div class="tab-chart-labels">
        <billing-chart-labels
          :palette="lineChartPalette"
          :items="chartLabels"
        />
      </div>
      <cmp-chart
        v-if="yMax.max"
        :rendered="onRendered"
        :chart-binding="chartBinding"
        :items-source="chartData"
        :palette="lineChartPalette"
        :y-min-max="yMax"
        :tooltip-content="tooltipContent"
        chart-type="Area"
        binding-x="date"
        x-axis-line
        :x-title="xTitle"
      />
    </template>
    <template v-else>
      <div class="empty-data">
        {{ $v('데이터가 없습니다.') }}
      </div>
    </template>
    <!-- <el-dialog
      :visible="isActiveModal"
      @close="isActiveModal = false"
    >
      <div v-if="clickItem">
        {{ clickItem.item }}
      </div>
    </el-dialog> -->
    <billing-report-modal
      v-if="field !== 'aws'"
      with-modal
      :active="isActiveModal"
      :batch-id="clickItem ? clickItem.item[clickItem.ht].batch : null"
      :batch-date="clickItem ? new Date(clickItem.item.date).getTime() : null"
      is-include-correction
      @close="isActiveModal = false"
    />
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { flatten } from 'lodash'
import API, { BillingChartLabels, BillingReportModal } from '@sd-fe/cmp-core'

export default {
  name: 'TabChart',
  components: {
    BillingChartLabels,
    BillingReportModal
  },
  props: {
    rawTab: {
      type: Object,
      required: true
    },
    /** @type {import('Vue').PropType<string>} */
    field: {
      type: String,
      default: ''
    }
  },
  created () {
    this.setDateRange(new Date())
    this.setChartData()
  },
  computed: {
    yMax () {
      const binds = this.chartBinding.map(cb => cb.name)
      const nums = this.chartData.map(data => binds.map(bind => data[bind]?.value))

      return {
        min: 0,
        max: Math.max(...flatten(nums))
      }
    },
    fieldName () {
      return this.field === 'aws'
        ? '리전'
        : '데이터센터'
    },
    xTitle () {
      return this.field === 'aws'
        ? '(단위: $)'
        : '(단위: 원)'
    },
    isPrivate () {
      return this.rawTab.target === 'private'
    },
    moduleType () {
      return this.rawTab.moduleType
    },
    startDateOfRange () {
      return this.dateRange[0]
    },
    endDateOfRange () {
      return this.dateRange[this.dateRange.length - 1]
    }
  },
  methods: {
    tooltipContent (ht) {
      this.currentOnMouseItem = ht.item
      this.currentOnMouseItemName = ht.name

      return `<div class="tooltip">
        <div class="tooltip-title">
          <strong>${ht.x} ${ht.name}</strong>
        </div>
        <div class="tooltip-value">
          ${this.field === 'aws' ? '$' : ''} ${this.$options.filters.moneyFormat(ht.y || 0)} ${this.field !== 'aws' ? '원' : ''}
        </div>
      </div>`
    },
    onRendered (chart) {
      this.chart = chart

      if (this.chart.hostElement) {
        const ellipse = Array.from(
          this.chart.hostElement.querySelectorAll('ellipse') || []
        )

        ellipse.forEach(node => {
          node.style.cursor = 'pointer'
          node.addEventListener('click', e => {
            this.clickItem = { item: this.currentOnMouseItem, ht: this.currentOnMouseItemName }

            if (this.currentOnMouseItem[this.currentOnMouseItemName]?.batch) {
              this.isActiveModal = !this.isActiveModal
            } else {
              return this.$alert(this.$v('해당년월에 과금 정보가 없습니다.'))
            }
          })
        })
      }
    },
    /**
     * 12개월 범위를 설정한다.
     */
    setDateRange (now) {
      if (!now) now = new Date()

      const result = []

      for (let i = 12; i > 0; i--) {
        result.push(
          dayjs(now)
            .add(-i, 'month')
            .format('YYYY-MM')
        )
      }

      this.dateRange = result
    },
    /**
     * 차트 데이터를 설정한다.
     */
    async setChartData () {
      await this.getChartData()
      this.setChartLabels()
      this.setChartBinding()
    },
    /**
     * 차트 라벨을 설정한다.
     */
    setChartLabels () {
      if (!this.chartData.length) return

      const { date, ...labels } = this.chartData[0]
      this.chartLabels = Object.keys(labels).map(label => ({ label }))
    },
    /**
     * 차트 바인딩을 설정한다.
     */
    setChartBinding () {
      this.chartBinding = this.chartLabels.map(({ label }) => ({
        name: label,
        binding: label + '.value',
        chartType: this.field === 'aws' ? 'Line' : 'LineSymbols',
        splineStyle: { symbolSize: 12 }
      }))
    },
    /**
     * 차트 데이터 조회
     */
    async getChartData () {
      if (this.isPrivate) await this.getPrivateChartData()
      else await this.getPublicChartData()
      // try {
      //   this.isDataLoading = true

      //   console.log(tabField)

      //   this.chartData = this.dateRange.map(date => ({
      //     date,
      //     '데이터센터 A': Math.floor(Math.random() * 100 + 1) + 1,
      //     '데이터센터 B': Math.floor(Math.random() * 100 + 1) + 1,
      //     '데이터센터 C': Math.floor(Math.random() * 100 + 1) + 1
      //   }))
      // } catch (error) {
      //   console.log(error)
      //   this.$alert(this.$v('{name} 월별 청구 금액 조회에 실패하였습니다.', { name: this.fieldName }))
      // } finally {
      //   this.isDataLoading = false
      // }
    },
    async getPrivateChartData () {
      try {
        this.isDataLoading = true

        const { data } = await API.billing.getReportRegionTop5({
          isTop: false,
          moduleType: this.moduleType,
          dateType: 'RANGE',
          dateList: [this.startDateOfRange, this.endDateOfRange]
        })

        // 모든 리전
        const allRegions = [...new Set(data.map(bill => bill.dataCenter))]

        this.chartData = this.dateRange.map(date => {
          const chartData = { date }

          allRegions.forEach(region => {
            // 기본 값 0, 배치 없음
            chartData[region] = { value: 0, batch: null }
          })

          // chartData = { date: '2023-04', '김포': { value: 0, batch: ? }}

          // 리전을 찾아야됨 지금 date랑 맞는거
          // 근데 리전은 여러 개임 그래서 Filter
          const dateBilling = data.filter(bill => dayjs(bill.billingDate).format('YYYY-MM') === date)

          if (dateBilling && dateBilling.length) {
            dateBilling.forEach(bill => {
              chartData[bill.dataCenter] = {
                value: bill.total,
                batch: bill.batchId
              }
            })
          }

          return chartData
        })

        this.existData = !!data.length
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('{name} 월별 청구 금액 조회에 실패하였습니다.', { name: this.fieldName }))
      } finally {
        this.isDataLoading = false
      }
    },
    async getPublicChartData () {
      try {
        const { data } = await API.aws.getRegionBillByGroup({
          startDate: this.startDateOfRange,
          endDate: this.endDateOfRange
        })
        const { data: regions } = await API.aws.getRegions()

        // 리전 키:값 매핑
        const regionMap = new Map()
        const removeBracket = (displayName) => displayName.split('(')[1].split(')')[0]

        regions.forEach(region => {
          regionMap.set(region.regionName, removeBracket(region.displayName))
        })

        // 모든 리전
        const allRegions = [...new Set(data.map(t => t.regionName))]
        const regionSumMap = new Map()

        allRegions.forEach(region => {
          const onlyRegion = data.filter(t => t.regionName === region)
          const sum = onlyRegion.reduce((acc, cur) => acc + cur.cost, 0)

          regionSumMap.set(region, sum || 0)
        })

        // TOP 4
        let sortedRegionSum = Array.from(regionSumMap.entries())
        sortedRegionSum.sort((a, b) => b[1] - a[1])
        sortedRegionSum = sortedRegionSum.slice(0, 4)

        const top4PriceRegion = sortedRegionSum.map(data => data[0])

        this.chartData = this.dateRange.map(date => {
          const chartData = { date }
          let extraSum = 0

          allRegions.forEach(region => {
            const localRegionData = data.find(bill => bill.billDate === date && bill.regionName === region)
            if (top4PriceRegion.includes(region)) {
              chartData[regionMap.get(region)] = { value: localRegionData?.cost || 0, batch: null }
            } else {
              extraSum += localRegionData?.cost || 0
            }
          })

          chartData['기타'] = {
            value: extraSum,
            batch: null
          }

          // allRegions.forEach(region => {
          //   // 기본 값 0, 배치 없음
          //   chartData[region] = { value: 0, batch: null }
          // })

          // // chartData = { date: '2023-04', '김포': { value: 0, batch: ? }}

          // // 리전을 찾아야됨 지금 date랑 맞는거
          // // 근데 리전은 여러 개임 그래서 Filter
          // const dateBilling = data.filter(bill => dayjs(bill.billingDate).format('YYYY-MM') === date)

          // if (dateBilling && dateBilling.length) {
          //   dateBilling.forEach(bill => {
          //     chartData[bill.dataCenter] = {
          //       value: bill.total,
          //       batch: bill.batchId
          //     }
          //   })
          // }

          return chartData
        })
        this.existData = !!data.length
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('{name} 월별 청구 금액 조회에 실패하였습니다.', { name: this.fieldName }))
      } finally {
        this.isDataLoading = false
      }
    }
  },
  data: () => ({
    lineChartPalette: ['#EE9659', '#16A3BF', '#73A1F5', '#B262F2', '#79CA28'],
    chart: null,
    currentOnMouseItem: null,
    currentOnMouseItemName: null,
    clickItem: null,
    isActiveModal: false,
    dateRange: [],
    chartData: [],
    chartLabels: [],
    chartBinding: [],
    isDataLoading: false,
    existData: false
  })
}
</script>

<style lang="scss" scoped>
.tab-chart {
  &-labels {
    margin: 40px 0 10px 0;
    display: flex;
    justify-content: flex-end;
  }

  &::v-deep {
    .wj-flexchart {
      .wj-axis-x .wj-line {
        stroke: $input-placeholder;
        opacity: 0.75;
      }
    }
  }

  .empty-data {
    min-height: 300px;
  }
}
</style>
