<template>
  <article class="alb-rule-detail-panel tiny-scroll">
    <h6
      class="tag"
      :class="type"
    >
      {{ type === 'condition' ? '조건' : '작업' }}
    </h6>

    <ul
      class="panel-contents"
      v-if="data"
    >
      <li
        class="panel-item flex-wrap"
        v-for="item in data"
        :key="item.label"
      >
        <strong>{{ item.label }}</strong>
        <span>{{ item.value }}</span>
      </li>
    </ul>
  </article>
</template>

<script>
export default {
  name: 'ALBRuleDetailPanel',
  props: {
    type: {
      type: String,
      default: 'condition',
      validator (value) {
        return ['condition', 'work'].includes(value)
      }
    },
    data: {
      type: Array,
      default: () => []
    }
  },
  data: () => ({

  })
}
</script>

<style lang="scss" scoped>
.alb-rule-detail-panel {
  padding: 12px 15px;
  background-color: $border2A;
  border-radius: $radius-m;
  height: 140px;
}

h6.tag {
  padding: 0 8px;
  display: inline-block;
  background-color: $primary;
  border-radius: 2px;
  border: 1px solid $primary;
  color: $white;
  font-size: 13px;
  font-weight: normal;
  line-height: 20px;
  &.work {
    color: $primary;
    background-color: transparent;
  }
}

.panel-contents {
  margin-top: 15px;
  .panel-item {
    & + .panel-item { margin-top: 5px; }
  }
}
</style>
