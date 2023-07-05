<!--
  * 파일명 : SetRole.vue
  * 파일 기능 : 역할 관리 Wrapper
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-08-20
  * License By Shinsegae I&C
  * 2020-08-20 fix: [역할관리] - 목록, 상세페이지 분리, 목록 상단 필터링 영역 추가
 -->

<template>
  <div class="set-role">
    <router-view />
  </div>
</template>
<script>

export default {
  name: 'SetRole',

  data () {
    return {
    }
  }
}
</script>
