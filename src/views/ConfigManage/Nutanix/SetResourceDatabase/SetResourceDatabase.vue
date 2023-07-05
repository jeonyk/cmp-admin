<!--
  * 파일명 : SetResourceDatabase.vue
  * 파일 기능 : 구성관리 > 자원관리 > Database Wrapper
  * 작성자 : 김예담
  * 최종 작성일 : 2020-10-13
  * License By Shinsegae I&C
  * 2020-10-13 fix: [구성관리] 구조 변경
 -->

<template>
  <div class="set-resource-database">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'SetResourceDatabase'
}
</script>
<style lang="scss">
  .set-resource-database {
    .service-date-pick.el-date-editor {
      width: 120px;
      &.el-input {
        .el-input__inner {
          border: none;
        }
        .el-input__prefix {
          > .el-input__icon.el-icon-date::before {
            margin-top: 2px;
            margin-left: -5px;
            width: 17px;
            height: 20px;
          }
        }
      }
    }
    .service-time-select {
      margin-left: $gap;
      width: 65px;
    }
  }
</style>
