
<!--
  * 파일명 : Admin.vue
  * 파일 기능 : [어드민 관리]의 모든 하위 페이지를 담당합니다.
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-08-03
  * License By Shinsegae I&C
  * 2020-08-03 fix: router 정리 진행중
 -->

<template>
  <div class="admin-page">
    <router-view />
  </div>
</template>
<script>
import { mapState } from 'vuex'
export default {
  name: 'Admin',
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
    if (this.user.userPermLevel > 0) return this.$router.replace({ name: 'not-found-status', params: { code: 400 } })
  },
  methods: {

  },
  data () {
    return {
    }
  }
}
</script>
