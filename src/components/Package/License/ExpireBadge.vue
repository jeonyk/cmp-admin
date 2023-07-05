<template>
  <div class="expire-badge">
    {{ $t('license.PLACEHOLDER.expired') }}
  </div>
</template>

<script>
export default {
  name: 'ExpireBadge'
}
</script>

<style lang="scss" scoped>
.expire-badge {
  position: fixed;
  top: 90px;
  right: 15px;
  z-index: 2000;
  background: rgba(240, 240, 240, 0.9);
  color: blue;
  font-size: 14pt;
  text-decoration: underline;
  padding: 8px 12px;
  box-sizing: border-box;
  opacity: 0.8;
  font-weight: bold;
  pointer-events: none;
}
</style>
