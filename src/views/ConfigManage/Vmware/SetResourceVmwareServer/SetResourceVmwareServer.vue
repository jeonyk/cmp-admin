<!--
  * 파일명 : SetResourceServer.vue
  * 파일 기능 : 구성관리 > 자원관리 > Compute Wrapper
  * 작성자 : 박경화 외 2명
  * 최종 작성일 : 2020-10-14
  * License By Shinsegae I&C
  * 2020-10-14 Merge branch 'dev' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into feature/477-rscmanage-db
 -->

<template>
  <div class="set-resource-server">
    <router-view />
  </div>
</template>
<script>

export default {
  name: 'SetResourceServer'
}
</script>

<style lang="scss">
  .set-resource-server {
    .service-date-pick.el-date-editor {
      width: 150px;
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
