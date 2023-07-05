<template>
  <div class="monitor-filter">
    <strong class="monitor-filter-text">
      {{ $v('조회 기간') }}
    </strong>
    <el-radio-group
      v-model="filterBase"
      class="monitor-filter-group"
    >
      <el-radio-button
        v-for="option in baseOptions"
        :key="option.name"
        :label="option.value"
      >
        {{ option.name }}
      </el-radio-button>
      <el-tooltip
        v-model="isActiveCustomTooltip"
        effect="light"
        placement="bottom-start"
        popper-class="shade-popper"
        manual
        ref="customTooltip"
      >
        <el-radio-button
          :label="customValue"
          ref="customTooltipBtn"
        >
          {{ $v('사용자 지정') }}
        </el-radio-button>
        <div
          slot="content"
          class="custom-content"
        >
          <div class="custom-content-header">
            {{ $v('사용자 지정') }}
          </div>
          <div class="custom-content-body">
            <div class="custom-content-body__list">
              <div
                v-for="option in customRadioOptions"
                :key="option.title"
                class="custom-content-body__list-wrap"
              >
                <div class="option-title">
                  {{ option.title }}
                </div>
                <el-radio-group
                  v-model="filterCustom"
                  :key="option.title + '_filter'"
                >
                  <el-radio-button
                    v-for="item in option.children"
                    :key="item.name"
                    :label="item.value"
                    :disabled="item.disabled"
                  >
                    {{ item.name }}
                  </el-radio-button>
                </el-radio-group>
              </div>
            </div>
            <div class="custom-content-footer">
              *{{ $v('UTC 기준') }}
            </div>
            <i
              class="mdi mdi-close"
              @click="isActiveCustomTooltip = false"
            />
          </div>
        </div>
      </el-tooltip>
    </el-radio-group>
    <div
      class="monitor-filter-reset"
      @click="resetFilter"
    >
      <refresh-icon class="monitor-filter-reset__icon" />
      <span class="monitor-filter-reset__text">{{ $v('초기화') }}</span>
    </div>
    <div class="set-threshold">
      <div
        class="icon-btn"
        @click="isActiveSetThresholdModal = !isActiveSetThresholdModal"
      >
        <set-icon
          :width="18"
          :height="18"
          icon-color="white"
        />
      </div>
    </div>
    <set-threshold-modal
      :vm-idx="vmIdx"
      :instance-id="instanceId"
      :volume-id="volumeId"
      :threshold="threshold"
      :active.sync="isActiveSetThresholdModal"
      :items.sync="testItems"
      :modal-width="volumeId ? '820px' : '800px'"
      @full-update="() => $emit('full-update')"
      @close="isActiveSetThresholdModal = false"
    />
  </div>
</template>

<script>
import RefreshIcon from '../Icons/RefreshIcon.vue'
import SetIcon from '../Icons/SetIcon.vue'
import dayjs from 'dayjs'
import { SetThresholdModal } from '@sd-fe/cmp-core'

