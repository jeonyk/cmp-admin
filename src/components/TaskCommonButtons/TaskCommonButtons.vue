<template>
  <div class="button-area">
    <!-- 🌸 {{ tab }} -->
    <!-- 🌸 {{ $field_V3() }} -->

    <button
      class="button"
      size="is-large"
      v-if="setButtons(tab.setting, 'writeDoc')"
      @click="$emit('report-order')"
    >
      {{ docRegistred(tab) ? $v('보고서 수정') : $v('보고서 작성') }}
    </button>
    <button
      class="button"
      size="is-large"
      type="is-primary"
      v-if="setButtons(tab.setting, 'applyApproval')"
      @click="$emit('apply-approval')"
    >
      <!-- :disabled="!docRegistred(tab)" -->
      {{ $v('결재 신청') }}
    </button>
    <button
      class="button"
      size="is-large"
      type="is-primary"
      v-if="setButtons(tab.setting, 'toTodo')"
      @click="$emit('complete-work-review', 'toTodo')"
    >
      <!-- 사전협의 -> 할일 -->
      {{ $v('할 일로 이동') }}
    </button>
    <button
      class="button"
      size="is-large"
      type="is-primary"
      v-if="setButtons(tab.setting, 'toDone')"
      @click="$emit('complete-work-todo', 'toDone')"
    >
      <!-- 할일 -> 한일 -->
      {{ $v('한 일로 이동') }}
    </button>
    <button
      class="button"
      size="is-large"
      type="is-primary"
      v-if="setButtons(tab.setting, 'toDoneCancel')"
      @click="$emit('complete-work-cancel', 'toDoneCancel')"
    >
      <!-- 사전협의/할일 -> 한일 -->
      {{ $v('한 일로 이동') }}
    </button>
    <button
      class="button"
      size="is-large"
      type="is-primary"
      :disabled="!docRegistred(tab)"
      v-if="setButtons(tab.setting, 'waitApproval')"
      @click="$emit('apply-approval')"
    >
      {{ $v('결재 대기 중') }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'TaskCommonButtons',
  inject: ['$field_V3', '$orderType'],
  props: {
    tab: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    /*
      ## [결재신청] 버튼 disabled 조건에서 => alert창으로 모두 변경
        어떤것이 원인인지 알 수 있도록 해야한다는 것이 요청 (230323)

        AWS/NTX/VMware 결재 신청할 수있는 조건이 모두 다르므로
        해당 컴포넌트를 호출하는 곳에서 validation 추가하기로 함 ... 하 힘들어죽겠네

        1. (NTX) 사전협의 > 보고서 ON 일경우
        - 자원할당설정
        - 예약설정
        - 보고서 설정
          => 이 모든것을 만족해야 [결재신청 페이지] / [할일로 이동] 가능
          => 만족못했을경우 원인 Alert 노출

        2. (NTX) 할일 > 보고서 ON 일경우
        - 작업상태 (성공/실패 있어야함)
        - 예약설정 (주문취소 => 복원시 예약설정 다시 설정해야함)
        - 작성/수정 된 작업완료보고서
          => 이 모든것을 만족해야 [결재신청 페이지] / [한일로 이동] 가능
          => 만족못했을경우 원인 Alert 노출

        3. 비고
        - 뒷쪽에서 예약설정 / 자원할당설정 validation이 있는지 확인 필요(중복검사)
    */
  },
  data: () => ({
    /**
     * 상태가 [결재 대기중] 인지 확인
     */
    waitApproval (workState) {
      return (workState === 'APPROVAL1' || workState === 'APPROVAL2')
    },

    /**
     * [보고서] 등록여부 확인
     * (보고서 수정 / 보고서 작성) 텍스트 선택
     * @param {Object} tab 탭 정보
     */
    docRegistred ({ orderType, setting }) {
      // [사전협의] vs [할일] 에 따라 보고서 형태 다르게 구분
      const { useDoc, planDocument, reportDocument, workState } = setting

      // [결재 대기중] 이라면 무조건 disabled
      if (this.waitApproval(workState)) return false

      // [보고서 설정] 이 OFF 되어있다면 disabled 무시
      if (!useDoc) return true

      const isUrgent = this.$orderType() === 'URGENT' // [긴급] 여부 확인

      // [보고서 설정] 이 ON 되어있다면 비교 시작
      // 이미 등록된 보고서가 있다면 페이지를 비교해서 true/false 확인
      const approvalDocument = (planDocument || reportDocument)
        ? (
          // [긴급] 일 경우는 [사후결재보고서]
          isUrgent ? !!reportDocument
            : {
              // [일반] 일 경우는 [사전협의 - 작업계획서] vs [할일 - 작업완료보고서]
              CONFERENCE: !!planDocument,
              TODO: !!reportDocument
            }[this.$field_V3()])
        : false // 등록된 보고서 없으면 false

      return approvalDocument
    },
    /**
     * 버튼 노출 조건
     *
     * 경우의 수?
     *   1. 결재사용 OFF (useApproval === false)
     *   2. 결재사용 ON && 보고서 사용 OFF  (useApproval === true) && (useDoc === false)
     *   3. 결재사용 ON && 보고서 사용 ON  (useApproval === true) &&  (useDoc === true)
     *
     * @param {Boolean} useApproval 결재 사용여부
     * @param {Boolean} useDoc 보고서 사용여부
     * @param {Boolean} workState 상태
     * @param {Boolean} block 자원의 상태에 따라 차단 여부 (임시)
     * @param {String} button 버튼 타입
     */
    setButtons ({ useApproval, useDoc, workState, block }, button) {
      // console.log(`%c\n## ${{ writeDoc: '보고서 수정', applyApproval: '결재 신청', toTodo: '할 일로 이동', toDone: '한 일로 이동', waitApproval: '결재 대기 중' }[button]} (${button}) =>`, 'font-weight: bold; background: white; color: black;')
      // console.log(`> 차단여부 (block): ${block ? '🟩' : '🟥'}`)
      // console.log(`> 현재 역할의 위치 (workState): ${workState}`)
      // console.log(`> 결재 사용 (useApproval): ${useApproval ? '🟩' : '🟥'}`)
      // console.log(`> 보고서 설정 (useDoc): ${useDoc ? '🟩' : '🟥'}`)

      const isUrgent = this.$orderType() === 'URGENT' // [긴급] 자원일 때는 바로 [사전협의] > [한 일로 이동]
      const conference = this.$field_V3() === 'CONFERENCE'
      const todo = this.$field_V3() === 'TODO'
      const done = this.$field_V3() === 'DONE'
      const cancel = /CANCELED_AT/g.test(workState)

      // 연관자원일 때 {현재 보고있는 페이지 vs 현재 진행중인 상태값}이 서로 다른 경우가 있음 (상태값이 같은 경우에만 열어줘야함)
      const match = { CONFERENCE: 'REVIEW|APPROVAL1', TODO: 'TODO|APPROVAL2', DONE: 'DONE' }[this.$field_V3()]
      const connected = new RegExp(match, 'g').test(workState)
      // console.log('> page : ', this.$field_V3(), workState, connected)

      if (done) return false // [한 일] 페이지인 경우 버튼 삭제
      if (conference && (workState === 'TODO' || workState === 'DONE')) return false // 사전협의에서 현재 탭의 역할이 "할일|한일" 인 상태인 경우 버튼은 안보임
      if (todo && (workState === 'DONE')) return false // 할일에서 현재 탭의 역할이 "한일" 인 상태인 경우 버튼은 안보임
      if (block) return false // "연관된 자원" 인 경우 : 이전 역할 확인하여 INSUFFICIENT가 있다면 수정 불가능
      // if (workState === 'TODO') return false // 사전협의에서 할일로 이동은 안보임

      const waitApproval = this.waitApproval(workState) // 결재 신청 완료 후 승인/반려 대기중인 상태

      // 조건이 너무나도 많구나 \^ㅅ^/ 이야하하하~
      return {
        writeDoc: connected && (!waitApproval) && (useApproval === true) && (useDoc) && (!cancel), // [보고서 작성]
        applyApproval: connected && (!waitApproval) && (useApproval === true) && (!cancel), // [결재 신청]
        toTodo: connected && (!waitApproval) && (useApproval === false) && (conference && !isUrgent) && (!cancel), // 사전협의 > [할 일로 이동]
        toDone: connected && (!waitApproval) && (useApproval === false) && (todo || isUrgent) && (!cancel), // 할일 > [한 일로 이동] || [긴급] 일땐 사전협의 > [한 일로 이동]
        toDoneCancel: connected && cancel, // 모두 주문취소일경우 [사전협의/할일] > 한일로 이동
        waitApproval: connected && (waitApproval) && (!cancel) // [결재 대기중]
      }[button]
    }
  })
}
</script>

<style lang="scss" scoped>

</style>
