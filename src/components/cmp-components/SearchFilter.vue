<!--
  * 파일명 : SearchFilter.vue
  * 파일 기능 :
  * 작성자 : 정재은
  * 최종 작성일 : 2020-07-17
  * License By Shinsegae I&C
  * 2020-07-17 add: 마켓플레이스 컨텐츠 사용자 => 관리자로 복사
 -->

<template>
  <div class="filter-wrap">
    <slot name="leftCont" />
    <slot name="rightCont" />
  </div>
</template>

<script>

export default {
  components: {
  },
  methods: {
  },
  data () {
    return {
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-wrap {
  width: 100%;
  display: flex;
  font-size: 16px;
  margin-bottom: $gap;
  padding: $gap + 10px 0;
  // border-bottom: 1px solid #ededed;
}
</style>
