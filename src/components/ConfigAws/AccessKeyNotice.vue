<template>
  <section>
    <ul class="notice-list">
      <li
        v-for="data in dataList"
        :key="data"
      >
        {{ data }}
      </li>
    </ul>
  </section>
</template>

<script>
export default {
  props: {
    dataList: {
      type: Array,
      default: () => {}
    }
  }
}
</script>

<style lang="scss" scoped>
.notice-list {
  li {
    color: #727797;
    &:not(:last-child) {
      margin-bottom: 10px;
    }
  }
}
</style>
