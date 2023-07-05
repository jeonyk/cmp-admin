<!--
  * 파일명 : ViewCnt.vue
  * 파일 기능 : 자원의 갯수를 표기하는 컴포넌트 (빨간 원 내부 count)
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 자원이관 수정중
 -->

<template>
  <div class="view-cnt">
    <span
      v-if="prefixText"
      class="view-cnt-prefix"
    >{{ prefixText }}</span>
    <span
      class="counter"
      :class="{'-small': prefixText}"
    >
      {{ count }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'ViewCnt',
  props: {
    count: {
      type: Number,
      default: 0
    },
    prefixText: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .view-cnt {
    display: flex;
    align-items: center;
    &-prefix {
      font-size: 14px;
      margin-right: 6px;
    }
    .counter {
      color: $white;
      display: block;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: $main-red;
      text-align: center;
      line-height: 20px;
      color: $white;
      &.-small {
        width: 17px;
        height: 17px;
        line-height: 17px;
        font-size: 12px;
      }
    }
  }
</style>
