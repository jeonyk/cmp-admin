<!--
  * 파일명 : PickBillngBatchDateModal.vue
  * 파일 기능 : [빌링 > 과금배치 > 과금배치 추가] 버튼 클릭시 나오는 모달. 과금배치를 추가할 수 있습니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 fix: sorting 버그 픽스 중
 -->

<template>
  <el-dialog
    :title="$t('bill.addBillArrange')"
    :visible.sync="isActive"
    class="add-calibration-modal"
    :width="$i18n.locale === 'ko' ? '400px' : '450px'"
    @close="close"
  >
    <div class="body-wrap">
      <span style="margin-right: 1em">{{ $t('bill.billDateG') }}</span>
      <el-date-picker
        v-model="billDate"
        type="month"
        :clearable="false"
        :placeholder="$t('bill.billDateG')"
        :picker-options="pickerOptions"
      />
    </div>
    <section class="modal-footer big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirm"
      >
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>
<script>
import dayjs from 'dayjs'

function getFirstDayOfMonth (year, month) {
  return new Date(year, month, 1).getTime()
}

export default {
  name: 'PickBillingBatchDateModal',
  components: {
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: function () {}
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal

      if (!newVal) {
        this.billDate = null
      }
    }
  },
  methods: {
    confirm () {
      if (!this.billDate) {
        return this.$alert(this.$t('common.ALERT.BILL.064'))
      }

      this.$emit('close')
      this.$emit('confirm', this.billDate)
    },
    close () {
      this.$emit('close')
    }
  },
  data () {
    return {
      isActive: this.active || false,
      billDate: undefined,
      pickerOptions: {
        disabledDate (time) {
          const now = new Date()

          // 이번 달 1일의 Date를 구한다.
          const firstDayOfMonth = getFirstDayOfMonth(
            now.getFullYear(),
            now.getMonth()
          )

          // 다음 달 1일의 Date를 구한다.
          const nextMonth = dayjs(firstDayOfMonth).add(1, 'month')

          // 다음 달 1일보다 큰 Time은 모두 disabled 처리한다.
          return new Date(time).getTime() > nextMonth
        }
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  .add-calibration-modal {
    .modal-body {
      overflow: auto;
      min-height: 55vh;
      max-height: 55vh;
      .information-input {
        width: 250px;
      }
       .input-form {
        display: flex;
        align-items: center;
        position: relative;
        > .el-radio-group {
          display: flex;
          align-items: center;
        }
      }
    }
    .divided {
      display: flex;
      > * {
        flex: 0 0 50%;
      }
    }

    .body-wrap {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
  }
</style>
