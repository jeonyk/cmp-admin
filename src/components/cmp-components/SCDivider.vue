<!--
  * 파일명 : SCDivider.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-09-17
  * License By Shinsegae I&C
  * 2020-09-17 fix: 마켓플레이스 스타일 변경
 -->

<template>
  <article class="create-info-wrap">
    <h5 class="product-title">
      {{ artiTit }}
    </h5>
    <div class="article">
      <slot />
    </div>
  </article>
</template>

<script>
export default {
  props: {
    artiTit: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.create-info-wrap {
  margin-bottom: $gap + 30px;
  display: flex;
  flex-direction: column;

  // > h5 {
  //   display: block;
  //   padding-bottom: 30px;
  //   font-size: 20px;
  //   font-weight: bold;
  // }

  .article {
    position: relative;
  }
}
</style>
