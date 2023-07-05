<template>
  <ul class="target-group-state-list">
    <li
      v-for="(value, name) in targetGroupStateCount"
      :key="name"
    >
      <span
        class="state-title"
        :class="name"
      >{{ {
        total: $v('대상개수'),
        healthy: $v('정상'),
        unhealthy: $v('이슈'),
        unused: $v('미사용'),
        initial: $v('초기화'),
        draining: $v('해제 중')}[name] }}</span>
      <span class="state-value">{{ value }}</span>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'TargetGroupStatePanel',
  props: {
    registerTarget: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    registerTarget: {
      immediate: true,
      handler () {
        this.targetGroupStateCount.total = this.registerTarget.length

        this.registerTarget.forEach(target => {
          if (target.state) this.targetGroupStateCount[target.state] += 1
        })
      }
    }
  },
  data: () => ({
    targetGroupStateCount: {
      total: 0,
      healthy: 0,
      unhealthy: 0,
      unused: 0,
      initial: 0,
      draining: 0
    }
  })
}
</script>

<style lang="scss" scoped>
  .target-group-state-list {
    display: flex;
    justify-content: center;
    padding: 15px 0;

    > li {
      display: flex;
      gap: 15px;
      padding: 0 50px;
      line-height: 20px;
      & + li {
        border-left: 2px solid $border2A;
      }
    }
    .state-title {
      text-transform: capitalize;
      &.healthy { color: $sea-blue; }
      &.unhealthy { color: $main-red; }
    }
  }
</style>
