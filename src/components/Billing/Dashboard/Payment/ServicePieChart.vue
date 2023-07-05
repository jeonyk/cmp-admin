<template>
  <div class="service-pie">
    <div
      v-if="donutData.length"
      class="service-pie-wrap"
    >
      <wj-flex-pie
        :palette="palette"
        :inner-radius="0.5"
        :items-source="donutData"
        :style="{ width: '160px', height: '160px', marginLeft: '20px' }"
        :tooltip-content="ht => setTooltipContent(ht, $billBoard.boardType !== 'aws')"
        :rendered="onRenderedChart"
        binding-name="label"
        binding="value"
      >
        <wj-flex-chart-legend position="None" />
        <wj-flex-chart-animation
          animation-mode="All"
          easing="Linear"
          :duration="300"
        />
        <wj-flex-pie-data-label
          v-if="$billBoard.boardType !== 'aws'"
          position="Center"
          :content="getLabelContent"
        />
      </wj-flex-pie>
      <billing-chart-labels
        :items="labels"
        :palette="palette"
      />
    </div>
    <div
      v-else
      class="empty-data"
    >
      {{ $v('데이터가 없습니다.') }}
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { BillingChartLabels } from '@sd-fe/cmp-core'

export default {
  name: 'ServicePieChart',
  components: {
    BillingChartLabels
  },
  inject: ['$bill', '$billBoard'],
  props: {
    /** @type {import('Vue').PropType<string[]>} */
    palette: {
      type: Array,
      default: () => (['#5462FF', '#79CA28', '#FFB540', '#B262F2', '#FE3D80'])
    },
    /** @type {import('Vue').PropType<string | number | null>} */
    selectedRegion: {
      type: [String, Number],
      default: null
    }
  },
  computed: {
    isAws () {
      return this.$billBoard.boardType === 'aws'
    },
    /**
     * 선택된 리전의 차트 데이터 리턴
     */
    donutData () {
      if (!this.isAws && !this.selectedRegion) return []

      if (!this.isAws) {
        const data = this.$billBoard.billData.regions
          .filter(region => region.region === this.selectedRegion)
          .find(region => region.date === dayjs(this.$bill.monthly).format('YYYY-MM'))
        const donut = data?.value || []

        if (donut.every(d => d.value === 0)) {
          return donut.map(d => ({ ...d, value: 1, fixedZero: true }))
          // return []
        }
        return donut
      } else {
        const targetDate = this.$bill.activeTab === 'monthly'
          ? dayjs(this.$bill.monthly).format('YYYY-MM')
          : dayjs(this.$bill.endDate).format('YYYY-MM')

        const regionData = this.$billBoard.billData.regions
        const billDataByDate = regionData.filter(region => region.date === targetDate)

        billDataByDate.sort((a, b) => b.value - a.value)

        const topData = billDataByDate.slice(0, 4).map(region => ({
          label: region.displayName,
          value: region.value,
          fullLabel: region.fullDisplayName
        }))
        const restData = billDataByDate.slice(4)
        const restSum = restData.reduce((acc, cur) => acc + cur.value, 0)

        topData.push({
          label: '기타',
          value: restSum,
          fullLabel: '기타'
        })

        if (topData && topData.length && topData.every(data => data.value === 0)) {
          return topData.map(data => ({ ...data, value: 1, fixedZero: true }))
        }

        return topData
      }
    },
    /**
     * 선택된 리전의 모든 라벨 리턴
     */
    labels () {
      return this.donutData.map(donut => ({ label: donut.label, fullLabel: this.isAws ? donut.fullLabel : donut.label }))
    }
  },
  methods: {
    setTooltipContent (ht, isPrivate) {
      return `
        <strong class="title">
          ${this.isAws ? ht.item.fullLabel : ht.item.label}
        </strong>
        <div class="value">
          ${isPrivate ? '' : '<span class="prefix">$</span>'}
          ${ht.item.fixedZero ? 0 : this.$options.filters.moneyFormat(ht.item.value)}
          ${isPrivate ? '<span class="suffix">원</span>' : ''}
        </div>
      `
    },
    /**
     * 라벨 설정
     */
    getLabelContent (ht) {
      return ht.item.value ? ht.name : ''
    },
    /**
     * 차트 렌더링 이후 최초 1번 사이즈, 스타일 조정
     */
    onRenderedChart (chart) {
      if (!this.settled) {
        const format = this.$i18n.locale === 'ko' ? 'M월' : 'MMM'
        let dateFormat

        if (this.$billBoard.boardType === 'aws') {
          dateFormat = this.$bill.activeTab === 'monthly'
            ? dayjs(this.$bill.monthly).format(format)
            : dayjs(this.$bill.endDate).format(format)
        } else {
          dateFormat = dayjs(this.$bill.monthly).format(format)
        }

        chart.innerText = dateFormat
        chart.innerTextStyle = { fontSize: '20px', fill: 'white' }
        chart.plotMargin = -7.5

        this.settled = true
      }
    }
  },
  data: () => ({
    settled: false
  })
}
</script>

<style lang="scss" scoped>
.service-pie {
  &-wrap {
    &::v-deep {
      .wj-flexchart {
        .wj-data-labels {
          .wj-data-label {
            fill: $white;
          }
        }
      }
    }
  }

  .empty-data {
    margin-top: 80px;
  }
}
</style>
