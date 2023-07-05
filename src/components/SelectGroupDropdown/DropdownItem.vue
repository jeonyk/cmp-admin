<template>
  <div
    v-if="isArrayItem"
    class="ti-dropdown-item-value"
  >
    <div
      v-for="g in item"
      :class="`ti-dropdown-item-value__${g.type}`"
      :key="g.value"
      @click="$emit('click', g)"
    >
      {{ g.name }}
    </div>
  </div>
  <div
    v-else
    class="ti-dropdown-item-value__item no-group"
    @click="$emit('click', item)"
  >
    {{ item.name }}
  </div>
</template>

<script>
export default {
  name: 'DropdownItem',
  props: {
    // 부모로부터 받은 아이템 객체
    item: {
      type: [Object, Array],
      required: true
    }
  },
  computed: {
    type () {
      return this.item.type
    },
    isArrayItem () {
      return Array.isArray(this.item)
    }
  }
}
</script>

<style lang="scss" scoped>
$--local-gray: #aaa;

.ti-dropdown-item-value {
  &__group {
    // color: $--local-gray;
    font-size: 14px;
    font-weight: bold;
    padding: 0 0 0 $gap;

    &:not(:first-of-type) {
      margin-top: $gap;
      padding-top: $gap;
      border-top: 1px solid #eee;
    }
  }

  &__item {
    padding: $gap-s 0;

    &:hover {
      cursor: pointer;
      background-color: rgb(244, 248, 251);
    }
  }

  &__group-desc {
    padding: 0 $gap $gap-s $gap;
    // color: $--local-gray;
    word-break: break-all;
  }
}
</style>
