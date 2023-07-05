<!--
  * 파일명 : Metering.vue
  * 파일 기능 : [미터링] 모든 페이지를 포괄하는 컴포넌트입니다.
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-08-03
  * License By Shinsegae I&C
  * 2020-08-03 fix: router 정리 진행중
 -->

<template>
  <div class="admin-metering">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'Metering',
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
<style lang="scss" scoped>
  .admin-metering {height: 100%;}
</style>
