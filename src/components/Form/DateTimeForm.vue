<template>
  <el-dialog
    width="530px"
    title="자동 예약 설정"
    :visible.sync="isView"
    @close="$emit('close')"
  >
    <div class="datetime-form">
      <label>작업 예정일 </label>
      <div style="display: flex; align-items:center;">
        <el-date-picker
          v-model="date"
          type="date"
          style="width:110px; margin:0px 10px;"
          :clearable="false"
          :picker-options="pickerOptions"
        />
        <el-select
          v-model="hour"
          style="width: 100px"
        >
          <el-option
            :value="0"
            :label="0"
          />
          <el-option
            :value="1 "
            :label="1"
          />
          <el-option
            :value="2"
            :label="2"
          />
          <el-option
            :value="3"
            :label="3"
          />
          <el-option
            :value="4"
            :label="4"
          />
          <el-option
            :value="5"
            :label="5"
          />
          <el-option
            :value="17"
            :label="17"
          />
        </el-select>
        <span style="padding:10px;">{{ $v('시') }}</span>
        <el-select
          v-model="minute"
          style="width: 100px"
        >
          <el-option
            :value="0"
            label="00"
          />
          <el-option
            :value="10"
            label="10"
          />
          <el-option
            :value="20"
            label="20"
          />
          <el-option
            :value="30"
            label="30"
          />
          <el-option
            :value="40"
            label="40"
          />
          <el-option
            :value="50"
            label="50"
          />
        </el-select>
        <span style="padding:10px;">{{ $v('분') }}</span>
      </div>
    </div>
    <div style="display:flex; justify-content:center; padding:20px 0px;">
      <el-checkbox
        v-model="isChecked"
        style="margin-right:10px;"
      />
      <span>
        {{ $v('예약 설정(자동)') }}
      </span>
    </div>
    <div style="display:flex; justify-content:center; gap:10px;">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        @click="$emit('save', emitData)"
      >
        확인
      </button>
    </div>
  </el-dialog>
</template>

<script>
import Dayjs from 'dayjs'
export default {
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    computedTime () {
      return Dayjs(new Date()).set('hour', this.hour).set('minute', this.minute).set('second', 0).valueOf()
    },
    isAuto () {
      return this.isChecked
    },
    emitData () {
      return {
        time: this.computedTime,
        isChecked: this.isAuto
      }
    }
  },
  watch: {
    isVisible: {
      handler (newVal) {
        this.isView = newVal
      }
    }
  },
  data () {
    return {
      pickerOptions: {
        disabledDate (value) {
          const calendarDay = new Date(value)
          const today = new Date()
          // today.setHours(0, 0, 0, 0) // 오늘 자정으로 시간 설정
          return calendarDay.getTime() < today.getTime() - 24 * 60 * 60 * 1000 // 현재 날짜 이전은 disabled 처리
        }
      },
      // pickerOptions: {
      //   disabledDate (value) {
      //     const calendarDay = new Date(value)
      //     return calendarDay.getTime() < new Date().getTime()
      //   }
      // },
      isView: false,
      date: new Date(),
      hour: 0,
      minute: 0,
      isChecked: false
    }
  }
}
</script>

<style lang="scss" scoped>
.datetime-form {
  display: flex;
  align-items: center;
  &::v-deep {
    .el-date-editor {
        // border:1px solid red;
        .el-input__inner {
            border:none;
        }
    }
  }
}
</style>
