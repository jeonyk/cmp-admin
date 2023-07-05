<template>
  <div
    class="dropdown"
    :class="{ absolute }"
  >
    <div
      class="dropdown-toggle"
      @click="toggledDropdown = !toggledDropdown"
    >
      <span class="info">
        <slot name="title" />
      </span>
      <span class="toggle">
        <i
          class="mdi"
          :class="toggledDropdown ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        />
      </span>
    </div>
    <div
      v-show="toggledDropdown"
      class="dropdown-body"
    >
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SimpleDropdown',
  props: {
    absolute: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    toggledDropdown: false
  })
}
</script>

<style lang="scss" scoped>
.dropdown {
  padding: 15px 20px;
  box-sizing: border-box;
  border: 1px solid #caced0;
  border-radius: 6px;
  position: relative;
  z-index: 1;

  &.absolute {
    .dropdown-body {
      cursor: default;

      position: absolute;
      top: 40px;
      left: -1px;
      border: 1px solid #caced0;
      background-color: $white;
      cursor: default;
      width: 100%;
      border-radius: 6px;
      border-top: none;
      padding-bottom: 15px;
      z-index: 2;

      &:not(.absolute) {
        margin: 0;
      }
    }
  }

  &-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    height: 100%;
  }
}
</style>
