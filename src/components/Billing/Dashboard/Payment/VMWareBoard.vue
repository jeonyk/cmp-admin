<template>
  <board
    money-display-type="won"
    :board-type="boardType"
  >
    <template #header>
      <img
        :src="require('@/assets/images/clouds/badge_icon_vmware.svg')"
        alt="badge-icon-vmware"
        class="badge-icon"
      >
      <img
        :src="require('@/assets/images/clouds/badge_logo_vmware.svg')"
        alt="badge-logo-vmware"
        class="badge-logo"
      >
    </template>
    <private-board-body
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
  name: 'VMWareBoard',
  inject: ['$bill'],
  mixins: [BoardCoupling, BoardPrivateCoupling],
  components: {
    Board,
    PrivateBoardBody
  },
  methods: {
    /**
     * CSP Billing Board - VMWare
     * 빌링 정보 조회 (VMWare)
     */
    getBillingData (groups, tab, start, end, monthly) {
      this.getBillingAll()
      // this.billDataLoading = true

      // return new Promise((resolve, reject) => {
      //   this.billDataLoading = true

      //   setTimeout(() => {
      //     this.billData = {
      //       totalPrice: 90000000,
      //       amountPrice: 90000000,
      //       correctionPrice: 25000,
      //       comparePrevMonth: 20000000,
      //       prevMonthPrice: 70000000,
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
    boardType: 'vmw',
    normalStackPalette: ['#79CA28', '#EEFACC'],
    compareStackPalette: ['#43770F', '#79CA28', '#BFDA71', '#EEFACC'],
    compareStackTextColor: '#BFDA71'
  })
}
</script>

<style lang="scss" scoped>

</style>
