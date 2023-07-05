<template>
  <div class="resource-operation-title">
    <span class="resource-title">
      <slot />
    </span>
    <span
      class="resource-count"
      v-if="count !== undefined"
    >
      ({{ $t('main.DASHBOARD.all') }}: {{ count | locale }}&nbsp;EA)
    </span>
  </div>
</template>

<script>
export default {
  name: 'ResourceTitle',
  props: {
    count: {
      type: Number,
      default: undefined
    }
  }
}
</script>

<style lang="scss" scoped>
  .resource-operation-title {
    display: flex;
    align-items: center;
    gap: $gap-s;
    margin-bottom: $gap;
    .resource-title {
      font-size: 14px;
    }
    .resource-count {
      color: $input-placeholder
    }
  }
</style>
