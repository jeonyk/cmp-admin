<template>
  <div class="service-date">
    <el-date-picker
      v-model="serviceDate.date"
      type="date"
      :placeholder="$v('서비스 예약')"
      :disabled="disabled"
      :picker-options="svcOpenDtOpt"
      @change="changeServiceDate('date')"
    />
    <el-select
      v-model="serviceDate.time"
      :placeholder="$i18n.locale === 'en' ? 'time' : '시'"
      :popper-append-to-body="false"
      :disabled="disabled"
      class="service-time-select"
      @change="changeServiceDate('time')"
    >
      <el-option
        v-for="time in 24"
        :key="'time' + time"
        :label="time - 1 < 10 ? '0' + (time - 1) : time - 1"
        :value="time - 1"
        :disabled="
          serviceDate.date &&
            +serviceDate.date === +new Date().setHours(0, 0, 0, 0)
            ? new Date().getHours() > time - 1
            : false
        "
      />
    </el-select>
    {{ $v('시') }}
    <el-select
      v-model="serviceDate.min"
      :placeholder="$i18n.locale === 'en' ? 'min' : '분'"
      :popper-append-to-body="false"
      :disabled="disabled"
      class="service-time-select"
    >
      <el-option
        v-for="min in [0, 10, 20, 30, 40, 50]"
        :key="'min' + min"
        :label="min < 10 ? '0' + min : min"
        :value="min"
        :disabled="
          serviceDate.date &&
            +serviceDate.date === +new Date().setHours(0, 0, 0, 0) &&
            +serviceDate.time === new Date().getHours()
            ? new Date().getMinutes() > min
            : false
        "
      />
    </el-select>
    <span v-if="$i18n.locale !== 'en'">{{ $v('분') }}</span>

    <button
      v-if="useResetButton"
      :disabled="!init"
      class="button -setting"
      type="is-primary"
      @click="$emit('cancel')"
    >
      {{ $v('예약 취소') }}
    </button>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'ServiceDate',
  props: {
    // Disabled 옵션
    disabled: {
      type: Boolean,
      default: false
    },
    // 최초 데이터 세팅
    init: {
      type: [String, Date, Number],
      default: null
    },
    useResetButton: { // [예약취소] 사용여부 체크
      type: Boolean,
      default: false
    }
  },
  watch: {
    autoSetting (setting) {
      this.emitData(this.serviceDate, setting)
    },
    serviceDate: {
      handler (date) {
        this.emitData(date, this.autoSetting)
      },
      deep: true,
      immediate: true
    },
    init: {
      handler (initServiceDate) {
        const startOfDay = cloneDeep(initServiceDate)

        if (!startOfDay) {
          this.serviceDate = { date: null, time: 0, min: 0 }
          return
        }

        startOfDay.setHours(0)
        startOfDay.setMinutes(0)
        startOfDay.setSeconds(0)

        this.serviceDate.date = startOfDay

        const hour = initServiceDate.getHours()
        const minutes = initServiceDate.getMinutes()

        if (hour < 10) {
          this.serviceDate.time = '0' + hour
        } else {
          this.serviceDate.time = '' + hour
        }

        if (minutes < 10) {
          this.serviceDate.min = '00'
        } else {
          this.serviceDate.min = '' + minutes
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    /**
     * 서비스 개시일(날짜) 리셋
     * 서비스 개시일이 현재 시간보다 과거로 설정되어 있을 때, 시/분을 null로 설정합니다.
     */
    changeServiceDate (field) {
      if (!this.serviceDate.date) return
      const allServiceDate =
        this.serviceDate.date.getTime() +
        this.serviceDate.time * 60 * 60 * 1000 +
        this.serviceDate.min * 60 * 1000
      if (+new Date() >= allServiceDate) {
        this.serviceDate.min = null
        if (field === 'date') this.serviceDate.time = null
      }
    },
    getServiceDate (date) {
      if (
        !date.date ||
        date.time === null ||
        date.min === null
      ) { return null }
      return (
        date.date.getTime() +
        date.time * 60 * 60 * 1000 +
        date.min * 60 * 1000
      )
    },
    /**
     * 데이터 내보내기
     * @param {Object} date this.serviceDate
     * @param {Boolean} setting this.autoSetting
     */
    emitData (date = this.serviceDate, setting = this.autoSetting) {
      const serviceDate = this.getServiceDate(date)

      // [예약설정] 체크시 세팅
      const emit = (this.useCheckbox) ? { serviceDate, setting } : serviceDate
      this.$emit('change', emit)
    }
  },
  data: () => ({
    autoSetting: false,
    serviceDate: {
      date: null,
      time: 0,
      min: 0
    },
    svcOpenDtOpt: {
      // datepicker 설정
      disabledDate (time) {
        const today = new Date().toDateString()
        return time.getTime() < new Date(today)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.service-date {
  .service-time-select {
    width: 65px !important;
    margin-left: 15px;
    margin-right: 5px;
  }

  .-setting {
    margin-left: $gap;
  }
}

</style>
