<!--
  * 파일명 : TableMoreButton.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-08-12
  * License By Shinsegae I&C
  * 2020-08-12 fix: 기존 button [type="is-black"] -> [type="is-primary"] 로 변경
 -->

<template>
  <button
    class="more-table-data"
    @click="$emit('click')"
    type="is-primary"
    size="is-large"
  >
    <span class="more-data-text">
      <b>더보기</b>
    </span>
    <span class="more-data-count">
      (<b>{{ tableDataLen }} </b>/
      {{ totalDataLen }})
      <i class="mdi mdi-plus" />
    </span>
  </button>
</template>

<script>
export default {
  props: {
    // 현재 보여지는 데이터의 개수
    tableDataLen: {
      type: Number,
      default: 0
    },
    // 전체 데이터의 총 개수
    totalDataLen: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
