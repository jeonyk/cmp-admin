<!--
  * 파일명 : DraftApprove.vue
  * 파일 기능 : [결재상세페에지 > 상단 승인자] 정보를 보여줍니다.
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-12-19
  * License By Shinsegae I&C
  * 2020-12-19 fix: 결재함 css 수정
 -->

<template>
  <article class="draft-approve">
    <h3>{{ title }}</h3>
    <template v-for="(list,idx) in data">
      <div
        class="approver-list-wrap"
        :key="idx + '_approved_list'"
      >
        <el-popover
          placement="left"
          :trigger="list.note ? 'hover' : null"
          :width="200"
          popper-class="-scroll"
          :content="list.note"
        >
          <ul
            class="approver_info"
            slot="reference"
          >
            <li class="approver-info-item">
              <!-- 결재/합의 -->
              {{ list.type === 'S' ? $t('task.PAY.title') : $t('task.PAY.agree') }}
            </li>
            <li> {{ list.userPosition }}</li>
            <li class="-name">
              {{ list.userName }}
            </li>
            <li>
              <span v-if="list.status==='DONE'">{{ $t('common.BTN.TASK.ack') }}</span> <!--승인-->
              <span v-else-if="list.status==='REJECT'">{{ $t('common.BTN.TASK.reject') }}</span> <!--반려-->
              <span v-else>-</span>
            </li>
            <li>
              <span v-if="list.approvalTime">{{ list.approvalTime|date('YYYY.MM.DD HH:mm') }} </span>
              <span v-else>-</span>
            </li>
          </ul>
        </el-popover>
      </div>
    </template>
  </article>
</template>
<script>
export default {
  name: 'DraftApprove',
  props: {
    data: {
      type: Array,
      default () {
        return []
      }
    },
    title: {
      type: String,
      default: ''
    }
  }
}
</script>
<style lang="scss" scoped>
  .draft-approve {
    display: flex;
    > * {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    > h3 {
      width: 60px;
      padding: $gap-s ;
      border: 1px solid $dark-slate;
      background-color: $dark-slate;
    }
    .approver-list-wrap {
      // flex: 1 1 auto;
      border: 1px solid $dark-slate;
      .approver_info {
        // flex: 1 1 auto;
        border-right: 1px solid $dark-slate;
        &:last-child { border: none; }
        > li {
          border-bottom: 1px solid $dark-slate;
          text-align: center;
          line-height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 $gap-s;
          min-height: 25px;
          min-width: 100px;
          white-space: nowrap;
          &.-name {
            height: 50px;
          }
          &:last-child {
            border: none;
          }
        }
      }
    }
  }
</style>
