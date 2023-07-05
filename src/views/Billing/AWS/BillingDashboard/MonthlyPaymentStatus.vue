<!--
  * 파일명 : MonthlyPaymentStatus.vue
  * 파일 기능 : [빌링 > 대시보드 > 월별 청구추세] 차트를 입력합니다. 외부에서 날짜를 받아 데이터를 보여줍니다.
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-01-11
  * License By Shinsegae I&C
  * 2021-01-11 Update: 빌링 월별 청구 추세 툴팁 수정 및 사용하지 않는 메서드 삭제
 -->

<template>
  <section class="monthly-paymeny-status-wrap">
    <cmp-chart
      :items-source="statusData.all.data"
      :adjust-col-width="{ set: true, width: 30 }"
      :initialized="initVcpuChart"
      binding-x="month"
      selection-mode="Point"
      :tooltip-content="tooltipContent"
      :chart-binding="vcpuChartBinding"
      :palette="otherData.palette"
      :x-axis-line="true"
      v-if="statusData.all.data.length > 0"
    />
    <div
      v-else
      class="empty-zone"
    >
      {{ $t('common.PLACEHOLDER.noData') }}
    </div>
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

export default {
  name: 'MonthlyPaymentStatus',
  props: {
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
    ownerCompanyIdx: {
      type: Number,
      default: null
    },
    dataCenter: {
      type: Array,
      default: null
    }
  },
  watch: {
    status (stat) {
      this.otherData = this.statusData[this.typeCheck(stat)]
      this.getAllPrice()
    },
    startDate (date) {
      this.totPriceData = []
      if (this.startDate && this.endDate) {
        this.getMonthlyBilling(this.startDate, this.endDate)
      }
    },
    endDate (date) {
      this.totPriceData = []
      if (this.startDate && this.endDate) {
        this.getMonthlyBilling(this.startDate, this.endDate)
      }
    },
    ownerCompanyIdx (val) {
      this.totPriceData = []
      if (this.startDate && this.endDate) {
        this.getMonthlyBilling(this.startDate, this.endDate)
      } else {
        this.initData()
      }
    }
  },
  async created () {
    this.dataCenterMap = new Map()
    if (this.dataCenter && this.dataCenter.length > 0) {
      this.dataCenter.forEach(e => {
        this.dataCenterMap.set(e.cateKey, true)
      })
    }

    this.otherData = this.statusData[this.typeCheck(this.status)]
    await this.initData()
  },
  methods: {
    // 데이트 선택시 그래프
    async initData () {
      await this.getMonthlyBilling(this.startDate, this.endDate)
    },
    async getMonthlyBilling (start, end) {
      this.totPriceData = []
      const period = {
        startDate: start,
        endDate: end,
        ownerCompanyIdx: this.ownerCompanyIdx
      }
      if (start && end) {
        this.rawMonthlyBilling = await API.billing.getBillingReportRange(period)
      }
      console.log('가져온 api', this.rawMonthlyBilling)
      this.rawMonthlyBilling.map(m => {
        if (!this.dataCenterMap.has(m.dataCenter)) return
        const date = Dayjs(m.date).format('YYYY.M')

        this.totPriceData.push({
          dataCenter: m.dataCenter,
          month: date,
          rate: m.total
        })// end of push
      })// end of map

      this.getAllPrice()
    },
    getAllPrice (status = this.status) {
      this.statusData.all.data = []
      const priceMap = new Map()
      let obj = {}
      this.totPriceData.map(m => {
        if (status !== null && status !== '전체' && status !== 'All' && m.dataCenter !== status) return
        if (priceMap.has(m.month)) {
          obj = priceMap.get(m.month)
          obj.rate += m.rate
        } else {
          obj = { dataCenter: m.dataCenter, month: m.month, rate: m.rate }
        }
        priceMap.set(m.month, obj)
      })
      priceMap.forEach((value, key) => {
        this.statusData.all.data.push(value)
      })
    },
    typeCheck (type) {
      let name
      if (type === '전체' || type === 'All') name = 'all'
      if (type === '김포') name = 'integInfra'
      if (type === '송도') name = 'drSvc'

      return name
    },
    initVcpuChart (flex) {
      this.vcpuChart = flex
    },
    /**
     * 툴팁 설정
     */
    tooltipContent (ht) {
      const localeCost = ht.y.toLocaleString()
      return `<p class="adm-chart-tooltip">
          ${ht.item.month}
          <span
            class="-name"
            style="color: ${this.otherData.palette[0]}"
          >
            <b class="-value">${localeCost}</b> ${this.$t('common.TERMS.won')}
          </span>
      </p>`
    }
  },
  data () {
    return {
      dataCenterMap: null,
      otherData: undefined,
      rawMonthlyBilling: [],
      totPriceData: [],
      statusData: {
        all: {
          palette: ['rgba(115, 117, 218, 1)'],
          data: []
        },
        integInfra: {
          palette: ['rgba(141, 208, 191, 1)'],
          data: []
        },
        drSvc: {
          palette: ['rgba(137, 211, 240, 1)'],
          data: []
        }
      },
      vcpuChartBinding: [{ name: 'vCPU 가상화율', binding: 'rate' }]
    }
  }
}
</script>
