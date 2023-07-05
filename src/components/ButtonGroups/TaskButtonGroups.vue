<template>
  <div
    v-if="show"
    style="display:flex; gap:10px;"
  >
    <button
      v-if="isCanceled"
      :disabled="!isEditable || isDisabled"
      class="button"
      @click="$emit('restore')"
    >
      {{ $v('주문 복원') }}
    </button>
    <button
      v-else
      :disabled="!isEditable || isCanceled || isDisabled"
      class="button"
      @click="$emit('cancel')"
    >
      {{ $v('주문 취소') }}
    </button>
    <button
      :disabled="!isEditable || isCanceled || isDisabled"
      class="button"
      @click="$emit('set')"
    >
      {{ $v('예약 설정') }}
    </button>
    <!-- <button
      v-if="$field_V3() ==='CONFERENCE'"
      :disabled="!isEditable || $orderType() === 'DELETE' || isCanceled || isDisabled"
      class="button"
      type="is-primary"
      @click="$emit('update')"
    >
      {{ $v('주문 변경') }}
    </button> -->
    <button
      v-loading="isLoading"
      v-if="$field_V3() === 'TODO' && ['READY_TO_WORK', 'FAILING'].includes(serviceStatus)"
      class="button"
      type="is-primary"
      @click="excute"
    >
      {{ $v('작업 실행') }}
    </button>
    <button
      v-loading="isLoading"
      v-if="['DELETE_STANDBY'].includes(serviceStatus)"
      class="button"
      type="is-primary"
      @click="excute('DELETE_STANDBY')"
    >
      {{ $v('즉시삭제') }}
    </button>
  </div>
</template>

<script>
export default {
  inject: ['$orderType', '$field_V3'],
  props: {
    serviceStatus: {
      type: String,
      default: ''
    },
    roleStatus: {
      type: String,
      default: ''
    }
  },
  computed: {
    show () {
      if (this.$route.name === 'approved-detail') return false
      if (this.$field_V3() === 'CONFERENCE' && ['TODO', 'TODO_FINISHED', 'APPROVAL2', 'APPROVAL2_REJECTED', 'DONE'].includes(this.roleStatus)) return false
      if (this.$field_V3() === 'TODO' && ['REVIEW', 'CANCELED_AT_REVIEW', 'APPROVAL1'].includes(this.roleStatus)) return false // 이슈 : 예) 역할 3개 중 하나만 넘겨도 다른 2역할이 할일에서 보임 -> 사전협의 상태 밸리데이션
      if (this.$field_V3() === 'DONE') return false
      if (this.$orderType === 'DELETE') return false
      return true
    },
    isEditable () {
      return {
        REVIEW: true,
        CANCELED_AT_REVIEW: true,
        CANCELED_AT_TODO: true,
        // CANCELED: true, // 2023-04-11 삭제
        APPROVAL1: false, // 사전협의 결재 대기중
        APPROVAL1_REJECTED: false,
        TODO: true, // 할일
        TODO_FINISHED: false, // 할일 완료
        APPROVAL2: false, // 할일 결재 대기중
        APPROVAL2_REJECTED: false,
        DONE: false // 한일
      }[this.roleStatus]
      // 결재중, 취소 상태 인 경우 disabled
      // return ['APPROVAL1', 'CANCELED'].includes(this.roleStatus)
    },
    // serviceStatus
    isDisabled () {
      return ['WORKING', 'SUCCESS'].includes(this.serviceStatus)
    },
    isCanceled () { // 주문 취소 상태
      return ['CANCELLING', 'CANCELED_AT_REVIEW', 'CANCELED_AT_TODO'].includes(this.serviceStatus)
    }
  },
  data () {
    return {
      isLoading: false
    }
  },
  methods: {
    async excute (status = '') {
      this.isLoading = true
      this.$emit('excute', status)
      setTimeout(() => {
        this.isLoading = false
      }, 1000)
    }
  }
}
</script>
