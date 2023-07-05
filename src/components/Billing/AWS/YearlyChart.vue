<template>
  <section
    v-loading="isLoadingBillData"
    class="yearly-chart"
  >
    <div class="yearly-chart-head">
      <span class="title">
        연간 청구금액
      </span>
      <span class="year-range">
        ({{ dateRangeString }})
      </span>
    </div>
    <div class="yearly-chart-body">
      <div class="info-wrap">
        <div class="top">
          <div class="big-text">
            전체 사용 비용
          </div>
          <div class="date">
            ({{ dateRangeString }})
          </div>
        </div>
        <div class="bottom">
          {{ sumOfYearlyData }}
        </div>
      </div>
      <div class="chart-wrap">
        <wj-flex-chart
          v-if="billData.length"
          :palette="['#EE9659']"
          :items-source="billData"
          :tooltip-content="tooltipContent"
          binding-x="billDate"
        >
          <wj-flex-chart-series binding="cost" />
          <wj-flex-chart-axis
            wj-property="axisY"
            binding="cost"
            :item-formatter="yFormatter"
          />
          <wj-flex-chart-animation animation-mode="Point" />
        </wj-flex-chart>
        <div
          v-else
          class="empty-data"
          style="height: 100%;"
        >
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'
import ChartUtil from './ChartUtil'
import { mapGetters } from 'vuex'

import '@grapecity/wijmo.vue2.core'
import '@grapecity/wijmo.vue2.chart'
import '@grapecity/wijmo.vue2.chart.animation'

export default {
  name: 'YearlyChart',
  props: {
    groupIdx: {
      type: [Number, Object],
      default: null
    }
  },
  mixins: [ChartUtil],
  computed: {
    ...mapGetters({ getProject: 'project/getProject' }),
    beforeMonthString () {
      return dayjs().subtract(1, 'month').format('YYYY-MM')
    },
    beforeMonthDayjs () {
      return dayjs().subtract(1, 'month')
    },
    diffOneYear () {
      return this.beforeMonthDayjs.subtract(11, 'month').format('YYYY-MM')
    },
    dateRangeString () {
      return `${this.diffOneYear} ~ ${this.beforeMonthString}`
    },
    sumOfYearlyData () {
      const sum = this.billData.reduce((cur, next) => cur + next.cost, 0)
      return '$ ' + sum.toLocaleString()
    },
    allDate () {
      const dates = []

      for (let i = 0; i < 12; i++) {
        const date = dayjs(this.diffOneYear).add(i, 'month').format('YYYY-MM')
        dates.push(date)
      }

      return dates
    }
  },
  watch: {
    groupIdx (idx) {
      // this.billData = []
      // this.getBillProject()
      this.setBillByDate()
    }
  },
  created () {
    this.getBillProject()
  },
  methods: {
    tooltipContent (hit) {
      return `<div>
        ${hit.item.billDate} <strong>$ ${hit.item.cost.toLocaleString()}</strong>
      </div>`
    },
    yFormatter (_, label) {
      label.text = '$ ' + label.text
      return label
    },
    setBillByDate (billData = this.originBillData) {
      const dateMap = {}

      if (this.isSetFilter) {
        billData = billData.filter(bill => {
          const projectInfo = this.getProject(bill.projectIdx)
          return projectInfo && projectInfo.companyIdx === this.groupIdx
        })
      }

      billData.forEach(bill => {
        if (!dateMap[bill.billDate]) {
          dateMap[bill.billDate] = {
            cost: bill.cost,
            billDate: bill.billDate
          }
        } else {
          dateMap[bill.billDate].cost += bill.cost || 0
        }
      })

      const chart = []

      this.allDate.forEach(date => {
        if (!dateMap[date]) {
          dateMap[date] = {
            cost: 0,
            billDate: date
          }
        }
      })

      Object.keys(dateMap).forEach(key => {
        chart.push({ billDate: key, cost: dateMap[key].cost })
      })

      chart.sort((a, b) => {
        return new Date(a.billDate).getTime() - new Date(b.billDate).getTime()
      })

      this.billData = chart
    },
    getFilteredBillData () {
      // 필터링 여부에 따라 포함시킬 프로젝트 필터링
      return this.billData.filter(bill => {
        const projectInfo = this.getProject(bill.projectIdx)
        if (projectInfo && projectInfo.companyIdx === this.groupIdx) return true
        return false
      })
    },
    async getBillProject () {
      try {
        this.isLoadingBillData = true

        const { data } = await API.aws.getBillingByDateAdm(this.diffOneYear, this.beforeMonthString)

        this.originBillData = data
        this.setBillByDate(data)
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingBillData = false
      }
    }
  },
  data: () => ({
    billData: [],
    originBillData: [],
    isLoadingBillData: false
  })
}
</script>

<style lang="scss" scoped>
.yearly-chart {
  margin-top: 60px;

  &-head {
    margin-bottom: 40px;

    .title {
      font-size: 18px;
      font-weight: bold;
    }

    .year-range {
      font-size: 13px;
      font-weight: bold;
      margin-left: 5px;
    }
  }

  &-body {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;

    .info-wrap {
      border-radius: 6px;
      background-color: #070A20;
      margin-right: $gap;
      width: 285px;
      height: 390px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .top {
        .big-text {
          font-size: 28px;
          font-weight: bold;
          width: 100%;
          text-align: center;
        }

        .date {
          font-size: 13px;
          font-weight: bold;
          text-align: center;
          margin: $gap-s 0;
        }
      }

      .bottom {
        margin-top: 100px;
        color: #F4A462;
        font-size: 28px;
        font-weight: bold;
      }
    }

    .chart-wrap {
      width: 100%;
    }
  }
}
</style>
