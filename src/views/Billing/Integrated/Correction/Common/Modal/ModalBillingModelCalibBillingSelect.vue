<template>
  <el-dialog
    :title="$v('과금모델 선택')"
    width="95%"
    :visible="visible"
    @close="$emit('close')"
  >
    <modal-billing-model-standard-list
      class="billing-model-standard-list"
      :from-select-modal="true"
      @change-selected-model="handleChangeModel"
    />

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
        @click="onClickRegisterBillingModel"
      >
        {{ $v('등록') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import ModalBillingModelStandardList from '@/views/Billing/Integrated/Model/BillingModelStandard/ModalBillingModelStandardList.vue'

export default {
  components: {
    ModalBillingModelStandardList
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleChangeModel (model) {
      this.selectedModel = model
    },
    onClickRegisterBillingModel () {
      this.$emit('register-billing-model', this.selectedModel)
    }
  },
  data () {
    return {
      selectedModel: {}
    }
  }
}
</script>
<style lang="scss" scoped>
 .billing-model-standard-list {
  &::v-deep {
    #billingModelSelectDashboard {
      .panel-head {
        display: none;
      }
    }
  }
 }
 .modal-button-area {
    border-top: 1px solid $purple-gray;
    padding-top: 20px;
}
</style>
