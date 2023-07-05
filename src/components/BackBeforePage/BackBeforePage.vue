<!--
  * 파일명 : BackBeforePage.vue
  * 파일 기능 : 뒤로가기 버튼
  * 작성자 : 김예담
  * 최종 작성일 : 2021-10-27
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="flex-wrap back-before-page"
    @click="$router.go(-1)"
  >
    <i class="custom-arrow" />
    <!-- 뒤로가기 -->
    <span>{{ $t('common.BTN.goToBeforePage') }}</span>
  </div>
</template>

<script>
export default {
  name: 'BackBeforePage'
}
</script>

<style lang="scss" scoped>
  .back-before-page {
    position: relative;
    cursor: pointer;
    .custom-arrow {
      position: absolute;
      display: inline-block;
      top: 1px;
      left: 3px;
      width: 10px;
      height: 10px;
      border-top: 1px solid $slate;
      border-left: 1px solid $slate;
      transform: rotate(-45deg);
    }
    > span { padding-left: $gap; color: $text-lighter-gray; }
    &:hover {
      * { color: $primary; border-color: $primary; }
    }
  }
</style>
