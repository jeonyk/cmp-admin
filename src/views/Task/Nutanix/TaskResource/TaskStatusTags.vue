<template>
  <div>
    <!-- {{ status }} -->

    <div
      class="workitem-status flex-wrap center"
      v-if="!!workState(status)"
    >
      <el-tooltip
        effect="light"
        placement="top"
        :disabled="!failMessage"
      >
        <cmp-status-tag
          :type="workState(status).type"
          :contents="workState(status).state"
          tooltip-position="bottom"
        />

        <div slot="content">
          {{ failMessage }}
        </div>
      </el-tooltip>

      <button
        v-if="status === 'FAILING'"
        class="button"
        size="is-mini"
        @click="active = true"
      >
        {{ $v('상태 처리') }}
      </button>
    </div>

    <el-dialog
      v-if="active"
      :title="$v('작업실패')"
      :visible="active"
      width="600px"
      @close="close()"
    >
      <p
        class="alert-message"
        v-html="$v('작업이 실패 되었습니다.<br>아래 항목 중 원하는 작업으로 진행해주세요.')"
      />

      <div class="border-top">
        <!-- {{ values }} -->
        <register-contents
          :title="$v('처리 방식')"
          required
        >
          <el-radio-group
            v-model="values.resolve"
            required
          >
            <el-radio
              v-for="{ label, value } in radios"
              :label="value"
              :key="value"
            >
              {{ label }}
            </el-radio>
          </el-radio-group>
        </register-contents>

        <register-contents
          v-if="values.resolve === 'FAIL'"
          :title="$v('주문 취소 사유')"
          required
        >
          <el-input
            v-model="values.reason"
            type="textarea"
            :placeholder="$v('(필수)작업실패 사유를 입력하세요.')"
            :autosize="{ minRows: 4 , maxRows: 4 }"
          />
        </register-contents>
      </div>

      <div class="modal-button-area -center">
        <button
          class="button"
          @click="close"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="confirm"
        >
          {{ $v('확인') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  props: {
    // INSUFFICIENT, INIT, CANCELLING, CANCELED_AT_REVIEW, CANCELED_AT_TODO, READY_TO_WORK, SCHEDULED, SCHEDULE_PAUSED, WORKING, FAILING, FAIL_CONFIRMED, FAIL_AS_SUCCESS, SUCCESS
    status: { // workItemState
      type: String,
      default: ''
    },
    failMessage: { // 실패 사유 툴팁
      type: String,
      default: ''
    }
  },
  computed: {
    afterActive () {
      return this.fade.in && this.fade.out
    }
  },
  watch: {
    // active (action) {
    //   console.log(action, '선행')
    //   // 이렇게 한 이유 => 해당 컴포넌트를 각 자원의 상태에서 호출하는데,
    //   // dialog 가 쌓일 수 있으므로 v-if 사용하는 방법을 선택했음
    //   // const time = action ? 100 : 500
    //   this.fade.in = action
    //   setTimeout(() => {
    //     this.fade.out = action
    //   }, 500)
    // }
  },
  methods: {
    close () {
      this.active = false
    },
    confirm () {
      const validator = [
        { condition: this.values.resolve, message: this.$v('처리 방식을 선택해주세요.') }
      ]

      if (this.values.resolve === 'FAIL') validator.push({ condition: this.values.reason, message: this.$v('주문 취소 사유를 입력해주세요.') })

      const validation = validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })

      if (!validation) return

      this.$emit('confirm', this.values)
      this.close()
    }
  },
  data () {
    return {
      active: false, // 선행
      fade: { in: false, out: false }, // 선행, 후행
      // afterActive: false, // 후행
      values: {
        resolve: undefined,
        reason: undefined
      },
      radios: [
        { label: this.$v('성공처리'), value: 'RESOLVE' },
        { label: this.$v('작업실패처리'), value: 'FAIL' }
      ],
      /**
       * [작업 상태] 확인
       * @param {Object} row 티켓의 상태
       */
      workState (workItemState) {
        const regex = /WORKING|SUCCESS|FAILING|DELETE_STANDBY|FAIL_CONFIRMED|FAIL_AS_SUCCESS|SUCCESS_BY_HAND/g
        if (!regex.test(workItemState)) return undefined

        return {
          WORKING: { state: this.$v('진행중'), type: 'is-ing' },
          SUCCESS: { state: this.$v('성공'), type: 'is-success' },
          FAILING: { state: this.$v('실패'), type: 'is-fail' },
          DELETE_STANDBY: { state: this.$v('삭제 대기중'), type: 'is-wait' },
          FAIL_AS_SUCCESS: { state: this.$v('성공'), type: 'is-success' },
          FAIL_CONFIRMED: { state: this.$v('실패'), type: 'is-fail' },
          SUCCESS_BY_HAND: { state: this.$v('별도처리'), type: 'is-new' }
        }[workItemState]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.workitem-status {
  > button { margin-left: $gap-s; }
}

.alert-message {
  line-height: 2;
  text-align: center;
  margin-bottom: $gap-m;
  font-weight: 400;
}

.border-top {
  border-top: 1px solid $dark-slate;
}

::v-deep .register-contents {
  .contents {
    width: 100% !important;
    .el-radio-group {
      gap: $gap-m;
      .el-radio {
        color: #fff;
      }
    }
  }
}
</style>
