<template>
  <div class="double-arrow">
    <i class="mdi mdi-chevron-double-right" />
  </div>
</template>

<script>
export default {
  name: 'DoubleRightArrow'
}
</script>

<style lang="scss" scoped>
.double-arrow {
  margin: 0 20px;
  color: $input-placeholder;

  .mdi::before {
    font-size: 40px;
    font-weight: 100;
  }
}
</style>
