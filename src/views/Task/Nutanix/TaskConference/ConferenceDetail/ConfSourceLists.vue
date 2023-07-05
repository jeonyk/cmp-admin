<!--
  * 파일명 : ConfSourceLists.vue
  * 파일 기능 : [사전협의 상세 > 사전협의 내용] 영역입니다. 하나의 결재에 들어있는 주문번호를 모두 모아 신규/변경/삭제 건으로 분리하여 보여줍니다.
  * 작성자 : 정재은
  * 최종 작성일 : 2020-12-09
  * License By Shinsegae I&C
  * 2020-12-09 update: 테스트 버그 수정완료
 -->

<template>
  <div class="conf-source">
    <div
      class="list-sect"
      v-for="confType in conferenceType"
      :key="`section_${confType.binding}`"
    >
      <span class="list-sect-title">{{ $t(confType.keyPath) }}</span>

      <div class="-lists tiny-scroll">
        <ul class="-lists">
          <li
            v-for="order in orderList[confType.binding]"
            :key="`${order.orderNo}`"
            :class="
              `${selectedOrder.orderNo}` === `${order.orderNo}` ? 'selected': undefined"
            @click="selectOrder(order)"
          >
            {{ orderStatus[order.status] }}
            {{ order.orderNo }}
            <!-- {{ '- 승인 || 반려' }} -->
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfSourceLists',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    data (data) {
      if (Object.keys(this.selectedOrder).length) this.selectedOrder = { ...this.selectedOrder }
      if (data.length) this.setData(JSON.parse(JSON.stringify(data)))
    }
  },
  created () {
    this.setData(JSON.parse(JSON.stringify(this.data)))
  },
  methods: {
    selectOrder (order) {
      this.selectedOrder = { ...order }
      this.$emit('selectedOrder', this.selectedOrder)
    },
    setData (data = this.data) {
      this.orderList = {
        newOrderList: [],
        changeOrderList: [],
        deleteOrderList: []
      }
      if (data.length) {
        data.forEach(order => {
          const orderType = order.orderInfo.orderType.toLowerCase()

          // 주문번호 설정
          const pushData = (list, field) => {
            return this.orderList[list].push({
              orderNo: order.orderInfo.orderNo,
              status: order.orderInfo.proceedStatus,
              serviceDate: order.orderInfo.serviceDate,
              field
            })
          }
          const setList = {
            new: () => pushData('newOrderList', this.$t('admin.PREF.new')), // 신규
            change: () => pushData('changeOrderList', this.$t('admin.PREF.change')), // 변경
            delete: () => pushData('deleteOrderList', this.$t('admin.PREF.delete')) // 삭제
          }

          return setList[orderType]()
        })
      }
    }
  },
  data () {
    return {
      conferenceType: [
        { label: '신규', binding: 'newOrderList', keyPath: 'common.TERMS.new' },
        { label: '변경', binding: 'changeOrderList', keyPath: 'common.BTN.change' },
        { label: '삭제', binding: 'deleteOrderList', keyPath: 'common.TERMS.delete' }
      ],
      orderStatus: {
        REJECT: `[${this.$t('common.BTN.TASK.reject')}]  `, // 반려
        DONE: `[${this.$t('common.BTN.TASK.ack')}]  ` // 승인
      },
      orderList: {
        newOrderList: [],
        changeOrderList: [],
        deleteOrderList: []
      },
      selectedOrder: {}
    }
  }
}
</script>

<style lang="scss" scoped>
.conf-source {
  display: flex;
  flex-direction: column;
  .list-sect {
    // flex: 0 0 250px;
    display: flex;
    align-items: center;
    min-height: 25px;
    height:auto;
    & + .list-sect {
      margin-top: $gap-s;
    }

    .list-sect-title {
      width:50px;
      display: inline-block;
      color: $color-lightgrey;
      font-size: 13px;
      // min-width: 76px;
      // margin-right: $gap;
    }

    .-lists {
      // flex: 1 1 auto;
      display: flex;
      flex-wrap: wrap;
      > li {
        margin: 2px 10px 2px 0;
        padding: 0 $gap-s;
        min-width: 140px;
        color: $color-lightgrey;
        line-height: 30px;
        text-align: center;
        border-radius: 14px;
        background-color: $purple-gray;
        cursor: pointer;
        transition: .4s ease;

        &:hover,
        &.selected {
          background: $primary;
          color: $white;
        }
      }
    }
  }
}
</style>
