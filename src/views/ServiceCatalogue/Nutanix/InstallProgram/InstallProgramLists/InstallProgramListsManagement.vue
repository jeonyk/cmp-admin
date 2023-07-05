<!--

  * 파일명 : InstallProgramLists.vue
  * 파일 기능 : 서비스 카탈로그 > 설치프로그램 정보 리스트, 설치프로그램 추가/수정/삭제 기능, 필터링(OS / 사용 여부)
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <div class="install-program-management">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'InstallProgramManagement'
}
</script>
