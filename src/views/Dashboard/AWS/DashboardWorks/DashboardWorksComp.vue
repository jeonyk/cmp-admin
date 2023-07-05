<template>
  <div class="dashboard-works-comp-wrapper">
    <strong class="title">{{ title }}</strong>

    <div class="body">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardWorksComp',
  props: {
    title: {
      type: String,
      default: undefined
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-works-comp-wrapper {
  border-radius: 6px;
  background: #070A20;
  height: 495px;
  box-sizing: border-box;

  .title {
    box-sizing: border-box;
    border-bottom: 1px solid #2A2D44;
    display: block;
    height: 50px;
    padding: $gap;
  }

  .body {
    height: calc(100% - 50px);
    padding: $gap-s $gap;
    box-sizing: border-box;
  }
}
</style>
