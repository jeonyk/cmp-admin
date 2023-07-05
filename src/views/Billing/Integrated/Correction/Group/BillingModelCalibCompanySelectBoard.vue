<template>
  <dashboard-panel
    :title="routeTitle"
    :is-used-header="true"
    class="select-board"
  >
    <!-- 좌측 보정 모델 보드 -->

    <template
      #headerPostfix
    >
      <span
        class="postfix"
      >({{
        $t("bill.MODEL.allCount", { count: modelList.length })
      }})</span>
    </template>
    <template #header>
      <div class="button-area">
        <button
          v-if="!fromSelectModal"
          class="button"
          type="is-primary"
          @click="$emit('click-create-calib-model')"
        >
          {{ $v('보정 모델 등록') }}
        </button>
      </div>
    </template>
    <!-- 전체 보정 모델 리스트 -->
    <billing-model-calib-list
      v-if="modelList.length !== 0"
      :from-select-modal="fromSelectModal"
      :model-type="modelType"
      :model-list="modelList"
      @change-selected-model="(index, model) => $emit('change-selected-model',index, model)"
      @delete-model-group="model => $emit('delete-model-group', model)"
    />
    <div
      v-else
      class="model-list__is-empty"
    >
      <span class="model-list-text">
        {{ routeTitle }}을 등록해주세요.</span>
    </div>
  </dashboard-panel>
</template>
<script>
import { DashboardPanel } from '@sd-fe/cmp-core'
import BillingModelCalibList from '../BillingModelCalibList.vue'

export default {
  components: {
    DashboardPanel,
    BillingModelCalibList
  },
  props: {
    modelType: {
      type: String,
      default: 'server'
    },
    routeTitle: {
      type: String,
      default: '-별 보정 모델'
    },
    modelList: {
      type: Array,
      default () {
        return []
      }
    },
    fromSelectModal: {
      type: Boolean,
      default: false
    }
  }

}
</script>

<style lang="scss" scoped>
 .select-board {
   display: flex;
   min-width: 385px;

 }
.model-list__is-empty {
  display: flex;
  border-radius: 4px;
  border: 1px solid $purple-gray;
  height: 70vh;

  justify-content: center;
  .model-list-text {
    display: flex;
    align-self: center;
    color: $gray;
    font-size: 16px;
  }
}
</style>
