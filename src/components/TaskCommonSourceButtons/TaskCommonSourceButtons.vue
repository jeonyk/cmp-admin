<template>
  <div class="button-area">
    <!-- 🌸 {{ $field_V3() }} -->
    <!-- 🌸 {{ $orderType() }} -->

    <button
      class="button"
      :disabled="!checkedData.length || hasKey('restore')"
      v-if="setEditButton('restore')"
      @click="$emit('click', 'restore-order')"
    >
      {{ $v('주문복원') }}
    </button>
    <button
      class="button"
      :disabled="!checkedData.length || hasKey('cancel')"
      v-if="setEditButton('cancel')"
      @click="$emit('click', 'cancel-order')"
    >
      {{ $v('주문취소') }}
    </button>
    <button
      class="button"
      :disabled="!checkedData.length || checkedData.length > 1 || setScheduling()"
      v-if="setEditButton('scheduling')"
      @click="$emit('click', 'schedule-order')"
    >
      {{ $v('예약설정') }}
    </button>
    <button
      class="button"
      :disabled="!checkedData.length || setRunning()"
      v-if="setEditButton('execute')"
      @click="$emit('click', 'execute-order')"
    >
      {{ $v('작업진행') }}
    </button>
    <button
      class="button"
      :disabled="!checkedData.length || setHandmake()"
      v-if="setEditButton('handmake')"
      @click="$emit('click', 'handmake-order')"
    >
      {{ $v('별도처리') }}
    </button>
    <button
      class="button"
      :disabled="!checkedData.length || setDeleteNow()"
      v-if="setEditButton('delete')"
      @click="$emit('click', 'delete-order')"
    >
      {{ $v('즉시삭제') }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'TaskCommonSourceButtons',
  inject: ['$field_V3', '$orderType'],
  props: {
    checkedData: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    checkedData (data) {
      const workItemStates = data.map(({ workItemState }) => workItemState)
      this.bothDisabled = new Set(workItemStates)
    }
  },
  methods: {
    /**
     * [작업 상세] 편집 버튼 show 세팅
     * @param {String} type 타입 restore|cancel|scheduling|execute|delete
     * @return {Boolean}
     */
    setEditButton (type) {
      const field = this.$field_V3()
      const orderType = this.$orderType()

      // [한 일|결재신청|결재함]인 경우 모두 보여주지 않습니다
      const mustHide = /DONE|APPLY-APPROVAL|APPROVED/g
      if (mustHide.test(field)) return false
      if (orderType === 'URGENT') return false // [긴급] 자원은 [작업예정일], [할당설정], [자원변경], [주문취소] 모두 불가능

      // [사전협의] 인데 [결재정보] -> 전체적으로 읽기 전용인 곳이 있음
      const { editable, workable } = this.$parent
      if (!editable && !workable) return false

      const handmakeButton = orderType === 'CHANGE' // [별도처리] 버튼 노출 조건
      const deleteButton = orderType === 'DELETE' // [즉시삭제] 버튼 노출 조건

      // [사전협의 / 할 일] 인 경우 조건부로 보여줍니다
      return {
        CONFERENCE: { restore: true, cancel: true, scheduling: true, execute: false, delete: false, handmake: false },
        TODO: { restore: true, cancel: true, scheduling: true, execute: true, delete: deleteButton, handmake: handmakeButton }
      }[field][type]
    },

    /**
     * [주문복원] [주문취소] 함께 넣을때 disable 조건
     * @return {Boolean} true (disable - 선택 불가능) | false (!disable - 선택 가능)
     */
    hasKey (key) {
      // 주문 상태가 2개 이상 섞여 들어가면 모두 disabled = true
      if (this.bothDisabled.size >= 2 || this.bothDisabled.size === 0) return true

      const [state] = [...this.bothDisabled]
      const field = this.$field_V3()

      const open = /READY_TO_WORK|SCHEDULE_PAUSED|SCHEDULED/gi // (취소가 가능한 상태)
      const cancelable = open.test(state) // 상태가 열려 있는 경우
      // console.log(field, key, state, cancelable)

      // [사전협의 내]
      // INIT           => [주문 취소] 활성화,  [주문 복원] 활성화   => return false, true
      // CANCELING      => [주문 취소] 비활성화, [주문 복원] 활성화   => return true,  false
      // DELETE_STANDBY => [즉시 삭제] 활성화, 이외 모든 자원 비활성화 => return false, true
      return {
        CONFERENCE: {
          restore: state === 'INIT',
          cancel: state === 'CANCELLING'
          // delete: state === 'DELETE_STANDBY'
        }[key],

        // [할일 내]
        // cancelable 외의 모든 작업은 [주문취소/복원] 불가능               => return true,  true
        // CANCELING         => [주문 취소] 비활성화, [주문 복원] 활성화   => return true,  false
        // DELETE_STANDBY    => [즉시 삭제] 활성화, 이외 모든 자원 비활성화 => return false, true
        TODO: {
          restore: state !== 'CANCELLING',
          cancel: cancelable ? state === 'CANCELLING' : true
          // delete: state === 'DELETE_STANDBY'
        }[key]
      }[field]
    },
    /**
     * [예약설정] 취소된 주문이 있다면 disable
     * @return {Boolean} true (disable - 선택 불가능) | false (!disable - 선택 가능)
     */
    setScheduling () {
      const except = /READY_TO_WORK|SCHEDULE_PAUSED|SCHEDULED/g
      const regex = /CANCEL/g // (취소 상태 & 취소가 가능한 상태)
      const field = this.$field_V3()

      const states = [...this.bothDisabled]
      const test = states.some(state => {
        return regex.test(state) ||
        (field === 'TODO' ? !except.test(state) : false) // 할일에서만 상태값 한번 더 비교
      })
      // console.log(this.bothDisabled, test)
      return test
    },
    /**
     * [예약설정] 취소된 주문이 있다면 disable
     * @return {Boolean} true (disable - 선택 불가능) | false (!disable - 선택 가능)
     */
    setRunning () {
      const regex = /CANCEL/g // 취소상태
      const states = [...this.bothDisabled]

      const test = states.some(state => regex.test(state))
      // console.log(this.bothDisabled, test)
      return test
    },
    /**
     * [별도처리] 작업상태 없는 경우, 예약작업 취소된 경우 외에는(!!) 모두 disable
     * @return {Boolean} true (disable - 선택 불가능) | false (!disable - 선택 가능)
     */
    setHandmake () {
      const regex = /READY_TO_WORK|SCHEDULE_PAUSED/g
      const states = [...this.bothDisabled]

      const test = states.some(state => regex.test(state))
      // console.log(this.bothDisabled, test)
      return !test
    },
    /**
     * [즉시삭제] 노출조건에 맞지 않는다면 disable
     * @return {Boolean} true (disable - 선택 불가능) | false (!disable - 선택 가능)
     */
    setDeleteNow () {
      // [즉시삭제] 노출 조건
      const isDelete = /DELETE_STANDBY|FAILING/g
      const states = [...this.bothDisabled]
      const deleteNow = Boolean(states.length) && states.every(state => isDelete.test(state))

      return !deleteNow
    }
  },
  data: () => ({
    bothDisabled: new Set()
  })
}
</script>

<style lang="scss" scoped>

</style>
