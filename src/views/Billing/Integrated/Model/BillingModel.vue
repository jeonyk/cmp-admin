<!--
  * 파일명 : BillingModel.vue
  * 파일 기능 : [빌링 > 과금모델] 모든 페이지를 포괄하는 컴포넌트입니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2020-11-26
  * License By Shinsegae I&C
  * 2020-11-26 fix: 과금 모델 라우터 분리
 -->

<template>
  <div class="billing-model">
    <router-view />
  </div>
</template>
<script>

export default {
  name: 'BillingModel',
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
