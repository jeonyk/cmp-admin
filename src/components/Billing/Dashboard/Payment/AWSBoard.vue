<template>
  <board
    money-display-type="dollar"
    :board-type="boardType"
  >
    <template #header>
      <img
        :src="require('@/assets/images/clouds/badge_icon_aws.svg')"
        alt="badge-icon-aws"
        class="badge-icon"
      >
      <img
        :src="require('@/assets/images/clouds/badge_logo_aws.svg')"
        alt="badge-logo-aws"
        class="badge-logo"
      >
    </template>
    <public-board-body
      :board-type="$bill.activeTab"
      :current-month="formattedCurrentMonth"
      :prev-month="formattedPrevMonth"
      :main-color="mainColor"
      :stack-palette="normalStackPalette"
      :compare-palette="compareStackPalette"
      :compare-stack-text-color="compareStackTextColor"
    />
  </board>
</template>

<script>
import Board from './Board.vue'
import BoardCoupling from './Board.coupling'
import PublicBoardBody from './PublicBoardBody.vue'
import dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'
// import { flatten } from 'lodash'

const awsRegion = [
  {
    regionName: 'ap-northeast-2',
    displayName: '아시아 태평양 (서울)'
  },
  {
    regionName: 'ap-south-1',
    displayName: '아시아 태평양 (뭄바이)'
  },
  {
    regionName: 'ap-southeast-1',
    displayName: '아시아 태평양 (싱가포르)'
  },
  {
    regionName: 'ap-southeast-2',
    displayName: '아시아 태평양 (시드니)'
  },
  {
    regionName: 'ca-central-1',
    displayName: '캐나다 (중부)'
  },
  {
    regionName: 'eu-central-1',
    displayName: '유럽 (프랑크푸르트)'
  },
  {
    regionName: 'eu-north-1',
    displayName: '유럽 (스톡홀름)'
  },
  {
    regionName: 'eu-west-1',
    displayName: '유럽 (아일랜드)'
  },
  {
    regionName: 'ap-northeast-1',
    displayName: '아시아 태평양 (도쿄)'
  },
  {
    regionName: 'ap-northeast-3',
    displayName: '아시아 태평양 (오사카)'
  },
  {
    regionName: 'eu-west-2',
    displayName: '유럽 (런던)'
  },
  {
    regionName: 'eu-west-3',
    displayName: '유럽 (파리)'
  },
  {
    regionName: 'sa-east-1',
    displayName: '남아메리카 (상파울루)'
  },
  {
    regionName: 'us-east-1',
    displayName: '미국 동부 (버지니아)'
  },
  {
    regionName: 'us-east-2',
    displayName: '미국 동부 (오하이오)'
  },
  {
    regionName: 'us-west-1',
    displayName: '미국 서부 (캘리포니아)'
  },
  {
    regionName: 'us-west-2',
    displayName: '미국 서부 (오레곤)'
  }
].map(t => ({ ...t, displayName: t.displayName.split('(')[1].replace(')', ''), fullDisplayName: t.displayName }))

export default {
  name: 'AWSBoard',
  mixins: [BoardCoupling],
  components: {
    Board,
    PublicBoardBody
  },
  computed: {
    filterGroupIdxs () {
      return this.$bill.filterGroups.map(group => group.groupIdx)
      // return this.$bill.allGroupIdxList
    }
  },
  created () {
    awsRegion.forEach(region => {
      this.awsRegionMap.set(region.regionName, region)
    })
  },
  methods: {
    /**
     * CSP Billing Board - AWS
     * 빌링 정보 조회 (AWS)
     */
    async getBillingData (groups, tab, start, end, monthly) {
      this.billDataLoading = true

      try {
        // const groupIdxList = this.$bill.allGroupIdxList
        const groupIdxList = this.filterGroupIdxs

        if (tab === 'monthly') {
          const sourceDate = dayjs(new Date(monthly)).format('YYYY-MM')
          const targetDate = this.$bill.prevMonthDate
          // 월별
          // 전&이번 청구 금액, 리전별 청구 금액
          const { data: compareData } = await API.aws.getBillComparison({
            sourceDate,
            targetDate,
            groupIdxList
          })
          // 리전별
          const { data: regionData } = await API.aws.getRegionBillByGroup({
            startDate: sourceDate,
            endDate: sourceDate,
            groupIdxList
          })

          this.billData = {
            totalPrice: compareData.sourceCost || 0,
            amountPrice: compareData.sourceCost || 0, // 이게 맞냐
            correctionPrice: 0,
            comparePrevMonth: compareData.comparisonCost || 0,
            prevMonthPrice: compareData.targetCost || 0,
            regions: regionData.map(region => ({
              fullDisplayName: this.awsRegionMap.get(region.regionName)?.fullDisplayName,
              displayName: this.awsRegionMap.get(region.regionName)?.displayName,
              value: region.cost,
              date: region.billDate
            }))
          }
        } else {
          // 비교
          const sourceDate = dayjs(new Date(end)).format('YYYY-MM')
          const targetDate = dayjs(new Date(start)).format('YYYY-MM')

          const { data: compareData } = await API.aws.getBillComparison({
            sourceDate,
            targetDate,
            groupIdxList
          })

          const { data: regionData } = await API.aws.getRegionBillByGroup({
            startDate: targetDate,
            endDate: sourceDate,
            groupIdxList
          })

          this.billData = {
            totalPrice: compareData.sourceCost || 0,
            amountPrice: compareData.sourceCost || 0, // 이게 맞냐
            correctionPrice: 0,
            comparePrevMonth: compareData.comparisonCost || 0,
            prevMonthPrice: compareData.targetCost || 0,
            regions: regionData.map(region => ({
              fullDisplayName: this.awsRegionMap.get(region.regionName)?.fullDisplayName,
              displayName: this.awsRegionMap.get(region.regionName)?.displayName,
              value: region.cost,
              date: region.billDate
            }))
          }
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.billDataLoading = false
      }
      // return new Promise((resolve, reject) => {
      //   this.billDataLoading = true

      //   let startDate
      //   let endDate

      //   if (tab === 'monthly') {
      //     startDate = dayjs(monthly)
      //       .add(-1, 'month')
      //       .format('YYYY-MM')
      //     endDate = dayjs(monthly).format('YYYY-MM')
      //   } else {
      //     startDate = dayjs(start).format('YYYY-MM')
      //     endDate = dayjs(end).format('YYYY-MM')
      //   }

      //   const rand = () => Math.floor(Math.random() * 10000000 + 10000) + 10000

      //   setTimeout(() => {
      //     this.billData = {
      //       totalPrice: 90000000,
      //       amountPrice: 90000000,
      //       correctionPrice: 25000,
      //       comparePrevMonth: 20000000,
      //       prevMonthPrice: 70000000,
      //       regions: flatten([startDate, endDate].map(date =>
      //         awsRegion.map(region => ({ ...region, date, value: rand() }))
      //       ))
      //     }
      //     this.billDataLoading = false
      //   }, 2000)
      // })
    }
  },
  data: () => ({
    boardType: 'aws',
    normalStackPalette: ['#ED7A11', '#FFC466'],
    compareStackPalette: ['#43770F', '#79CA28', '#BFDA71', '#EEFACC'],
    compareStackTextColor: '#FFC466',
    awsRegionMap: new Map()
  })
}
</script>

<style lang="scss" scoped></style>
