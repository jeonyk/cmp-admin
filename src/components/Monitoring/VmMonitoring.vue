<template>
  <div class="monitor">
    <div class="monitor-inner">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'VmMonitoring',
  mounted () {
    this.setWrapperHeight()
  },
  beforeDestroy () {
    this.setWrapperHeight('100vh')
  },
  methods: {
    setWrapperHeight (height = 'auto') {
      const wrapperEl = document.querySelector(
        '.console-body > .body-contents'
      )

      if (wrapperEl) {
        wrapperEl.style.minHeight = height
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.monitor {
  width: 100%;
  box-sizing: border-box;
  padding-top: $gap;
}
</style>
