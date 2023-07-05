<template>
  <div class="page-layout">
    <div class="page-layout-filter">
      <slot name="filter" />
    </div>
    <div class="page-layout-grid">
      <slot />
    </div>
    <div class="page-layout-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimplePageLayout'
}
</script>

<style lang="scss" scoped>
.page-layout {
  &-filter {
    display: flex;
    align-items: center;
  }
}
</style>
