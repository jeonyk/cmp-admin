
<template>
  <!-- 지연 | 대기 날짜를 구해주는 컴포넌트 입니다 -->
  <span :style="textStyle">
    {{ isDone ? '완료' : dateStatus }}
  </span>
</template>

<script>
import dayjs from 'dayjs'
export default {
  props: {
    currentDate: {
      type: String,
      default: function () {
        return dayjs().format('YYYY-MM-DD')
      }
    },
    date: { // 완료희망일 받음
      type: String,
      default: ''
    },
    isDone: {
      type: Boolean,
      default: false
    },
    delayedStyle: {
      type: Object,
      default: () => {
        return {
          color: '#ff5c67'
        }
      }
    },
    processingStyle: {
      type: Object,
      default: () => {
        return {
          color: '#f4a462'
        }
      }
    },
    doneStyle: {
      type: Object,
      default: () => {
        return {
          // color: '#f4a462'
        }
      }
    }

  },
  computed: {
    diffDays () {
      const expectedDate = dayjs(this.expectedDate)
      return expectedDate.diff(this.currentDate, 'days')
    },
    hasStillDate () {
      return this.diffDays >= 0
    },
    dateStatus () {
      const isPlus = this.hasStillDate ? '-' : '+'
      const text = this.hasStillDate ? '처리중' : '지연'
      return `D${isPlus}${Math.abs(this.diffDays)} ${text}`
    },
    expectedDate () {
      return dayjs(this.date).format('YYYY-MM-DD')
    },
    textStyle () {
      if (this.isDone) {
        return {
          ...this.doneStyle
        }
      }
      if (this.hasStillDate) {
        return {
          ...this.processingStyle
        }
      }
      return {
        ...this.delayedStyle

      }
    }
  }
}
</script>
