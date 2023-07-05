<template>
  <div class="compare-chart">
    <h1>월별 청구금액</h1>
    <div class="compare-chart-flex">
      <div class="chart-wrap">
        <div class="compare-head">
          <div class="txt">
            청구금액 비교
          </div>
          <div class="option">
            <span>비교 월</span>
            <el-date-picker
              v-model="bindDate"
              type="month"
              format="yyyy-MM"
              :picker-options="datePickerOptions"
              :clear-icon="null"
            />
          </div>
        </div>
        <div
          v-loading="isLoadingGetLatestBilling"
          class="fixed-height-line bar-chart"
        >
          <wj-flex-chart
            :palette="barChartPalette"
            :items-source="barChartData"
            :rendering="onRenderingChart"
            :rendered="onRenderedChart"
            :tooltip-content="tooltipContent"
            binding-x="date"
          >
            <wj-flex-chart-series binding="sum" />
            <wj-flex-chart-axis
              wj-property="axisY"
              binding="sum"
              position="None"
              :max="barChartMaxData"
            />
            <wj-flex-chart-data-label content="$ {y}" />
            <wj-flex-chart-animation animation-mode="Point" />
          </wj-flex-chart>
        </div>
      </div>
      <div class="grid-wrap">
        <div class="title">
          프로젝트 별 청구금액 비교
        </div>
        <div class="fixed-height-line grid-block">
          <cmp-grid
            :columns="columns"
            :item-source="billDataFromBeforeDate"
            :paging-size="5"
          >
            <template #cost="{ row }">
              $ {{ row.cost | localeString }} {{ getDiffBeforeCost(row) }}
            </template>
            <template #projectInfouserName="{row}">
              <template v-if="row.projectInfo && row.projectInfo.userName">
                {{ row.projectInfo.userName }} ({{ row.projectInfo.userId | maskingName }})
              </template>
            </template>
          </cmp-grid>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import columns from './CompareChart.columns'
import { mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'
import ChartUtil from './ChartUtil'

export default {
  name: 'CompareChart',
  props: {
    groupIdx: {
      type: [Number, Object],
      default: null
    }
  },
  filters: {
    localeString (v) {
      if (!v) return ''
      return v.toLocaleString()
    }
  },
  mixins: [ChartUtil],
  computed: {
    ...mapGetters({
      getProject: 'project/getProject'
    }),
    billData () {
      return this.isSetFilter ? this.getFilteredDataByGroupIdx() : this.originBillData
    },
    // 현재 월
    nowDate () {
      return dayjs().format('YYYY-MM')
    },
    // 전월
    beforeDate () {
      return dayjs()
        .subtract(1, 'month')
        .format('YYYY-MM')
    },
    // 전전월
    twoMonthAgoDate () {
      return dayjs()
        .subtract(2, 'month')
        .format('YYYY-MM')
    },
    // 빌링 데이터 중에 전월 데이터와 똑같은 놈
    billDataFromBeforeDate () {
      return this.billData.filter(bill => bill.billDate === this.beforeDate)
    },
    // 빌링 데이터 중에 비교 데이터와 똑같은 놈
    billDataFromCompareDate () {
      return this.billData.filter(bill => bill.billDate === this.compareDate)
    },
    compareDate () {
      if (!this.bindDate) return
      return dayjs(this.bindDate).format('YYYY-MM')
    },
    // 막대 차트 데이터
    barChartData () {
      const chartData = []
      const sumOfBeforeDateCost = this.billDataFromBeforeDate.reduce(
        (cur, next) => cur + next.cost,
        0
      )
      const beforeDate = { sum: sumOfBeforeDateCost, date: this.beforeDate || this.twoMonthAgoDate }

      if (!this.billDataFromCompareDate.length) {
        chartData.push({ sum: 0, date: this.compareDate || this.twoMonthAgoDate })
      } else {
        const sumOfCompareDateCost = this.billDataFromCompareDate.reduce(
          (cur, next) => cur + next.cost,
          0
        )
        chartData.push({ sum: sumOfCompareDateCost, date: this.compareDate })
      }

      chartData.push(beforeDate)

      return chartData
    },
    barChartMaxData () {
      return Math.max(...this.barChartData.map(d => d.sum)) * 2
    }
  },
  watch: {
    bindDate: {
      handler (date) {
        this.getLatestBillingData(this.compareDate || this.twoMonthAgoDate)
      }
    }
  },
  created () {
    this.bindDate = this.twoMonthAgoDate
  },
  methods: {
    /**
     * groupIdx로 빌링 정보 필터링
     */
    getFilteredDataByGroupIdx () {
      return this.originBillData.filter(bill => {
        return bill.projectInfo && bill.projectInfo.companyIdx === this.groupIdx
      })
    },
    getDiffBeforeCost (row) {
      const data = this.billData.filter(bill => {
        return bill.billDate !== row.billDate && bill.projectIdx === row.projectIdx
      })
      const diff = row.cost - (data && data.length ? data[0].cost : 0)
      return `(${diff > 0 ? '+$ ' + diff.toLocaleString() : '-$ ' + (diff * -1).toLocaleString()})`
    },
    tooltipContent (hit) {
      return `<div>${hit.item.date}
        <strong>$ ${hit.item.sum.toLocaleString()}</strong>
      </div>`
    },
    onRenderedChart (chart) {
      const { hostElement } = chart

      // 막대 색상 조정
      this.barChartEl = hostElement
      this.barChartEl
        .querySelectorAll('.wj-series-group rect')
        .forEach((el, elIdx) => {
          const width = el.width.baseVal.value
          const defaultX = Number(el.x.baseVal.valueAsString)
          el.width.baseVal.value = 30
          el.x.baseVal.valueAsString = defaultX + width / 2 - 30 / 2
          el.setAttribute('fill', this.barChartPalette[elIdx])
          el.setAttribute('stroke', this.barChartPalette[elIdx])
        })

      // 거리 조정
      const dataLabel = this.barChartEl
        .querySelectorAll('.wj-data-labels text')

      const originFirstY = dataLabel[0].getAttribute('y')
      const originSecondY = dataLabel[1].getAttribute('y')
      const originFirstX = dataLabel[0].getAttribute('x')
      const originSecondX = dataLabel[1].getAttribute('x')

      dataLabel[0].setAttribute('y', originFirstY - this.yLabelDistanceManipulate)
      dataLabel[1].setAttribute('y', originSecondY - this.yLabelDistanceManipulate)
      dataLabel[0].setAttribute('x', parseInt(originFirstX) + this.distanceManipulate)
      dataLabel[1].setAttribute('x', parseInt(originSecondX) - this.distanceManipulate)

      // 막대 거리 조정
      const seriesGroup = this.barChartEl
        .querySelectorAll('.wj-series-group rect')

      seriesGroup.forEach((series, seriesIdx) => {
        const distance = seriesIdx === 0 ? this.distanceManipulate : -(this.distanceManipulate)
        const originX = series.getAttribute('x')
        const afterX = parseInt(originX) + distance

        series.setAttribute('x', afterX)
      })

      // axis 위치 조정
      const axisX = this.barChartEl
        .querySelectorAll('.wj-axis-x text')

      axisX.forEach((axis, axisIdx) => {
        const distance = axisIdx === 0 ? this.distanceManipulate : -(this.distanceManipulate)
        const originX = axis.getAttribute('x')
        const afterX = parseInt(originX) + distance

        axis.setAttribute('x', afterX)
      })
    },
    onRenderingChart (chart, e) {
      chart.axisY.position = 'None'
    },
    async getLatestBillingData (date) {
      try {
        this.isLoadingGetLatestBilling = true

        const { data } = await API.aws.getLatestBillingAdm({
          searchDate: date
        })

        this.originBillData = data.map(bill => {
          return {
            ...bill,
            projectInfo: this.getProject(bill.projectIdx)
          }
        })
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingGetLatestBilling = false
      }
    }
  },
  data: root => ({
    bindDate: null,
    columns: columns(root),
    isLoadingGetLatestBilling: false,
    // billData: [],
    originBillData: [],
    barChartEl: null,
    barChartPalette: ['#7681FF', '#D36AE6'],
    datePickerOptions: {
      disabledDate (time) {
        const today = new Date().toDateString()
        const beforeMonth = dayjs().subtract(1, 'month').format('YYYY-MM')
        return (
          time.getTime() > new Date(today) ||
          dayjs(time.getTime()).format('YYYY-MM') === dayjs().format('YYYY-MM') ||
          dayjs(beforeMonth).format('YYYY-MM') === dayjs(time.getTime()).format('YYYY-MM')
        )
      }
    },
    // 거리 조정
    distanceManipulate: 10,
    // 거리 조정 2
    yLabelDistanceManipulate: 10
  })
}
</script>

<style lang="scss" scoped>
.compare-chart {
  h1 {
    margin: 40px 0 20px 0;
    font-size: 18px;
  }

  &-flex {
    display: flex;
    flex-wrap: nowrap;

    .chart-wrap {
      flex: 0 0 285px;
      width: 285px;
      margin-right: $gap;

      .compare-head {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        align-items: center;
        height: 30px;
        margin-bottom: $gap;

        .option {
          span {
            margin-right: 5px;
          }

          &::v-deep {
            .el-date-editor {
              width: 120px;

              .el-input__inner {
                border: none;
                border-bottom: 1px solid $purple-gray;
              }
            }
          }
        }
      }
    }

    .grid-wrap {
      flex: 1 0 auto;

      .title {
        height: 30px;
        display: flex;
        align-items: center;
      }
    }

    .fixed-height-line {
      box-sizing: border-box;
      height: 305px;
      overflow-y: hidden;

      &.grid-block {
        margin-top: $gap;
        overflow-y: hidden;
      }

      &.bar-chart {
        background-color: #070a20;
        border-radius: 6px;
        padding: $gap;
        display: flex;
        justify-content: center;
        align-items: center;

        &::v-deep {
          .wj-flexchart {
            background-color: #070a20;
            height: 220px;
            width: 285px;
            overflow: hidden;

            .wj-data-labels {
              text {
                font-size: 16px;
                font-weight: bold;
                text-align: center;
              }

              :first-child {
                fill: white;
              }

              :last-child {
                fill: #D36AE6;
              }
            }
          }
        }
      }
    }
  }
}
</style>
