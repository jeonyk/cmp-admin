<template>
  <div
    class="external-badge"
    :class="type"
  >
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      required: false,
      default: 'normal',
      validator (value) {
        return ['normal', 'usage']
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.external-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 10px;

  &.normal {
    padding: $gap;
    background-color: $dark-slate;
  }

  &.usage {
    border-radius: 50px 10px 10px 50px;
    background-color: $white;
    color: #666666;
  }
}
</style>
