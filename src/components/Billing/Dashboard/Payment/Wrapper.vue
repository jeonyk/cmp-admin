<template>
  <div class="wrapper">
    <div class="wrapper-title">
      청구 금액
    </div>
    <filter-date
      @change-date="onChangeDate"
      @change-tab="onChangeTab"
    />
    <!-- 복수 CSP/단일 CSP -->
    <div class="boards">
      <nutanix-board />
      <vmw-board />
      <aws-board />
    </div>
  </div>
</template>

<script>
import { BillingGroupFilterDate } from '@sd-fe/cmp-core'
import NutanixBoard from './NutanixBoard.vue'
import VmwBoard from './VMWareBoard.vue'
import AWSBoard from './AWSBoard.vue'

export default {
  name: 'PaymentWrapper',
  components: {
    'filter-date': BillingGroupFilterDate,
    'nutanix-board': NutanixBoard,
    'vmw-board': VmwBoard,
    'aws-board': AWSBoard
  },
  methods: {
    emitFilter (activeTab, start, end, monthly) {
      this.$emit('want-update-tab', {
        activeTab,
        monthly,
        start,
        end
      })
    },
    /**
     * FilterDate - 필터 시작일 / 종료일 변경 이벤트
     */
    onChangeDate ({ startDate, endDate, monthly }, tab) {
      this.emitFilter(tab, startDate, endDate, monthly)
    },
    onChangeTab (activeTab, { start, end, monthly }) {
      this.emitFilter(activeTab, start, end, monthly)
    }
  },
  data: () => ({})
}
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: 40px 0;

  &-title {
    font-weight: bold;
    font-size: 18px;
  }

  .boards {
    width: 100%;
    margin-top: 40px;
    display: flex;
    flex-wrap: wrap;

    & > .board + .board {
      margin-top: $gap-m;
    }

    .board {
      width: 100%;
    }
  }
}
</style>
