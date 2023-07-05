<!--
  * 파일명 : MemoView.vue
  * 파일 기능 :
  * 작성자 : 김예담
  * 최종 작성일 : 2020-07-28
  * License By Shinsegae I&C
  * 2020-07-28 fix: 미터링 > 삭제 리스트 완료
 -->

<template>
  <div class="memo-view">
    <i class="mdi mdi-message-outline -memo-icon" />
    <span class="memo-count-circle">
      <slot />
    </span>
  </div>
</template>
<script>
export default {
  name: 'MemoView',
  props: {

  }
}
</script>
<style lang="scss" scoped>
  .memo-view {
    position: relative;
    margin: auto;
    width: 100%;
    height: auto;
    .-memo-icon {
      position: absolute;
      top: 50%;
      right: 50%;
      width: 20px;
      transform: translate(25%, -40%);
    }
    .memo-count-circle {
      position: absolute;
      top: 50%;
      right: 50%;
      width: 18px;
      height: 18px;
      transform: translate(80%, -80%);
      background-color: $main-red;
      border-radius: 50%;

      font-size: 11px;
      color: $white;
      line-height: 17px;
      text-align: center;
    }
  }
</style>
