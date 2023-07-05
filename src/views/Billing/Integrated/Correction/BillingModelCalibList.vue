<!--
  * 파일명 : BillingModelDistList.vue
  * 파일 기능 : [빌링 > 모델 > 배부모델] 배부모델 모든 리스트를 확인합니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 fix: sorting 버그 픽스 중
 -->

<template>
  <div
    v-loading="false"
    class="billing-panel left down"
  >
    <!-- 보정 모델 정보 카드 -->
    <billing-model-calib-list-item
      v-for="item in sortedModelList"
      @click="changeModal(item.id)"
      :key="item.id"
      :model-type="modelType"
      :model-data="item"
      :modifiable="!fromSelectModal"
      :this-model-idx="item.id"
      :selected-idx="selectedModelIdx"
      @delete-model-group="model => $emit('delete-model-group', model)"
    />
  </div>
</template>
<script>
import BillingModelCalibListItem from './BillingModelCalibListItem.vue'

export default {
  components: {
    BillingModelCalibListItem
  },
  props: {
    modelType: {
      type: String,
      default: 'server'
    },
    fromSelectModal: {
      type: Boolean,
      default: false
    },
    modelList: {
      type: Array,
      default () {
        return []
      }
    }
  },
  computed: {
    sortedModelList () {
      const copy = this.modelList.slice(0)
      copy.sort((a, b) => b.createDate - a.createDate)
      return copy
    }
  },
  created () {
    this.changeModal(this.sortedModelList[0].id)
  },

  data () {
    return {
      isOpenAllModel: false,
      filterOption: 2,
      selectedModelIdx: 0
    }
  },
  methods: {
    changeModal (index) {
      if (this.selectedModelIdx === index) return
      this.$emit('change-selected-model', index, this.sortedModelList.find(model => model.id === index))
      this.selectedModelIdx = index
    }
  }
}
</script>
<style lang="scss">
.billing-filter {
  display: flex;
  justify-content: space-between;
  margin-bottom: $gap;
  margin-top: $gap-m;

  & .is-billing-text {
    color: $light-gray;
    font-size: 12px;
  }
}
</style>
