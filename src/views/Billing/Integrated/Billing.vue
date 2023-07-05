<!--
  * 파일명 : Billing.vue
  * 파일 기능 : [빌링] 모든 페이지를 포괄하는 컴포넌트입니다.
  * 작성자 : 김예담
  * 최종 작성일 : 2020-08-27
  * License By Shinsegae I&C
  * 2020-08-27 add: [빌링 - 과금배치]
 -->

<template>
  <div class="admin-billing">
    <router-view />
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  name: 'Billing',
  methods: {
    ...mapMutations({
      setIsRenderCloudSwitch: 'cloud/SET_IS_RENDER_CLOUD_SWITCH'
    }),
    routeTo (to) {
      this.$router.push(to)
    }
  },
  mounted () {
    this.setIsRenderCloudSwitch(false)
  },
  beforeDestroy () {
    this.setIsRenderCloudSwitch(true)
  },
  data () {
    return {
    }
  }
}
</script>
<style lang="scss" scoped>
  .admin-billing {height: 100%;}
</style>
