<template>
  <div :class="['tag', {'tag-new': data.isNew}]">
    <span style="margin-right:5px;">{{ index }}. </span>
    <span class="tag-text">  {{ data.receiverCompanyName || data.receiverGroupName }}  : {{ data.receiverGroupName }}</span>
    <direction-right style="margin:5px; " />
    <span class="tag-text">  {{ data.senderCompanyName || data.senderGroupName }} : {{ data.senderGroupName }}</span>
    <close-icon
      class="tag--icon"
      @click="$emit('click', data.consignmentIdx)"
      width="12px"
      height="12px"
      style="margin-left:5px;"
    />
  </div>
</template>

<script>
import CloseIcon from '@/components/Icons/CloseIcon.vue'
import DirectionRight from '@/components/Icons/DirectionRight.vue'
export default {
  components: {
    CloseIcon,
    DirectionRight
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    index: {
      type: Number,
      default: 1
    }
  }
}
</script>

<style lang="scss" scoped>

.tag {
  &-new {
    background: rgba(62, 87, 201, 0.2);
    border: 1px solid #3E57C9;
  }
  height:30px;
  display: flex;
  align-items:center;
  padding:0px 10px;
  background: rgba(42, 45, 68, 0.6);
  border: 1px solid #3d435e;
  border-radius: 4px;
  &--icon {
    margin-left:5px;
    cursor: pointer;
  }
}

</style>
