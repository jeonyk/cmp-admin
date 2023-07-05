<template>
  <div
    class="alb-rule-item"
    :class="{'-active': isActive}"
    @click="clickPanel"
  >
    <div class="flex-wrap title-area">
      <span>{{ name }}</span>
      <p class="flex-wrap title-right">
        <span>규칙 수 : {{ ruleCount }}</span>
        <span>마지막 변경 시간 : {{ updateDate }}</span>
      </p>
    </div>

    <pre>{{ desc }}</pre>
  </div>
</template>

<script>
export default {
  name: 'ALBRuleItem',
  props: {
    name: {
      type: String,
      default: 'ALB 규칙_1'
    },
    ruleCount: {
      type: Number,
      default: 1
    },
    updateDate: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    isActive: false
  }),
  watch: {
    active (newVal) {
      this.isActive = newVal
    }
  },
  methods: {
    clickPanel () {
      this.$emit('click')
    }
  }
}
</script>

<style lang="scss" scoped>
.alb-rule-item {
  padding: $gap;
  width: 100%;
  background-color: $dark-navy;
  border-radius: $radius;
  cursor: pointer;
  transition: background-color .3s;
  * { transition: all .2s; }

  & + .alb-rule-item { margin-top: $gap-s; }

  .title-area {
    justify-content: space-between;
    .title-right {
      span + span { margin-left: 8px; padding-left: 8px; border-left: 1px solid #999; }
    }
  }

  > pre {
    margin-top: 15px;
    padding: $gap-s;
    border: 1px solid $input-stroke;
    border-radius: 2px;
    min-height: 70px;
  }

  &.-active {
    color: $text-black;
    background-color: $white;
    > pre {
      border: 1px solid transparent;
      background-color: #F6F6F6;
    }
  }
}
</style>
