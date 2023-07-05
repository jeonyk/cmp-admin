<template>
  <el-dialog
    title="서버별 보정 모델 선택"
    width="95%"
    class="model-billing-model-calib-select"
    :visible="visible"
    @close="$emit('close')"
  >
    <div class="model-billing-model-calib-select-body">
      <billing-model-calib-server
        :from-select-modal="true"
        @change-selected-model="handlerChangeModel"
      />
    </div>
    <!--푸터 버튼 영역-->
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="$emit('change-selected-model', selectedModelId, selectedModel)"
      >
        {{ $v('등록') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import BillingModelCalibServer from '../../Server/BillingModelCalibServer.vue'

export default {
  components: {
    BillingModelCalibServer
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handlerChangeModel (id, model) {
      this.selectedModel = model
      this.selectedModelId = id
      // this.$emit('change-selected-model', id, model)
    }
  },
  data () {
    return {
      selectedModelId: null,
      selectedModel: null
    }
  }
}
</script>
<style lang="scss" scoped>
.model-billing-model-calib-select {

  &::v-deep {
    .-left .panel-body {
      height: 600px;
      overflow-y: auto;
    }
  }

  .model-billing-model-calib-select-body {
    overflow-y: scroll;
    max-height: 800px;
  }
 }
 .modal-button-area {
    border-top: 1px solid $purple-gray;
    padding-top: 20px;
}
</style>
