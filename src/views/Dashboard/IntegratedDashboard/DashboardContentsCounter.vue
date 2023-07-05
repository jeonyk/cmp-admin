<template>
  <div class="dashboard-contents-counter">
    <h4>
      <i :class="['icon', type]" />
      {{ title }}
    </h4>

    <div
      class="dashboard-contents-counter-wrapper"
      v-loading="isLoading"
    >
      <dl
        v-for="{ label, value } in items"
        :key="label"
      >
        <dt>{{ label }}</dt>
        <dd>{{ value }}</dd>
      </dl>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardContentsCounter',
  props: {
    type: {
      type: String,
      default: 'project',
      validator (value) {
        return ['project', 'compute'].includes(value)
      }
    },
    data: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    title () {
      return { project: '프로젝트 수', compute: 'Compute' }[this.type]
    },
    items () {
      let labels = []
      if (this.type === 'project') labels = [this.$v('전체'), this.$v('일반'), this.$v('공통')]
      if (this.type === 'compute') labels = [this.$v('전체'), this.$v('ON'), this.$v('OFF')]
      return this.data.map((value, idx) => ({ label: labels[idx], value }))
    }
  },
  data: () => ({
  })
}
</script>

<style lang="scss" scoped>
.dashboard-contents-counter {
  border: 1px solid $purple-gray;
  height: 150px;
  padding: $gap;
  box-sizing: border-box;
  background-color: transparent;
  border-radius: 5px;

  h4 {
    font-size: 16px;
    margin-bottom: $gap-m;
    display: flex;
    align-items: center;
    line-height: 15px;

    .icon {
      display: inline-block;
      width: 17px; height: 15px;
      margin-right: 5px;
      background-size: contain;

      &.project { background: url('../../../assets/images/integrated-dashboard/folder.svg') no-repeat; }
      &.compute { background: url('../../../assets/images/integrated-dashboard/database.svg') no-repeat; }
    }
  }

  &-wrapper {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    text-align: center;

    dt {
      font-size: 14px;
      color: $white;
      margin-bottom: 5px;
    }

    dd {
      font-size: 32px;
      color: $white;
      font-weight: 700;
    }

    dl:first-child dd { color: $main-red }
  }
}
</style>
