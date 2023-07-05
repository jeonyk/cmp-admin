function getCookie (cname) {
  const name = cname + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

/**
 * 탭이 액티브될 때 이벤트 최상단 컴포넌트
 * (App.vue)에서 사용
 */
export default function onActiveTab () {
  document.addEventListener('visibilitychange', (evt) => {
    // 탭이 액티브된 상태라면
    if (document.visibilityState === 'visible') {
      // 비밀번호 초기화 페이지에선 예외처리 한다.
      if (this.$route.name === 'find-password') return
      // 쿠키에서 토큰을 가져온다
      const authorization = getCookie('Authorization')
      // 토큰이 없는 상태 (로그아웃 상태) 로그인 페이지로 이동시킨다
      if (!authorization) {
        return this.$router.push({ name: 'user-login' })
      } else {
        // 토큰이 있으면 토큰의 유저 아이디와
        // 스토어에 저장된 유저 아이디를 비교 후
        // 서로 다르면 페이지를 새로고친다
        const parsedToken = JSON.parse(window.atob(authorization.split('.')[1]))
        const user = this.$store.getters.user

        if (parsedToken && user) {
          if (parsedToken.aud !== user.userId) {
            window.location.reload()
          }
        }
      }
    }
  })
}
