<template>
  <el-dialog
    :title="$v('판매량 임계치 설정')"
    :visible.sync="visible"
    width="400px"
    :before-close="() => $emit('close')"
  >
    <section class="modal-body">
      <div class="input">
        <el-input-number
          :min="0"
          :max="100"
          v-model="lowValue"
        /> {{ $v('% 이하') }}
      </div>
      <div class="input">
        <el-input-number
          :min="0"
          :max="100"
          v-model="upperValue"
        /> {{ $v('% 이상') }}
      </div>
    </section>

    <div class="modal-footer modal-button-area">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $v('저장') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {
  name: 'SetSellingThreshold',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    visible (visible) {
      if (visible) this.copyData()
      else this.reset()
    }
  },
  methods: {
    /**
     * 판매량 임계치 가져오기
     */
    copyData () {
      const { idx, lowValue, upperValue } = cloneDeep(this.data)

      this.idx = idx
      this.lowValue = lowValue
      this.upperValue = upperValue
    },

    /**
     * 판매량 임계치 저장
     */
    async save () {
      const payload = {
        idx: this.idx,
        lowValue: this.lowValue,
        upperValue: this.upperValue
      }

      this.$emit('save', payload)
      this.$emit('close')
    },

    /**
     * 값 초기화
     */
    reset () {
      this.idx = undefined
      this.lowValue = undefined
      this.upperValue = undefined
    }
  },
  data: root => ({
    idx: undefined,
    lowValue: undefined,
    upperValue: undefined
  })
}
</script>

<style lang="scss" scoped>

.input {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $gap;

  > div { margin-right: $gap-s; }
}

.modal-body {
  margin-bottom: 40px;
}
</style>
