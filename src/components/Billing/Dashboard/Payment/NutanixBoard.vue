<template>
  <board
    money-display-type="won"
    :board-type="boardType"
  >
    <template #header>
      <img
        :src="require('@/assets/images/clouds/badge_icon_nutanix.svg')"
        alt="badge-icon-nutanix"
        class="badge-icon"
      >
      <img
        :src="require('@/assets/images/clouds/badge_logo_nutanix.svg')"
        alt="badge-logo-nutanix"
        class="badge-logo"
      >
    </template>
    <private-board-body
      :key="renderKey"
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
import BoardPrivateCoupling from './Board.private.coupling'
import PrivateBoardBody from './PrivateBoardBody.vue'

export default {
  name: 'NutanixBoard',
  inject: ['$bill'],
  mixins: [BoardCoupling, BoardPrivateCoupling],
  components: {
    Board,
    PrivateBoardBody
  },
  methods: {
    /**
     * CSP Billing Board - Nutanix
     * 빌링 정보 조회 (뉴타닉스)
     */
    getBillingData () {
      this.getBillingAll()
      // return new Promise((resolve, reject) => {
      //   this.billDataLoading = true

      //   setTimeout(() => {
      //     this.billData = {
      //       totalPrice: 90000000,
      //       amountPrice: 90000000,
      //       correctionPrice: 25000,
      //       comparePrevMonth: 20000000,
      //       prevMonthPrice: 70000000,
      //       // services: [
      //       //   {
      //       //     label: 'H/W',
      //       //     value: 75000
      //       //   },
      //       //   {
      //       //     label: 'S/W',
      //       //     value: 250000
      //       //   },
      //       //   {
      //       //     label: '회선',
      //       //     value: 70000
      //       //   },
      //       //   {
      //       //     label: '소산',
      //       //     value: 120000
      //       //   }
      //       // ],
      //       regions: [
      //         {
      //           region: '마포센터',
      //           value: [
      //             {
      //               label: 'H/W',
      //               value: 35000
      //             },
      //             {
      //               label: 'S/W',
      //               value: 40000
      //             },
      //             {
      //               label: '회선',
      //               value: 50000
      //             },
      //             {
      //               label: '소산',
      //               value: 70000
      //             }
      //           ],
      //           date: dayjs(this.$bill.monthly)
      //             .add(-1, 'month')
      //             .format('YYYY-MM')
      //         },
      //         {
      //           region: '김포센터',
      //           value: [
      //             {
      //               label: 'H/W',
      //               value: 15000
      //             },
      //             {
      //               label: 'S/W',
      //               value: 30000
      //             },
      //             {
      //               label: '회선',
      //               value: 40000
      //             },
      //             {
      //               label: '소산',
      //               value: 50000
      //             }
      //           ],
      //           date: dayjs(this.$bill.monthly)
      //             .add(-1, 'month')
      //             .format('YYYY-MM')
      //         },
      //         {
      //           region: '마포센터',
      //           value: [
      //             {
      //               label: 'H/W',
      //               value: 22000
      //             },
      //             {
      //               label: 'S/W',
      //               value: 33000
      //             },
      //             {
      //               label: '회선',
      //               value: 87000
      //             },
      //             {
      //               label: '소산',
      //               value: 10000
      //             }
      //           ],
      //           date: dayjs(this.$bill.monthly).format('YYYY-MM')
      //         },
      //         {
      //           region: '김포센터',
      //           value: [
      //             {
      //               label: 'H/W',
      //               value: 12000
      //             },
      //             {
      //               label: 'S/W',
      //               value: 15000
      //             },
      //             {
      //               label: '회선',
      //               value: 30000
      //             },
      //             {
      //               label: '소산',
      //               value: 35000
      //             }
      //           ],
      //           date: dayjs(this.$bill.monthly).format('YYYY-MM')
      //         }
      //       ]
      //     }
      //     this.billDataLoading = false
      //   }, 1000)
      // })
    }
  },
  data: () => ({
    boardType: 'nx',
    normalStackPalette: ['#5667FF', '#63E3FF'],
    compareStackPalette: ['#5667FF', '#66B6FF', '#80EFD5', '#E2F1FF'],
    compareStackTextColor: '#66B6FF'
  })
}
</script>

<style lang="scss" scoped></style>
