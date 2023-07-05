<template>
  <div class="type-badge">
    <div
      v-for="item in items"
      :key="item.packageTypeIdx"
      class="type-badge-item"
      :class="getType(item.packageTypeName)"
    >
      {{ item.packageTypeName | getFirst }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Array,
      required: true
    }
  },
  filters: {
    getFirst (value) {
      return value[0]
    }
  },
  methods: {
    getType (item) {
      switch (item) {
        case 'Plus':
          return 'plus'
        case 'Basic':
          return 'basic'
        case 'Standard':
          return 'standard'
        case 'Enterprise':
          return 'enterprise'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.type-badge {
  display: flex;
  justify-content: center;

  & > * + * {
    margin-left: 8px;
  }

  &-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 6px 10px;

    color: $white;

    width: 36px;
    height: 25px;

    box-sizing: border-box;
    border-radius: 50px;

    &.plus {
      background: rgba(25, 119, 210, 0.2);
      border: 1px solid $sea-blue;
    }

    &.basic {
      background: rgba(244, 164, 98, 0.2);
      border: 1px solid $yellow;
    }

    &.standard {
      background: rgba(250, 86, 87, 0.2);
      border: 1px solid $main-red;
    }

    &.enterprise {
      background: rgba(89, 165, 29, 0.2);
      border: 1px solid #59A51D;
    }
  }
}
</style>
