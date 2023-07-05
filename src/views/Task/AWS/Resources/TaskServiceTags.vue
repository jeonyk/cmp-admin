<template>
  <div class="instance-tags">
    <el-tag
      :class="[
        'name-tag',
        { 'is-selected': idx === selectedIdx },
        { 'is-canceled': getCanceledStates(tag.workItemState) },
      ]"
      v-for="(tag, idx) in data"
      :key="tag.label"
      @click="clickTagName(idx)"
    >
      {{ getTagText(tag) }}
    </el-tag>
  </div>
</template>

<script>
export default {
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getTagText (tag) {
      const { label, workItemState } = tag
      const former =
        {
          CANCELLING: '[주문취소] ',
          CANCELED_AT_REVIEW: '[주문취소] ',
          CANCELED_AT_TODO: '[주문취소] '
        }[workItemState] ?? ''
      return former + label + ' ' + workItemState
    },
    getCanceledStates (state) {
      if (['CANCELED_AT_REVIEW', 'CANCELED_AT_TODO', 'CANCELLING'].includes(state)) return true
      return false
    },
    clickTagName (idx) {
      this.selectedIdx = idx
      this.$emit('click', idx)
    }
  },
  data () {
    return {
      selectedIdx: 0
    }
  }
}
</script>

<style lang="scss" scoped>
.instance-tags {
  width: 80%;
}
.name-tag {
  cursor: pointer;
  &.is-selected {
    background: #3e57c9;
  }
  &.is-selected.is-canceled {
    background: #CF484D;
    color:#fff;
  }

  &.is-canceled {
    background: #4B2C2C;
    color:#876262;
  }
}
</style>
