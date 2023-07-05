<template>
  <div class="selectable">
    <div
      v-for="(item, index) in data"
      :key="`selectable-${index}`"
      class="selectable-item"
      :class="{ selected: item.selected, disabled: item.disabled }"
      @click="onSelectItem(item, index)"
    >
      {{ item.content }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectableList',
  props: {
    /**
     * [{ content: '123', selected: false }, { content: '125', selected: true }]
     */
    data: {
      type: Array,
      required: true
    }
  },
  methods: {
    onSelectItem (item, index) {
      this.$emit('selected', item, index)
    }
  }
}
</script>

<style lang="scss" scoped>
.selectable {
  display: flex;
  flex-wrap: wrap;

  &-item {
    cursor: pointer;
    border: 1px solid #3D435E;
    padding: 10px 10px;
    min-width: 180px;
    text-align: center;
    border-radius: 3px;
    box-sizing: border-box;
    transition: all 300ms;

    &:not(.disabled) {
      &.selected,
      &:hover {
        box-shadow: 4px 4px 20px rgba(11, 1, 1, 0.1);
        color: $primary;
      }
    }

    &.disabled {
      border-color: transparent;
      background-color: #f3f3f3;
      cursor: not-allowed;
      color: #999;
    }
  }

  &::before {
    content: " ";
    display: block;
    width: 100%;
    height: 1px;
    background-color: #3D435E;
    margin: 15px 0 12px 0;
  }

  > * + * {
    margin-left: $gap-s;
  }
}
</style>
