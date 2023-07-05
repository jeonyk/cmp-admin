<!--
  * 파일명 : TotalCount.vue
  * 파일 기능 : 리스트의 총 갯수를 보여줍니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-08-21
  * License By Shinsegae I&C
  * 2020-08-21 fix: [할 일, 한 일]-티켓으로 보기 - 스타일 수정
 -->

<template>
  <div class="total-count">
    <span v-html="$t('common.GRID.total', { n: Number(totalCount).toLocaleString() })" />
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    totalCount: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style lang="scss" scoped>
.total-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $gap 0;
  color: #ddd;
  font-size: 12px;
  font-weight: 400;
  // margin-bottom: 50px;
}
</style>
