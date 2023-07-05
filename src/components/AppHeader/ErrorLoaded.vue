<template>
  <p
    class="error-happend"
    v-if="view"
  >
    <span v-html="$t('config.Alerts.refreshAlert')" />

    <button
      class="refresh"
      @click="$emit('refresh')"
    >
      <i class="mdi mdi-refresh" />
      {{ $t('config.Alerts.refresh') }}
      <!-- 새로고침 -->
    </button>
  </p>
</template>

<script>
export default {
  name: 'ErrorLoaded',
  props: {
    view: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style lang="scss" scoped>
.error-happend {
  position: absolute;
  top: 0; left: 0;
  bottom: 0; right: 0;
  color: $white;
  background: rgba(0, 0, 0, 0.6);
  z-index: 10;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  text-align: center;

  .refresh {
    i {
      font-size: 13px;
      transform: rotate(-90deg);
      display: block;
      margin-right: 5px;
      font-weight: 300;
    }
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $white;
    background: none;
    width: 130px;
    height: 42px;
    line-height: 40px;
    color: $white;
    border-radius: $radius-s;
    margin-top: $gap-m;
    cursor: pointer;
  }
}
</style>
