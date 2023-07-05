<template>
  <div class="correction">
    <div class="correction-input">
      <div class="row">
        <div class="cell">
          <div class="cell-title">
            <!-- {{ $v('보정 분류') }} -->
            보정 분류
          </div>
          <div class="cell-value">
            <el-select
              v-model="form.discountClass"
              style="max-width: 100%;"
            >
              <el-option
                v-for="option in correctionClassesOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>
        <div class="cell">
          <div class="cell-title">
            <!-- {{ $v('적용 기간') }} -->
            적용 기간
          </div>
          <div class="cell-value">
            <el-date-picker
              :placeholder="$v('시작일')"
              v-model="form.discountPeriodBegin"
              class="date-picker"
              type="month"
              :picker-options="createDateOptStart"
              @change="onChangeDate"
            />
            <span class="date-separator">~</span>
            <el-date-picker
              :placeholder="$v('종료일')"
              v-model="form.discountPeriodEnd"
              class="date-picker"
              type="month"
              :picker-options="createDateOptEnd"
              @change="onChangeDate"
            />
          </div>
        </div>
      </div>
      <div class="row">
        <div class="cell">
          <div class="cell-title">
            {{ $v('보정 금액') }}
          </div>
          <div class="cell-value">
            <el-radio-group v-model="form.discountKinds">
              <el-radio :label="CORRECTION_ENUM.PRICE">
                {{ $v('금액') }}
              </el-radio>
              <el-radio :label="CORRECTION_ENUM.PERCENT">
                {{ $v('비율') }}
              </el-radio>
            </el-radio-group>
          </div>
        </div>
        <div class="cell">
          <div class="cell-title">
            <el-button
              class="minus"
              :class="{ active: form.priceType === 'minus' }"
              type="icon"
              @click="() => (form.priceType = 'minus')"
            >
              <i class="mdi mdi-minus" />
            </el-button>
            <el-button
              class="plus"
              :class="{ active: form.priceType === 'plus' }"
              type="icon"
              @click="() => (form.priceType = 'plus')"
            >
              <i class="mdi mdi-plus" />
            </el-button>
          </div>
          <div class="cell-value">
            <el-input-number
              v-model="form.discountPrice"
              :min="0"
              :max="form.discountKinds === CORRECTION_ENUM.PRICE ? Infinity : 100"
              :thousands-sep="form.discountKinds === CORRECTION_ENUM.PERCENT ? '' : ','"
            />
          </div>
        </div>
      </div>
      <div class="row single-row">
        <div class="cell">
          <div class="cell-title">
            {{ $v('비고') }}
          </div>
          <div class="cell-value">
            <el-input
              v-model="form.discountReason"
              type="textarea"
              :rows="3"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="correction-action">
      <trash-icon
        icon-color="#727797"
        is-button
        @click="onClickRemoveCorrection"
      />
    </div>
  </div>
</template>

<script>
import TrashIcon from '@/components/Icons/TrashIcon.vue'
import { uniqueId, cloneDeep } from 'lodash'

export default {
  name: 'BillingModelCalibRegistForm',
  components: {
    TrashIcon
  },
  props: {
    correctionItem: {
      type: Object,
      required: true
    },
    correctionClasses: {
      type: Array,
      required: true
    }
  },
  watch: {
    'form.discountKinds' (kinds) {
      if (kinds === this.CORRECTION_ENUM.PERCENT) {
        if (this.form.discountPrice > 100) {
          this.form.discountPrice = 100
        }
      }
    }
  },
  computed: {
    correctionClassesOptions () {
      return this.correctionClasses.map(code => ({
        ...code,
        label: code.codeName,
        value: code.codeVal
      }))
    }

  },
  created () {
    this.$emit('inject-uid', uniqueId('correction-item-uid-'))
    this.copyForm()
  },
  methods: {
    onChangeDate () {
      const startDate = this.form.discountPeriodBegin
      const endDate = this.form.discountPeriodEnd

      if (startDate) {
        this.createDateOptEnd.disabledDate = time => {
          return (
            time.getTime() <
              new Date(new Date(startDate).toDateString()).getTime()
          )
        }
      } else {
        this.createDateOptEnd.disabledDate = time => {
          return false
        }
      }

      if (endDate) {
        this.createDateOptStart.disabledDate = time => {
          return (
            time.getTime() >
              new Date(new Date(endDate).toDateString()).getTime()
          )
        }
      } else {
        this.createDateOptStart.disabledDate = time => {
          return false
        }
      }
    },
    /**
     * 부모 폼 데이터 복사
     */
    copyForm () {
      this.form = { ...cloneDeep(this.correctionItem) }
      this.$watch(vm => vm.form, (n, o) => {
        if (n && n.__ui_uid__) {
          this.$emit('sync-correction-item', this.correctionItem.__ui_uid__, n)
        }
      }, { deep: true, immediate: true })
    },
    /**
     * 보정 삭제
     */
    onClickRemoveCorrection () {
      this.$emit('request-remove', this.correctionItem.__ui_uid__)
    }
  },
  data: () => ({
    form: {},
    CORRECTION_ENUM: { // 보정 금액
      PRICE: 'WON', // 금액
      PERCENT: 'PER' // 비율
    },
    createDateOptStart: {
      disabledDate (time) {
        return false
      }
    },
    createDateOptEnd: {
      disabledDate (time) {
        // const today = new Date().toDateString()
        // return time.getTime() > new Date(today)
        return false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.correction {
  display: flex;
  flex-wrap: nowrap;
  box-sizing: border-box;
  padding: $gap 0;

  .correction-input > * + * {
    margin-top: 15px;
  }

  .correction-action {
    margin-left: $gap;
    margin-right: $gap-s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .row {
    display: flex;
    flex-wrap: nowrap;

    &:not(.single-row) {
      > :first-child {
        flex: 0 0 35%;
      }

      > :last-child {
        margin-left: 10px;
        flex: 0 1 65%;
      }
    }

    &.single-row {
      > .cell {
        flex: 1;
        align-items: flex-start;

        .cell-title {
          padding-top: 5px;
        }
      }
    }

    .cell {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      box-sizing: border-box;

      &-title {
        text-align: right;
        padding-right: 15px;
        min-width: 72px;

        .el-button {
          display: inline-block;
          background-color: transparent;
          padding: 5px;
          margin: 0;
          box-sizing: border-box;
          border: 1px solid $purple-gray;

          &.minus {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;

            &:not(.active) {
              border-right-width: 0;
            }
          }

          &.plus {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;

            &:not(.active) {
              border-left-width: 0;
            }
          }

          &.active {
            border-color: #3E57C9;
            color: #3E57C9;
            background-color: darken(#3E57C9, 30);
          }

          &:hover {
            color: #3E57C9;
          }
        }
      }

      &-value {
        display: flex;
        flex-wrap: nowrap;
        overflow: hidden;
        width: 100%;

        .date-picker {
          width: 100%;
        }

        .date-separator {
          margin: 5px;
        }

        .el-input-number {
          width: 100%;
        }
      }
    }
  }
}
</style>
