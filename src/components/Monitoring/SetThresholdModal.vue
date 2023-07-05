<template>
  <el-dialog
    :visible="active"
    :title="modalTitle"
    :width="modalWidth"
    @close="$emit('close')"
    @closed="$emit('closed')"
  >
    <div class="set-threshold">
      <div class="set-threshold-form">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="set-threshold-form__item"
        >
          <div class="set-threshold-form__item-header">
            {{ item.name }}
          </div>
          <div class="set-threshold-form__item-value">
            <el-input
              v-model="item.model"
              ref="refModelInput"
              :disabled="isLoadingSetThreshold"
              type="number"
              :min="0"
            />
          </div>
          <div class="set-threshold-form__item-unit">
            {{ item.unit }}
          </div>
        </div>
      </div>
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
        :disabled="isLoadingSetThreshold"
      >
        {{ $t("common.BTN.close") }}
      </button>
      <button
        v-loading="isLoadingSetThreshold"
        class="button"
        type="is-primary"
        @click="saveThreshold"
        :disabled="isLoadingSetThreshold"
      >
        {{ $t("common.BTN.save") }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetThresholdModal',
  props: {
    active: {
      type: Boolean,
      required: true
    },
    vmName: {
      type: String,
      default: ''
    },
    vmIdx: { // [NX] VM
      type: [Number, String],
      default: null
      // required: true
    },
    instanceId: { // [AWS] EC2
      type: String,
      default: ''
    },
    volumeId: { // [AWS] EBS
      type: String,
      default: ''
    },
    /**
     * [{ name: 'CPU 사용률 (%)', model: '', unit: '%' }]
     */
    items: {
      type: Array,
      required: true
    },
    modalWidth: {
      type: String,
      default: '800px'
    },
    threshold: {
      type: Object,
      default: () => ({})
    }
  },
  watch: {
    active (visible) {
      if (visible) {
        const keys = Object.keys(this.threshold)
        if (keys.length) {
          keys.forEach(key => {
            const findModel = this.items.find(item => item.uniqueKey === key)
            if (findModel) {
              findModel.model = this.threshold[key] || 0
            }
          })
        }
      }
    }
  },
  computed: {
    modalTitle () {
      return this.vmName
        ? `${this.vmName} ${this.$v('모니터링 임계치')}`
        : this.$v('모니터링 임계치')
    }
  },
  methods: {
    validateModelValue () {
      return new Promise((resolve, reject) => {
        let errorMsg = ''
        this.items.forEach((item, index) => {
          if (parseInt(item.model) < 0) {
            console.log('🚀 ~ file: SetThresholdModal.vue:128 ~ this.items.forEach ~ parseInt(item.model)', parseInt(item.model))
            this.$refs.refModelInput[index].focus()
            errorMsg = 'minIsZero'
            return
          }
          if (item.unit === '%' && parseInt(item.model) > 100) {
            this.$refs.refModelInput[index].focus()
            errorMsg = 'PercentOverflow'
            return
          }
          if (Number.isNaN(parseInt(item.model))) {
            this.$refs.refModelInput[index].focus()
            errorMsg = 'the value is not a number'
          }
          // resolve()
        })

        if (errorMsg) throw new Error(errorMsg)
        resolve()
      })
    },
    getThresholdObject () {
      const obj = {}

      this.items.forEach(item => {
        if (item.thresholdKey) {
          obj[item.thresholdKey] = Number.isNaN(parseInt(item.model))
            ? null
            : Number(item.model)
        }

        if (item.thresholdKey === 'controllerAvgIoLatencyThreshold' && obj.controllerAvgIoLatencyThreshold) {
          // 컨트롤러 I/O 평균 지연율 IOPS -> ms 변환
          obj.controllerAvgIoLatencyThreshold = obj.controllerAvgIoLatencyThreshold * 1000
        }
      })

      return obj
    },
    async saveThreshold () {
      try {
        this.isLoadingSetThreshold = true

        await this.validateModelValue()

        const reqObj = this.getThresholdObject()
        if (this.vmIdx) await API.compute.setVmThreshold(this.vmIdx, reqObj) // [NX] VM
        if (this.instanceId) { // [AWS] EC2
          await API.aws.updateAwsEc2CommonThreshold({
            ...reqObj,
            instanceId: this.instanceId
          })
        }
        if (this.volumeId) { // [AWS] EBS
          await API.aws.updateAwsEbsCommonThreshold({
            ...reqObj,
            readBandwidth: reqObj.readBandwidth * 1024,
            writeBandwidth: reqObj.writeBandwidth * 1024,
            avgReadBytes: reqObj.avgReadBytes * 1024,
            avgWriteBytes: reqObj.avgWriteBytes * 1024,
            volumeId: this.volumeId
          })
        }

        this.$alert(this.$t('common.ALERT.NUTA.049'), {
          callback: () => {
            this.$emit('full-update')
            this.$emit('close')
          }
        })
      } catch (error) {
        let percentOverFlowAlert = null
        if (error.message === 'minIsZero') {
          percentOverFlowAlert = () => this.$v('임계값은 0 이하로 설정 할 수 없습니다.')
          this.$alert(this.$t('common.ALERT.NUTA.047') + '<br>' + percentOverFlowAlert(), { dangerouslyUseHTMLString: true })
        } else if (error.message === 'PercentOverflow') {
          percentOverFlowAlert = () => {
            if (this.vmIdx) return this.$t('common.ALERT.NUTA.048') // CPU, 메모리, 디스크 사용률은<br>100을 초과할 수 없습니다.
            if (this.instanceId) return this.$t('common.ALERT.NUTA.050') // CPU 사용률은 100을 초과할 수 없습니다
            if (this.volumeId) return this.$t('common.ALERT.NUTA.051') // 유휴시간, 버스트 잔고 임계치는<br>100을 초과할 수 없습니다.
          }

          this.$alert(this.$t('common.ALERT.NUTA.047') + '<br>' + percentOverFlowAlert(), { dangerouslyUseHTMLString: true })
        } else {
          this.$alert(this.$t('common.ALERT.NUTA.047')) // 값을 확인해주세요.
        }
      } finally {
        this.isLoadingSetThreshold = false
      }
    }
  },
  data: () => ({
    isLoadingSetThreshold: false
  })
}
</script>

<style lang="scss" scoped>
.set-threshold {
  padding-bottom: $gap;
  margin-bottom: $gap;
  border-bottom: 1px solid $purple-gray;

  &-form {
    display: flex;
    flex-wrap: wrap;

    :nth-child(2n-1) {
      margin-right: $gap-s;
    }

    &__item {
      display: flex;
      align-items: center;
      flex: auto;
      margin-bottom: $gap-s;
      width: calc(50% - #{$gap-s});

      & > * {
        display: inline-block;
      }

      & > * + * {
        margin-left: $gap-s;
      }

      &-header {
        width: 180px;
        white-space: nowrap;
        font-size: 14px;
      }

      &-value {
        width: 100px;

        margin-left: 15px;

        &::v-deep {
          .el-input__inner {
            background-color: $white;
            color: $text-black;

            &:focus {
              color: $text-black;
            }
          }
        }
      }

      &-unit {
        margin-left: 15px;
      }
    }
  }
}
</style>
