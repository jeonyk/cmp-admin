<template>
  <div style="display:flex; align-items:center;">
    <el-tooltip
      effect="light"
      placement="top"
      :disabled="!failMessage"
    >
      <cmp-status-tag
        :type="workItemState.type"
        :contents="workItemState.state"
        tooltip-position="bottom"
        :tag-type="workItemState.tagType"
        style="margin-right:10px;"
      />

      <div slot="content">
        {{ failMessage }}
      </div>
    </el-tooltip>

    <button
      v-if="status === 'FAILING'"
      @click="isVisible = true "
      class="button"
      size="is-mini"
    >
      {{ $v('상태 처리') }}
    </button>

    <el-tooltip
      effect="light"
      :content="$v('이전 작업 완료 후 작업 가능합니다')"
      placement="top-start"
    />

    <task-cancel-modal
      :is-visible="isVisible"
      @close="isVisible = false"
      @confirm="($event) => {
        $emit('set-success', $event)
      }"
    />
  </div>
</template>

<script>
import TaskCancelModal from '@/components/Modal/TaskCancelModal/TaskCancelModal.vue'
export default {
  components: {
    TaskCancelModal
  },
  props: {
    status: {
      type: String,
      default: ''
    },
    failMessage: { // 실패 사유 툴팁
      type: String,
      default: ''
    }
  },
  computed: {
    workItemState () {
      return {
        INIT: { state: this.$v('대기'), type: 'is-pending' },
        READY_TO_WORK: { state: this.$v('대기'), type: 'is-pending' },
        SCHEDULED: { state: this.$v('자동 작업대기'), type: 'is-pending' },
        SCHEDULE_PAUSED: { state: this.$v('자동 작업중지'), type: 'is-fail' },
        WORKING: { state: this.$v('진행중'), type: 'is-loading', tagType: 'progress' },
        SUCCESS: { state: this.$v('성공'), type: 'is-success' },
        FAIL_AS_SUCCESS: { state: this.$v('성공'), type: 'is-success' },
        FAILING: { state: this.$v('실패'), type: 'is-fail' },
        FAIL_CONFIRMED: { state: this.$v('실패'), type: 'is-fail' },
        CANCELED_AT_REVIEW: { state: '', type: '' },
        CANCELED_AT_TODO: { state: '', type: '' },
        CANCELLING: { state: '', type: '' },
        DELETE_STANDBY: { state: this.$v('삭제대기'), type: 'is-fail' }
      }[this.status] ?? ''
    }
  },
  data () {
    return {
      isVisible: false
    }
  },
  methods: {
  }
}
</script>
