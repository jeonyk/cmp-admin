<template>
  <div class="billing-dashboard">
    <billing-group-filter
      v-loading="treeLoading"
      @want-update-groups="onUpdateBillByGroups"
      @tree-loaded="onTreeLoaded"
    />
    <payment-wrapper @want-update-tab="onUpdateBillByTabs" />
    <tab-wrapper />
  </div>
</template>

<script>
import { BillingGroupFilter, BillingTreeUtil } from '@sd-fe/cmp-core'
import PaymentWrapper from '@/components/Billing/Dashboard/Payment/Wrapper.vue'
import TabWrapper from '@/components/Billing/Dashboard/Tabs/TabWrapper.vue'
import dayjs from 'dayjs'

export default {
  name: 'BillingDashboard',
  components: {
    BillingGroupFilter,
    PaymentWrapper,
    TabWrapper
  },
  provide () {
    /**
     * 자식 깊이와 상관없이 모든 자식에 관계사/조직 필터 데이터를 넘겨준다.
     */
    const data = {};

    ['allGroupIdxListWithCompany', 'allGroupIdxList', 'prevMonthDate', 'filterGroups', 'activeTab', 'monthly', 'startDate', 'endDate', 'formattedMonthly', 'formattedStartDate', 'formattedEndDate', 'isSameCurrentInMonthly'].forEach(
      key =>
        Object.defineProperty(data, key, {
          get: () => this[key],
          enumerable: true
        })
    )

    return {
      $bill: data
    }
  },
  computed: {
    // Monthly 일 때, 이전달
    prevMonthDate () {
      return dayjs(new Date(this.monthly))
        .add(-1, 'month')
        .format('YYYY-MM')
    },
    allGroupIdxList () {
      if (!this.filterGroups || !this.filterGroups.length) return []

      const groupIdxList = []

      this.filterGroups.forEach(group => {
        BillingTreeUtil.traverse(group, (node) => {
          groupIdxList.push(node.groupIdx)
        })
      })

      return groupIdxList
    },
    allGroupIdxListWithCompany () {
      if (!this.filterGroups || !this.filterGroups.length) return []

      const groupIdxList = []
      const companyIdxList = []

      this.filterGroups.forEach(group => {
        if (!group.groupUpper) {
          companyIdxList.push(group.groupIdx)
          return
        }
        BillingTreeUtil.traverse(group, (node) => {
          groupIdxList.push(node.groupIdx)
        })
      })

      return {
        groupIdxList,
        companyIdxList
      }
    },
    formattedMonthly () {
      return dayjs(new Date(this.monthly)).format('YYYY-MM')
    },
    formattedStartDate () {
      return dayjs(new Date(this.startDate)).format('YYYY-MM')
    },
    formattedEndDate () {
      return dayjs(new Date(this.endDate)).format('YYYY-MM')
    },
    isSameCurrentInMonthly () {
      return this.activeTab === 'monthly' && dayjs(new Date()).format('YYYY-MM') === this.formattedMonthly
    },
    // 필터링 날짜가 현재 날짜를 포함하는지
    isIncludeSameCurrentDate () {
      if (this.activeTab === 'monthly') {
        return this.formattedMonthly === dayjs(new Date()).format('YYYY-MM')
      } else {
        const current = dayjs(new Date()).format('YYYY-MM')
        return this.formattedStartDate === current || this.formattedEndDate === current
      }
    }
  },
  created () {
    this.initFilterDate()
  },
  methods: {
    onTreeLoaded () {
      this.treeLoading = false
    },
    /**
     * 월별/비교 탭 및 날짜 초기화
     */
    initFilterDate () {
      this.activeTab = 'monthly'
      this.monthly = dayjs(new Date())
        .add(-1, 'month')
        .toDate()
      this.startDate = dayjs(new Date())
        .add(-2, 'month')
        .toDate()
      this.endDate = dayjs(new Date())
        .add(-1, 'month')
        .toDate()
    },
    /**
     * 관계사/조직 필터링 변경
     */
    onUpdateBillByGroups (groups) {
      this.filterGroups = groups
    },
    /**
     * 월별/비교 탭, 날짜 변경
     */
    onUpdateBillByTabs ({ activeTab: tab, monthly, start, end }) {
      this.activeTab = tab
      this.monthly = monthly
      this.startDate = start
      this.endDate = end
    }
  },
  data: () => ({
    filterGroups: [],
    activeTab: '',
    monthly: null,
    startDate: null,
    endDate: null,
    treeLoading: true
  })
}
</script>

<style lang="scss" scoped>
.billing-dashboard {
  margin: 40px 0;
}
</style>
