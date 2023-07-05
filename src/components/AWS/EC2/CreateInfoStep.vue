<template>
  <div
    class="create-info-step"
    :class="[active ? 'active' : 'inactive', completed && 'completed']"
  >
    <div
      class="step-index"
      :class="[clickable && 'clickable']"
      @click="walkStep"
    >
      {{ index }}
    </div>
    <div
      class="step-title"
      :class="[clickable && 'clickable']"
      @click="walkStep"
    >
      <strong>{{ header }}</strong>
    </div>
    <div
      v-if="expandable"
      class="step-expand"
    >
      <i
        class="mdi step-expand-icon"
        :class="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        @click="$emit('expand', expanded)"
      />
    </div>
    <div
      v-show="expanded"
      class="step-body"
    >
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    active: {
      type: Boolean,
      required: true
    },
    header: {
      type: String,
      required: true
    },
    expandable: {
      type: Boolean,
      default: false
    },
    expanded: {
      type: Boolean,
      default: false
    },
    index: {
      type: Number,
      required: true
    },
    clickable: {
      type: Boolean,
      default: false
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    walkStep () {
      if (!this.clickable) return
      this.$emit('walk-step', this.index)
    }
  }
}
</script>

<style lang="scss" scoped>
$symbol-size: 30px;

.create-info-step {
  border-radius: 6px;
  box-shadow: 4px 4px 15px rgba(0, 0, 0, 0.1);
  border: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px 25px;
  height: auto;
  background-color: #1E2137;
  z-index: 1;
  position: relative;

  .clickable {
    cursor: pointer;
  }

  .step-title {
    color: $input-placeholder;
    padding-left: $gap-s + $symbol-size;
  }

  .step-index {
    width: $symbol-size;
    height: $symbol-size;
    border-radius: 9999px;
    box-shadow: 3px 3px 10px rgba(0, 0, 0, 0.2);
    background-color: #292D46;
    color: $input-placeholder;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: -10px;
    left: 25px;
  }

  .step-expand {
    margin-left: auto;

    &-icon {
      cursor: pointer;
      color: #222;
    }
  }

  .step-body {
    width: 100%;
    padding: 10px 0;
    border-top: 1px solid $light-stroke;
    margin-top: 15px;
  }

  &.active {
    border: 0.5px solid $primary;
  }

  &.active,
  &.completed {
    background-color: $white;

    .step-index {
      color: $white;
      background-color: $primary;
      box-shadow: 3px 3px 10px rgba(217, 82, 82, 0.2);
    }

    .step-title {
      color: $primary;
    }
  }
}
</style>
