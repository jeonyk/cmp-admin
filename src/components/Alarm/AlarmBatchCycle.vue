<template>
  <el-dialog
    :title="modalTitle"
    :visible="active"
    width="480px"
    @close="$emit('close')"
  >
    <div class="batch">
      <vertical-table
        :data="{}"
        :columns="batchFormColumns"
        table-type="input"
        padding-top="0"
      >
        <template #time>
          <el-time-picker
            v-model="form.time"
            placeholder="발송 시각을 선택하세요."
            class="time-picker"
            popper-class="batch-time-popper"
            value-format="HH:mm"
            format="HH:mm"
            :picker-options="{ format: 'HH:mm' }"
          />
        </template>
        <!-- 발송 시각 -->

        <template #cycle>
          <div class="cycle-wrapper">
            <el-select
              v-model="form.cycle"
              class="cycle-select"
            >
              <el-option
                v-for="cycle in cycleOptions"
                :key="cycle.label"
                :label="cycle.label"
                :value="cycle.value"
              />
            </el-select>
            <div class="added-option-wrapper">
              <div
                class="check-group"
                v-if="form.cycle === CYCLE_ENUM.EVERY_WEEK"
              >
                <button
                  v-for="week in dayOptions"
                  :key="week.label"
                  class="button"
                  :type="form.weekCycle.includes(week.value) ? 'is-primary' : 'is-disabled'"
                  @click="() => onClickDayOfWeek(week)"
                >
                  {{ week.label }}
                </button>
              </div>
              <div
                class="select-with-suffix"
                v-else-if="form.cycle === CYCLE_ENUM.MONTHLY"
              >
                <el-select
                  v-model="form.dayOfMonth"
                  class="day-month-select"
                >
                  <el-option
                    v-for="day in rangeOptions"
                    :key="`day-${day}`"
                    :label="day"
                    :value="day"
                  />
                </el-select>
                <span class="suffix">
                  일
                </span>
              </div>
            </div>
          </div>
        </template>
        <!-- 반복 주기 -->
      </vertical-table>
      <div
        v-if="isShowHelpText"
        class="help-text"
      >
        {{ helpText }}
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="$emit('close')"
        >
          {{ $v("취소") }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onClickSave"
        >
          {{ $v("저장") }}
        </button>
      </section>
    </div>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'
import { CYCLE_ENUM } from './Util/Mapping'

/**
 * 월, 화, 수, 목, 금, 토, 일
 */
export const DAY_ENUM = {
  월: 0,
  화: 1,
  수: 2,
  목: 3,
  금: 4,
  토: 5,
  일: 6
}

const defaultForm = {
  time: '',
  cycle: '',
  dayOfMonth: null,
  weekCycle: []
}

/**
 * 알람 배치 주기 관련 모달
 */
export default {
  name: 'AlarmBatchCycle',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    /**
     * 편집 상태 혹은 적용 후 기존 데이터를 불러오기 위한 props
     */
    batchForm: {
      type: Object,
      default: null
    },
    batchCycle: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    cycleOptions () {
      return this.batchCycle.map(cycle => ({
        ...cycle,
        label: cycle.codeName,
        value: cycle.codeVal
      }))
    },
    modalTitle () {
      return this.isEdit ? '배치 주기 수정' : '배치 주기 추가'
    },
    isShowHelpText () {
      if (this.form.time && Number.isInteger(this.form.cycle)) {
        if (this.form.cycle === CYCLE_ENUM.EVERY_WEEK) {
          return this.form.weekCycle.length
        } else if (this.form.cycle === CYCLE_ENUM.MONTHLY) {
          return this.form.dayOfMonth
        }
        return true
      } else return false
    },
    helpText () {
      if (!this.isShowHelpText) return ''

      const genText = (cycle, time, weekCycle) => {
        const cycleOption = this.cycleOptions.find(
          opt => opt.value === cycle
        )
        if (!cycleOption) return ''

        const [hours, minutes] = time.split(':')
        const timeFormat = `${hours}시 ${minutes}분`

        if ((weekCycle && weekCycle.length) && cycle === CYCLE_ENUM.EVERY_WEEK) {
          const copyWeekCycle = weekCycle.slice(0)
          copyWeekCycle.sort()
          const kvr = copyWeekCycle.map(week => this.dayOptions.find(day => day.value === week).label)
          // {label} ${day_of_week}요일 ${time}에 알람이 발송됩니다.
          return `${cycleOption.label} ${kvr.join(', ')}요일 ${timeFormat}에 알람이 발송됩니다.`
        } else if (cycle === CYCLE_ENUM.MONTHLY && this.form.dayOfMonth) {
          // {label} ${day_of_month}일 ${time}에 알람이 발송됩니다.
          return `${cycleOption.label} ${this.form.dayOfMonth}일 ${timeFormat}에 알람이 발송됩니다.`
        } else {
          // {label} ${time}에 알람이 발송됩니다.
          return `${cycleOption.label} ${timeFormat}에 알람이 발송됩니다.`
        }
      }

      return genText(this.form.cycle, this.form.time, this.form.weekCycle || [])
    }
  },
  watch: {
    active (visible) {
      if (!visible) {
        this.form = cloneDeep(defaultForm)
        this.stopWatch()
      } else if (visible && this.batchForm) {
        this.setCopyParentForm(this.batchForm)
        this.startWatch()
      }
    }
  },
  methods: {
    /**
     * 배치 주기 폼 옵션 watch stop/start 메서드
     * 모달 오픈시 watch 할당, (기본 세팅이 끝난 후)
     * 모달 종료시 할당된 watch 제거
     * (기본 세팅이 끝나기 전 값이 변경되면 선택한 요일, 매월 말일 등 필요한 옵션이 초기화 되는 이슈 방지)
     */
    stopWatch () {
      if (this.watchCycle && typeof this.watchCycle === 'function') {
        this.watchCycle() // unwatch
      }
    },
    startWatch () {
      this.watchCycle = this.$watch('form.cycle', (cycle) => {
        this.form.weekCycle = []
        this.form.dayOfMonth = null
      })
    },
    /**
     * 부모에서 입력된 폼을 컴포넌트 데이터 형식에 맞게 변환해서 적용한다.
     */
    setCopyParentForm (form) {
      if (!form) return

      let copyForm = cloneDeep(defaultForm)
      copyForm = { ...form }

      this.form = copyForm
    },
    /**
     * 반복 주기 > 매주인 경우, 요일을 클릭할 때 이벤트
     */
    onClickDayOfWeek (week) {
      if (this.form.weekCycle.includes(week.value)) {
        this.form.weekCycle = this.form.weekCycle.filter(cycle => cycle !== week.value)
      } else {
        this.form.weekCycle.push(week.value)
      }
    },
    /**
     * 발송 시각 및 반복 주기 검사
     */
    validateCycle () {
      return new Promise((resolve, reject) => {
        if (!this.form.time) {
          this.$alert('발송 시각을 선택하세요.', {
            onClose: () => reject(new Error('Empty time'))
          })
        } else if (!this.form.cycle) {
          this.$alert('반복 주기를 선택하세요.', {
            onClose: () => reject(new Error('Empty cycle'))
          })
        } else if (this.form.cycle === CYCLE_ENUM.EVERY_WEEK && !this.form.weekCycle.length) {
          this.$alert('요일을 선택하세요.', {
            onClose: () => reject(new Error('Empty day_of_week'))
          })
        } else if (this.form.cycle === CYCLE_ENUM.MONTHLY && !this.form.dayOfMonth) {
          this.$alert('날짜를 선택하세요.', {
            onClose: () => reject(new Error('Empty day_of_month'))
          })
        } else resolve(true)
      })
    },
    /**
     * 저장 버튼 클릭시 이벤트
     */
    onClickSave () {
      this.$confirm('배치 주기를 저장하시겠습니까?')
        .then(async () => {
          try {
            const validated = await this.validateCycle()
            if (!validated) return

            const form = {
              ...this.form,
              label: (this.cycleOptions.find(cycle => this.form.cycle === cycle.value) || {}).label
            }

            if (form.cycle === CYCLE_ENUM.EVERY_WEEK) {
              form.weekCycle.sort()
            }

            this.$emit('save', form)
            this.$emit('close')
          } catch (err) {
            console.log(err)
          }
        })
        .catch(() => false)
    }
  },
  data: () => ({
    batchFormColumns: [
      {
        binding: 'cycle',
        header: '반복 주기',
        customHtml: true,
        required: true
      },
      {
        binding: 'time',
        header: '발송 시각',
        customHtml: true,
        required: true
      }
    ],
    // cycleOptions: [
    //   { label: '매일', value: CYCLE_ENUM.EVERY_DAY },
    //   { label: '매주', value: CYCLE_ENUM.EVERY_WEEK },
    //   { label: '매월', value: CYCLE_ENUM.MONTHLY },
    //   { label: '매월 말일', value: CYCLE_ENUM.LAST_DAY_OF_MONTH }
    // ],
    dayOptions: Object.keys(DAY_ENUM).reduce(
      (a, b) => a.concat([{ label: b, value: DAY_ENUM[b] }]),
      []
    ),
    form: cloneDeep(defaultForm),
    watchCycle: null,
    CYCLE_ENUM,
    DAY_ENUM,
    rangeOptions: new Array(31).fill(0).map((_, i) => i + 1)
  })
}
</script>

