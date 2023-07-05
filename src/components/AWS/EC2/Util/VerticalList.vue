<template>
  <ul class="vertical-list">
    <li
      v-for="item in data"
      :key="item.name"
    >
      <span class="vertical-list-name">{{ item.name }}</span>
      <span class="vertical-list-value">{{ item.value }}</span>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'VerticalList',
  props: {
    /**
     * [{ name: '', value: '' }]
     * name: 표시할 이름 (좌)
     * value: 값 (우)
     */
    data: {
      type: Array,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>
.vertical-list {
  display: block;

  li {
    display: inline-block;
    vertical-align: middle;
  }

  li:not(:last-of-type) {
    &::after {
      content: '';
      width: 2px;
      height: 13px;
      background-color: #e0e0e0;
      display: inline-block;
      vertical-align: middle;
      margin: 0 $gap-s;
    }
  }

  &-name {
    margin-right: $gap-s;
    color: $text-lighter-gray;
  }

  &-value {
    font-weight: bold;
  }
}
</style>
