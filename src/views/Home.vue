<!--
  * 파일명 : Home.vue
  * 파일 기능 :
  * 작성자 : 이성수 외 1명
  * 최종 작성일 : 2020-09-24
  * License By Shinsegae I&C
  * 2020-09-24 인터셉터 추가 (토큰 헤더 추가)
 -->

<template>
  <div class="home">
    <img
      alt="Vue logo"
      src="../assets/logo.png"
    >
    <HelloWorld msg="Welcome to Your Vue.js App" />
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Home',
  components: {
    HelloWorld
  }
}
</script>
