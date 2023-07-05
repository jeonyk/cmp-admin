<!--
  * 파일명 : SetConfigure.vue
  * 파일 기능 : 어드민 관리 환경설정 Wrapper
  * 작성자 : 김예담
  * 최종 작성일 : 2020-08-12
  * License By Shinsegae I&C
  * 2020-08-12 add: [환경설정 > 프로젝트] , [환경설정 > nutanix 관리]
 -->

<template>
  <div class="set-configure">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'SetConfigure',
  methods: {
    routeTo (to) {
      this.$router.push(to)
    }
  },
  data () {
    return {
    }
  }
}
</script>
