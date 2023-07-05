<!--
  * 파일명 : BillingModelDist.vue
  * 파일 기능 : [빌링 > 배부모델] 모든 페이지를 포괄하는 컴포넌트입니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-12-30
  * License By Shinsegae I&C
  * 2020-12-30 fix: [빌링 > 모델]  사이드네비 선택 안되는 버그 수정
 -->

<template>
  <div class="billing-model-dist">
    <router-view />
  </div>
</template>
<script>
export default {
  name: 'BillingModelDistOld',
  data () {
    return {

    }
  }
}
</script>
