<!--
  * 파일명 : CreateByCMPTag.vue
  * 작성자 : 김예담 외 2명
  * License By Shinsegae I&C
 -->
<template>
  <span class="created-by-cmp-tag">
    CMP
  </span>
</template>

<script>
export default {
  name: 'CreateByCMPTag'
}
</script>

<style lang="scss" scoped>
.created-by-cmp-tag {
  display: inline-block;
  padding: 0 3px;
  width: 32px;
  min-height: 16px;
  line-height: 16px;
  text-align: center;
  font-size: 11px;
  @include cmp-status-tag($info)
}
</style>
