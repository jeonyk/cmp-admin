<template>
  <section class="cmp-alert-section">
    <div class="is-plus">
      CMP 는 PLUS 버전에선 제공되지 않습니다.
    </div>
  </section>
</template>

<script>
export default {
  name: 'CMPAlerts'
}
</script>

<style lang="scss" scoped>
.cmp-alert-section {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  .is-plus {
    color: $color-middlegrey;;
  }
}
</style>