export default {
  components: {
    RefreshIcon,
    SetIcon,
    SetThresholdModal
  },
  name: 'MonitoringChartFilter',
  props: {
    threshold: {
      type: Object,
      default: () => ({})
    },
    vmIdx: { // [NX] VM
      type: [Number, String, undefined],
      default: undefined
      // required: true
    },
    instanceId: { // [AWS] EC2
      type: String,
      default: ''
    },
    volumeId: { // [AWS] EBS
      type: String,
      default: ''
    }
  },
  created () {
    this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
    this.$emit(
      'update:start-date',
      dayjs()
        .subtract(1, 'hours')
        .format('YYYY-MM-DD HH:mm:ss')
    )

    this.setBaseOptions()
    this.filterBase = 0
  },
  mounted () {
    document.addEventListener('click', this.onClickElement, { passive: false })
  },
  beforeDestroy () {
    document.removeEventListener('click', this.onClickElement)
  },
  computed: {
    /**
     * 사용자 지정 필터 버튼의 값을 지정
     */
    customValue () {
      return Math.max(...this.baseOptions.map(opt => opt.value)) + 1
    },
    testItems () {
      if (this.vmIdx) return this.vmThresholdItems
      else if (this.instanceId) return this.ec2ThresholdItems
      else if (this.volumeId) return this.ebsThresholdItems
      else return []
    }
  },
  watch: {
    /**
     * 조회 기간 필터값이 바뀔 경우 startTime, endTime을 계산해서
     * 부모에게 던짐
     * startTime, endTime: YYYY-MM-DD HH:mm:ss
     */
    filterBase (value) {
      /**
       * 필터 값이 "사용자 지정"으로 변경되었을 경우
       * 사용자 지정 필터 툴팁을 노출시키고 종료
       */
      if (value === this.customValue) {
        this.isActiveCustomTooltip = true
        return
      }

      // 사용자 지정에서 선택한 시간과 새로 선택한 시간이 동일할 때 종료 (API 재조회 방지)
      if (this.filterCustom) {
        const sameBaseOptionsIndex = this.sameCustomBaseValues.findIndex(value => value === this.filterCustom)
        if (sameBaseOptionsIndex === value) return
      }

      // 데이터 로딩중일 경우
      switch (value) {
        case 0:
          this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          this.$emit(
            'update:start-date',
            dayjs()
              .subtract(1, 'hours')
              .format('YYYY-MM-DD HH:mm:ss')
          )
          break
        case 1:
          this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          this.$emit(
            'update:start-date',
            dayjs()
              .subtract(2, 'hours')
              .format('YYYY-MM-DD HH:mm:ss')
          )
          break
        case 2:
          this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          this.$emit(
            'update:start-date',
            dayjs()
              .subtract(3, 'hours')
              .format('YYYY-MM-DD HH:mm:ss')
          )
          break
        case 3:
          this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          this.$emit(
            'update:start-date',
            dayjs()
              .subtract(1, 'days')
              .format('YYYY-MM-DD HH:mm:ss')
          )
          break
        case 4:
          this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          this.$emit(
            'update:start-date',
            dayjs()
              .subtract(3, 'days')
              .format('YYYY-MM-DD HH:mm:ss')
          )
          break
        case 5:
          this.$emit('update:end-date', dayjs().format('YYYY-MM-DD HH:mm:ss'))
          this.$emit(
            'update:start-date',
            dayjs()
              .subtract(1, 'week')
              .format('YYYY-MM-DD HH:mm:ss')
          )
          break
        default:
          break
      }

      // 사용자 지정에 선택한 시간을 표시합니다.
      this.filterCustom = this.sameCustomBaseValues[value]
    },
    filterCustom (custom) {
      const [val, str] = custom.split(' ')
      const start = dayjs()
        .subtract(parseInt(val), str)
        .format('YYYY-MM-DD HH:mm:ss')
      const end = dayjs().format('YYYY-MM-DD HH:mm:ss')

      this.$emit('change-custom-date', { start, end })
    }
  },
  methods: {
    /**
     * 필터 리셋
     */
    resetFilter () {
      this.filterBase = 0
    },
    /**
     * 툴팁 영역 바깥 클릭시 필터 툴팁 종료
     */
    onClickElement (e) {
      const customTooltipBtn = this.$refs.customTooltipBtn

      if (customTooltipBtn) {
        if (!customTooltipBtn.$el.contains(e.target)) {
          // 사용자 지정된 시간이 base 조회 기간에 포함되어 있으면 base 조회 기간을 선택처리 합니다.
          if (this.sameCustomBaseValues.includes(this.filterCustom)) this.filterBase = this.sameCustomBaseValues.findIndex(value => value === this.filterCustom)

          this.isActiveCustomTooltip = false
        } else {
          this.isActiveCustomTooltip = true
        }
      }
    },
    /**
     * 기본이 되는 필터 값 설정
     */
    setBaseOptions () {
      this.baseOptions = [
        1 + this.$v('시간'),
        2 + this.$v('시간'),
        3 + this.$v('시간'),
        1 + this.$v('일'),
        3 + this.$v('일'),
        1 + this.$v('주')
      ].map((n, i) => ({ name: n, value: i }))
    }
  },
  data: (root) => ({
    isActiveSetThresholdModal: false,
    isCustom: false,
    filterBase: null,
    filterCustom: null,
    baseOptions: [],
    isActiveCustomTooltip: false,
    sameCustomBaseValues: ['1 hour', '2 hours', '3 hours', '1 day', '3 days', '1 week'],
    customRadioOptions: [
      {
        title: root.$t('common.TERMS.minute'),
        children: [
          { name: 15 + root.$t('common.TERMS.minute'), value: '15 minutes' },
          { name: 30 + root.$t('common.TERMS.minute'), value: '30 minutes' },
          { name: 45 + root.$t('common.TERMS.minute'), value: '45 minutes' }
        ]
      },
      {
        title: root.$v('시간'),
        children: [
          { name: 1 + root.$v('시간'), value: '1 hour' },
          { name: 2 + root.$v('시간'), value: '2 hours' },
          { name: 3 + root.$v('시간'), value: '3 hours' },
          { name: 6 + root.$v('시간'), value: '6 hours' },
          { name: 8 + root.$v('시간'), value: '8 hours' },
          { name: 12 + root.$v('시간'), value: '12 hours' }
        ]
      },
      {
        title: root.$v('일'),
        children: [
          { name: 1 + root.$v('일'), value: '1 day' },
          { name: 2 + root.$v('일'), value: '2 days' },
          { name: 3 + root.$v('일'), value: '3 days' },
          { name: 4 + root.$v('일'), value: '4 days' },
          { name: 5 + root.$v('일'), value: '5 days' },
          { name: 6 + root.$v('일'), value: '6 days' }
        ]
      },
      {
        title: root.$v('주'),
        children: [
          { name: 1 + root.$v('주'), value: '1 week' },
          { name: 2 + root.$v('주'), value: '2 week' },
          { name: 4 + root.$v('주'), value: '4 week' },
          { name: 6 + root.$v('주'), value: '6 week' }
        ]
      },
      {
        title: root.$v('개월'),
        children: [
          { name: 3 + root.$v('개월'), value: '3 month' },
          { name: 6 + root.$v('개월'), value: '6 month', disabled: !!root.vmIdx },
          { name: 12 + root.$v('개월'), value: '12 month', disabled: !!root.vmIdx }
        ]
      }
    ],
    vmThresholdItems: [
      {
        name: root.$v('{label} 사용률 (%)', { label: 'CPU' }),
        model: 0,
        unit: '%',
        uniqueKey: 'hypervisorCpuUsagePpm',
        thresholdKey: 'cpuThreshold'
      },
      {
        name: root.$v('{label} 사용률 (%)', { label: root.$v('메모리') }),
        model: 0,
        unit: '%',
        uniqueKey: 'memoryUsagePpm',
        thresholdKey: 'memoryThreshold'
      },
      {
        name: root.$v('{label} 사용률 (%)', { label: root.$v('디스크') }),
        model: 0,
        unit: '%',
        uniqueKey: 'controllerUserBytes',
        thresholdKey: 'diskThreshold'
      },
      // {
      //   name: '네트워크 패킷 수신율 (kBps)',
      //   model: 0,
      //   unit: 'kBps',
      //   uniqueKey: 'networkReceivedRateKbps',
      //   thresholdKey: ''
      // },
      // {
      //   name: '네트워크 패킷 전송율 (kBps)',
      //   model: 0,
      //   unit: 'kBps',
      //   uniqueKey: 'networkTransmittedRateKbps',
      //   thresholdKey: ''
      // },
      {
        name: root.$v('컨트롤러 IOPS (IOPS)'),
        model: 0,
        unit: 'IOPS',
        uniqueKey: 'controllerNumIops',
        thresholdKey: 'controllerIopsThreshold'
      },
      {
        name: root.$v('컨트롤러 평균 I/O 대역폭 (IOPS)'),
        model: 0,
        unit: 'IOPS',
        uniqueKey: 'controllerIoBandwidthKbps',
        thresholdKey: 'controllerIoBandwidthThreshold'
      },
      {
        name: root.$v('컨트롤러 평균 I/O 지연율 (ms)'),
        model: 0,
        unit: 'ms',
        uniqueKey: 'controllerAvgIoLatencyUsecs',
        thresholdKey: 'controllerAvgIoLatencyThreshold'
      }
    ],
    ec2ThresholdItems: [
      {
        name: root.$v('{label} 사용률 (%)', { label: 'CPU' }),
        model: 0,
        unit: '%',
        uniqueKey: 'cpuUtilization',
        thresholdKey: 'cpuUtilization'
      },
      {
        name: root.$v('디스크 읽기(바이트)'),
        model: 0,
        unit: 'byte',
        uniqueKey: 'diskReadBytes',
        thresholdKey: 'diskReadBytes'
      },
      {
        name: root.$v('디스크 읽기 작업(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'diskReadOps',
        thresholdKey: 'diskReadOps'
      },
      {
        name: root.$v('디스크 쓰기(바이트)'),
        model: 0,
        unit: 'byte',
        uniqueKey: 'diskWriteBytes',
        thresholdKey: 'diskWriteBytes'
      },
      {
        name: root.$v('디스크 쓰기 작업(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'diskWriteOps',
        thresholdKey: 'diskWriteOps'
      },
      {
        name: root.$v('네트워크 입력(바이트)'),
        model: 0,
        unit: 'byte',
        uniqueKey: 'networkIn',
        thresholdKey: 'networkIn'
      },
      {
        name: root.$v('네트워크 출력(바이트)'),
        model: 0,
        unit: 'byte',
        uniqueKey: 'networkOut',
        thresholdKey: 'networkOut'
      },
      {
        name: root.$v('네트워크 패킷 입력(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'networkPacketIn',
        thresholdKey: 'networkPacketIn'
      },
      {
        name: root.$v('네트워크 패킷 출력(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'networkPacketOut',
        thresholdKey: 'networkPacketOut'
      },
      {
        name: root.$v('상태 검사 실패(시스템)(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'statusCheckFailed',
        thresholdKey: 'statusCheckFailed'
      },
      {
        name: root.$v('상태 검사 실패(전체)(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'statusCheckFailedSystem',
        thresholdKey: 'statusCheckFailedSystem'
      },
      {
        name: root.$v('상태 검사 실패(인스턴스)(개수)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'statusCheckFailedInstance',
        thresholdKey: 'statusCheckFailedInstance'
      }
    ],
    ebsThresholdItems: [
      {
        name: root.$v('읽기 대역폭 (KiB/s)'),
        model: 0,
        unit: 'KiB/s',
        uniqueKey: 'readBandwidth',
        thresholdKey: 'readBandwidth'
      },
      {
        name: root.$v('쓰기 대역폭 (KiB/s)'),
        model: 0,
        unit: 'KiB/s',
        uniqueKey: 'writeBandwidth',
        thresholdKey: 'writeBandwidth'
      },
      {
        name: root.$v('읽기 처리량 (Ops/s)'),
        model: 0,
        unit: 'Ops/s',
        uniqueKey: 'readIops',
        thresholdKey: 'readIops'
      },
      {
        name: root.$v('쓰기 처리량 (Ops/s)'),
        model: 0,
        unit: 'Ops/s',
        uniqueKey: 'writeIops',
        thresholdKey: 'writeIops'
      },
      {
        name: root.$v('평균 대기열 길이 (작업)'),
        model: 0,
        unit: root.$v('개'),
        uniqueKey: 'queueLength',
        thresholdKey: 'queueLength'
      },
      {
        name: root.$v('유휴시간 (%)'),
        model: 0,
        unit: '%',
        uniqueKey: 'timeSpentIdle',
        thresholdKey: 'timeSpentIdle'
      },
      {
        name: root.$v('평균 읽기 크기 (KiB/op)'),
        model: 0,
        unit: 'KiB/op',
        uniqueKey: 'avgReadBytes',
        thresholdKey: 'avgReadBytes'
      },
      {
        name: root.$v('평균 쓰기 크기 (KiB/op)'),
        model: 0,
        unit: 'KiB/op',
        uniqueKey: 'avgWriteBytes',
        thresholdKey: 'avgWriteBytes'
      },
      {
        name: root.$v('평균 읽기 지연 시간 (ms/op)'),
        model: 0,
        unit: 'ms/op',
        uniqueKey: 'avgReadTime',
        thresholdKey: 'avgReadTime'
      },
      {
        name: root.$v('평균 쓰기 지연 시간 (ms/op)'),
        model: 0,
        unit: 'ms/op',
        uniqueKey: 'avgWriteTime',
        thresholdKey: 'avgWriteTime'
      },
      {
        name: root.$v('버스트 잔고 (%)'),
        model: 0,
        unit: '%',
        uniqueKey: 'burstBalance',
        thresholdKey: 'burstBalance'
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.monitor-filter::v-deep {
  .el-radio-group {
    .el-radio-button:first-child {
      .el-radio-button__inner {
        border-radius: 2px 0 0 2px;
        border-color: #3d435e;
      }
    }

    .el-radio-button:last-child {
      .el-radio-button__inner {
        border-radius: 0 2px 2px 0;
      }
    }

    .is-active {
      .el-radio-button__inner {
        color: $white;
        border-color: transparent;
        background-color: $primary;
        border: none;
        box-shadow: -1px 0 0 $primary;
      }
    }

    .el-radio-button__inner {
      border-color: #3d435e;
      color: $input-placeholder;
      background-color: transparent;
      box-shadow: none;
      height: auto;
      line-height: 1;
      padding: 10px 20px;

      &:hover {
        color: $white;
      }
    }
  }
}

.custom-content::v-deep {
  .el-radio-group {
    .el-radio-button:first-child {
      .el-radio-button__inner {
        border-radius: 2px 0 0 2px;
        border-color: #caced0;
      }
    }

    .el-radio-button:last-child {
      .el-radio-button__inner {
        border-radius: 0 2px 2px 0;
      }
    }

    .is-active {
      .el-radio-button__inner {
        background-color: $primary;
        color: $white;
        border-color: transparent;
        box-shadow: none;

        &:hover {
          color: $white;
        }
      }
    }

    .is-disabled {
      .el-radio-button__inner {
        background-color: #f4f4f4;
        border-color: #e7e7e7;
        color: #999;

        &:hover {
          color: #999 !important;
        }
      }
    }

    .el-radio-button__inner {
      border-color: #caced0;
      height: auto;
      padding: 0;
      line-height: 30px;
      height: 32px;
      color: #999;

      &:hover {
        color: $primary;
      }
    }
  }
}

.monitor-filter {
  display: flex;
  align-items: center;

  &-text {
    font-weight: bold;
    font-size: 13px;
    margin-right: $gap-s;
  }

  &-reset {
    display: flex;
    align-items: center;
    margin-left: $gap;
    cursor: pointer;

    &__text {
      margin-left: 5px;
    }
  }

  .set-threshold {
    margin-left: 15px;

    .icon-btn {
      cursor: pointer;
      padding: 6px 9px;
      box-sizing: border-box;
      background-color: $primary;
      border-radius: 2px;
      transition: background-color 300ms ease;

      &:hover {
        background-color: darken($primary, 5%);
      }
    }
  }
}

.custom-content {
  position: relative;
  padding: 10px 15px;
  max-width: 470px;
  text-align: left;

  .mdi-close {
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;

    &::before {
      font-size: 25px;
    }
  }

  &-header {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 25px;
  }

  &-body {
    &__list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: $gap;

      > * + * {
        margin-top: $gap-s;
      }

      &-wrap {
        display: flex;
        align-items: center;
        width: 100%;

        .option-title {
          font-size: 15px;
          white-space: nowrap;
          width: 60px;
          text-align: right;
          padding-right: $gap;
          box-sizing: border-box;
          flex: 0 0 10%;
        }

        &::v-deep {
          .el-radio-group {
            display: flex;
            flex: 1 1 100%;
            width: 100%;

            > label {
              width: 100%;

              > * {
                width: 100%;
              }
            }
          }
        }
      }
    }
  }

  &-footer {
    color: #999;
    text-align: right;
    width: 100%;
  }
}
</style>
