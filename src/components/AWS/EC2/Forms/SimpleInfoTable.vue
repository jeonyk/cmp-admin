<template>
  <div
    class="info-table"
    :class="{ 'flex-center': flexCenter }"
  >
    <div
      class="info-table-title"
      :class="titleClass"
      :style="titleWidthStyle"
      style="display:flex; gap:5px; align-items:center;"
    >
      {{ title }}
      <slot name="title-tooltip" />
    </div>
    <div
      v-if="!slotName"
      class="info-table-desc"
    >
      {{ desc }}
    </div>
    <div
      v-else
      class="info-table-desc"
    >
      <slot :name="slotName" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleInfoTable',
  props: {
    title: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: ''
    },
    width: {
      type: [Number, String],
      required: false,
      default: 90
    },
    slotName: {
      type: String,
      default: ''
    },
    titleClass: {
      type: String,
      default: ''
    },
    flexCenter: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    titleWidthStyle () {
      return `flex: 0 0 ${this.width}px`
    }
  }
}
</script>

<style lang="scss" scoped>
.info-table {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: nowrap;
  color: $text-lighter-gray;

  &.flex-center {
    align-items: center;
  }

  &-desc {
    flex: 1;
    white-space: pre-line;
  }
}
</style>
