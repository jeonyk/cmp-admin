<!--
  * 파일명 : ApprovalProcess.vue
  * 파일 기능 : [결재상세 > 결재선] 모달 팝업 데이터
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div>
    <section class="process-position-wrap">
      <article
        class="process-list"
        v-for="(process, index) in data"
        :key="process.stage + index"
      >
        <h5>
          <span v-if="process.type==='S'">{{ $t('task.PAY.title') }}</span> <!--결재-->
          <span v-else-if="process.type==='M'">{{ $t('task.PAY.agree') }}</span> <!--합의-->
        </h5>

        <div class="-info">
          <p>{{ process.userPosition ? process.userPosition : '-' }}</p>
          <p class="-name">
            {{ process.userName }}
          </p>
          <p>
            <span v-if="process.status==='DONE'">{{ $t('common.BTN.TASK.ack') }}</span> <!--승인-->
            <span v-else-if="process.status==='REJECT'">{{ $t('common.BTN.TASK.reject') }}</span> <!--반려-->
            <span v-else> - </span>
          </p>
          <p>
            <span v-if="process.approvalTime">{{ process.approvalTime |date('YYYY.MM.DD HH:mm') }}</span>
            <span v-else>-</span>
          </p>
        </div>
      </article>
    </section>

    <section class="">
      <cmp-grid
        :item-source="data"
        :columns="processDetailColumns"
        :paging-size="20"
        is-read-only
      >
        <template #userName="props">
          {{ props.row.userPosition }} - {{ props.row.userName }}
        </template>
        <template #type="props">
          <span v-if="props.row.type==='S'">{{ $t('task.PAY.title') }}</span><!--결재-->
          <span v-else-if="props.row.type==='M'">{{ $t('task.PAY.agree') }}</span><!--합의-->
        </template>
        <template #allocationDate="props">
          {{ props.row.allocationDate |date('YYYY.MM.DD HH:mm') }}
        </template>
        <template #confirmTime="props">
          {{ props.row.confirmTime |date('YYYY.MM.DD HH:mm') }}
        </template>
        <template #approvalTime="props">
          {{ props.row.approvalTime |date('YYYY.MM.DD HH:mm') }}
        </template>
      </cmp-grid>
    </section>
  </div>
</template>

<script>
export default {
  name: 'ApprovalProcess',
  props: {
    data: {
      type: Array,
      default () {
        return []
      }
    }
  },
  created () {
  },
  methods: {

  },
  data () {
    return {
      processDetailColumns: [
        { header: 'NO', binding: 'no', sorting: false },
        { header: '결재자', binding: 'userName', sorting: false, width: 200, customHtml: true, keyPath: 'task.PAY.DETAIL.approver' },
        { header: '결재유형', binding: 'type', sorting: false, width: 200, customHtml: true, keyPath: 'task.PAY.DETAIL.type' },
        { header: '배정일시', binding: 'allocationDate', sorting: false, customHtml: true, dataType: 'Date', keyPath: 'task.PAY.DETAIL.assign' },
        { header: '확인일시', binding: 'confirmTime', sorting: false, customHtml: true, dataType: 'Date', keyPath: 'task.PAY.DETAIL.confirmDate' },
        { header: '결재일시', binding: 'approvalTime', sorting: false, customHtml: true, dataType: 'Date', keyPath: 'task.PAY.DETAIL.date' },
        { header: '비고', binding: 'note', sorting: false, width: 200, keyPath: 'common.PLACEHOLDER.remark' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.process-position-wrap {
  display: flex;
  align-items: center;
  margin-bottom: 60px;
  width: 95%;
  display: flex;
  justify-content: space-between;

  > .process-list {
    // border: 1px solid pink;
    flex: 1 1 auto;
    display: flex;
    margin-right: 70px;
    max-width: 300px;
    min-height: 150px;
    position: relative;
    &:after {
      content: '';
      position: absolute;
      top: calc(50% - 10px); left: calc(100% + 28px);
      width: 20px; height: 20px;
      box-sizing: border-box;
      border-left: 15px solid $primary;
      border-right: 10px solid transparent;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
    }
    &:last-child {
      margin: 0;
      &:after {
        content: none;
      }
    }

    > h5 {
      background: $dark-slate;
      // border-radius: $radius;
      flex: 0 0 25%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    > .-info {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid $dark-slate;
      > p {
        color: $color-lightgrey;
        border-bottom: 1px solid $dark-slate;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 90%;
        flex: 1 1 auto;
        &:last-child {
          border: none;
        }
      }
      > .-name {
        flex: 0 0 60px;
      }
    }
  }
}
</style>
