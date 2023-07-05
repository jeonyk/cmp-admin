import Vue from 'vue'

export default Vue.extend({
  beforeRouteEnter (to, from, next) {
    next(vm => {
      // 현재 경로의 매칭된 라우트 전부 검색
      const accessible = [...new Set(to.matched.map(match => match.meta.accessible).filter(t => t).flat())]
      // 버전 별 접근 가능한 버전이 존재할 경우
      if (accessible.length) {
        // 접근 가능한 버전에 포함되지 않는 경우
        if (!accessible.includes(vm.$store.state.auth.packageType)) {
          vm.$router.replace({ name: 'not-found' })
        }
      }
    })
  }
})
