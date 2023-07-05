<template>
  <div class="task-calendar">
    <div class="wrapper">
      <div class="calendar-wrapper">
        <button
          @click="goYear('prev')"
          class="button button--icon button--left"
        >
          &lt;&lt;
        </button>
        <button
          @click="goYear('next')"
          class="button button--icon button--right"
        >
          &gt;&gt;
        </button>
        <el-calendar
          class="calendar"
          type="date"
          ref="calendar"
          :first-day-of-week="7"
          v-model="selectedDate"
        >
          <template
            slot="dateCell"
            slot-scope="{ date, data }"
          >
            <div :class="data.isSelected ? 'is-selected' : ''">
              <div class="circle">
                <span
                  v-if="checkSchedules(data.day, listTest)"
                  :class="getClass(checkSchedules(data.day, listTest))"
                />
              </div>
              {{ data.day.split("-").slice(2).join("-") }}
            </div>
          </template>
        </el-calendar>
      </div>
      <task-calendar-board
        :data="selectedDateOfScheduels"
        :selected-date="cSelectedDate"
      />
    </div>
  </div>
</template>

<script>
import TaskCalendarBoard from '@/components/Calendar/TaskCalendarBoard.vue'
import dayjs from 'dayjs'
import { ReviewStates, TodoStates, DoneStates } from '@/utils/work/workEnums'
export default {
  components: {
    TaskCalendarBoard
  },
  props: {
    data: {
      type: [Object, Array],
      default: () => {}
    },
    listTest: {
      type: [Object, Array],
      default: () => {}
    }
  },
  computed: {
    cSelectedDate () {
      return dayjs(this.selectedDate).format('YYYY-MM-DD')
    },
    selectedDateOfScheduels () {
      return this.data[this.cSelectedDate] || []
    }
  },
  watch: {
    selectedDate: {
      immediate: true,
      handler (newVal) {
        this.emitSelectedDate(newVal)
      }
    }
  },
  created () {
    this.list = this.data
  },
  mounted () {
    this.renderCalendarButtons(this.$el)
  },
  data () {
    return {
      isLoading: true,
      list: {},
      selectedDate: new Date()
    }
  },
  methods: {
    emitSelectedDate (date) {
      const year = dayjs(date).year()
      const month = dayjs(date).month()
      const { startDate, endDate } = this.getMonthRange(year, month)
      this.$emit('change', {
        startDate,
        endDate
      })
    },
    renderCalendarButtons (el) {
      const buttonGroup = el.querySelector('.el-button-group')
      const buttons = buttonGroup.querySelectorAll('.el-button--plain')
      buttons[0].textContent = '<'
      buttons[2].textContent = '>'
    },
    getMonthRange (year, month) {
      // 입력된 연도가 윤년인지 판별하여 2월의 일수를 결정
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
      const daysInFebruary = isLeapYear ? 29 : 28

      // 1월부터 12월까지 월별 일수를 배열에 저장
      const daysInMonth = [
        31, // 1월
        daysInFebruary, // 2월
        31, // 3월
        30, // 4월
        31, // 5월
        30, // 6월
        31, // 7월
        31, // 8월
        30, // 9월
        31, // 10월
        30, // 11월
        31 // 12월
      ]

      // 입력된 월에 해당하는 일수를 계산
      const days = daysInMonth[month]

      // 시작일과 종료일을 계산하여 객체로 반환
      return {
        startDate: dayjs(new Date(year, month, 1)).format('YYYY-MM-DD'),
        endDate: dayjs(new Date(year, month, days)).format('YYYY-MM-DD')
      }
    },
    getClass (scheduleStatus) {
      return {
        REVIEW: 'REVIEW',
        TODO: 'TODO',
        DONE: 'DONE'
      }[scheduleStatus]
    },
    checkSchedules (date, list) {
      const arr = list[date]
      if (!arr) return false

      if (arr.some(x => Object.keys(ReviewStates).includes(x.workState))) return 'REVIEW'
      if (arr.some(x => Object.keys(TodoStates).includes(x.workState))) return 'TODO'
      if (arr.some(x => Object.keys(DoneStates).includes(x.workState))) return 'DONE'

      return false
    },
    goYear (direction) {
      const toWhere = `${direction}-month`

      const goOneYear = async () => {
        for (let i = 0; i < 12; i++) {
          await this.$refs.calendar.selectDate(toWhere)
        }
      }

      goOneYear()
    }
  }
}
</script>

<style lang="scss" scoped>
.task-calendar {
  width:calc(100% - 460px);
  display: flex;
  gap: 30px;
}

.wrapper {
  border: 2px solid #3d435e;
  border-radius: 6px;
  display: flex;
  width: 100%;
  padding: 25px;
  box-sizing: border-box;
}

.calendar-wrapper {
  margin-right: 60px;
  height: 300px;
  position: relative;
  width: 252px;
  height: 256px;
}
.calendar {
  width: 252px;
  height: 256px;
  background: transparent;
  &::v-deep {
    .el-calendar__body {
      padding: 0px;
    }
    tbody {
      border: 2px solid transparent;
    }

    tr {
      border: 1px solid transparent;
    }

    th {
      color: #fff;
    }

    td {
      text-align: center;
      border: none;
    }
    td.is-selected {
      background: rgba(255, 255, 255, 0.1);
    }

    td.prev,
    td.next {
      color: rgba(255, 255, 255, 0.1);
    }

    .el-calendar__title {
      color: #fff;
    }

    .el-calendar-day {
      height: auto;
      position: relative;
      .circle {
        top:3px;
        left:0px;
        width:100%;
        position:absolute;
        display:flex;
        justify-content: center;
        gap:5px;
        span {
          display:inline-block;
          width:5px;
          height:5px;
          border-radius: 50%;

          &.REVIEW { background:#FA5657; }
          &.TODO { background:#5462FF; }
          &.DONE { background:#5462FF;}
        }
      }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .el-calendar__header {
      position: relative;
      display: flex;
      justify-content: center;
      border: none;

      .el-button-group {
        button {
          position: absolute;
          // top: 50%;
          // transform: translateY(-50%);
          top:4px;
          color: #fff;
          background: transparent;
          border: none;
          font-size: 16px;
        }
        button:nth-child(1) {
          left: 20px;
        }

        button:nth-child(2) {
          display: none;
        }

        button:nth-child(3) {
          right: 20px;
        }
      }
    }
  }
}

.button {
  &--icon {
    position: absolute;
    top: 3px;
    min-width: unset;
    padding: 0px;
    width: auto;
    z-index: 10;
    font-size: 16px;
    background: transparent;
    border: none;
  }

  &--left {
    left: 10px;
  }

  &--right {
    right: 10px;
  }
}
</style>