<style lang="scss" scoped>
.batch {
  &::v-deep {
    .el-date-editor.time-picker {
      width: 100%;

      .el-input__prefix {
        .el-input__icon {
          line-height: 32px;
        }
      }
    }

    .vertical-table {
      .register-contents {
        border-top: none !important;

        &:first-of-type {
          .contents-title {
            margin-bottom: 10px;
          }
        }
      }

      .contents-title {
        width: auto !important;
        min-width: 80px !important;
        padding-right: 0 !important;
        padding: 0 10px;
      }

      .contents {
        padding: 0 10px;
      }
    }
  }

  .help-text {
    margin: $gap 0 $gap-m 0;
    text-align: center;
  }

  .cycle-wrapper {
    .cycle-select {
      width: 100%;
      max-width: 100%;
    }
  }

  .modal-button-area {
    padding-top: $gap-s;
  }

  .added-option-wrapper {
    margin: $gap-s 0;

    .check-group {
      display: flex;
      flex-wrap: nowrap;

      > * + * {
        margin-left: 5px;
      }

      .button {
        width: auto;
        height: auto;
        padding: $gap-s;
        line-height: 1;
        min-width: 0;
        flex: 1 0 auto;
      }
    }

    .select-with-suffix {
      display: flex;
      align-items: center;
      flex-wrap: nowrap;

      .suffix {
        padding-left: $gap-s;
      }

      .day-month-select {
        max-width: 80px;
      }
    }
  }
}
</style>

<style lang="scss">
.batch-time-popper {
  width: 198px;
}
</style>
