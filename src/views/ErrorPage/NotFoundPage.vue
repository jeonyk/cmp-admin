<!--
  * 파일명 : NotFoundPage.vue
  * 파일 기능 :
  * 작성자 : 정재은
  * 최종 작성일 : 2021-02-08
  * License By Shinsegae I&C
  * 2021-02-08 Update: 접근불가능 페이지 입력 및 업무페이지 처리
 -->

<template>
  <div class="not-found-page">
    <h5>{{ message.code }} {{ message.error }}</h5>
    <h4>{{ message.message }}</h4>
    <p>{{ $t('common.PLACEHOLDER.tryAgain') }}</p>

    <div class="button-area">
      <button
        class="button"
        type="is-primary"
        size="is-large"
        @click="$router.push(routeName)"
      >
        {{ routeName.text }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundPage',
  created () {
    const isMain = this.$route.matched.some(match => match.path.includes('main'))
    if (isMain) this.routeName = { name: 'main', text: this.$t('common.moveDashboard') }
    else this.routeName = { name: 'dashboard-v3', text: this.$t('common.moveDashboard') }

    if (this.$route.params) {
      const code = this.$route.params.code ? this.$route.params.code : this.$route.params.pathMatch
      const message = this.requestType[code] ? this.requestType[code] : this.requestType[404]

      this.message = message
    } else this.message = this.requestType[404]
    // + 뒤로가기 클릭하면 대시보드로 이동 기능 추가
  },
  data () {
    return {
      message: undefined,
      routeName: undefined,
      requestType: {
        404: { error: 'Page Not Found', code: 404, message: this.$t('common.ALERT.BASE.064') },
        400: { error: 'Bad Request Error', code: 400, message: this.$t('common.ALERT.BASE.065') },
        500: { error: 'Internal Server Error', code: 500, message: this.$t('common.ALERT.BASE.066') }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.not-found-page {
  display: grid;
  place-content: center;
  height: 100vh;

  > * {
    text-align: center;
  }
  > h5 {
    font-size: 4em;
    margin-bottom: $gap;
    position: relative;
    display: block;
    z-index: 1;
    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: $gap-s;
      background: $sea-blue;
      z-index: -1;
      opacity: .3;
      bottom: $gap-s;
      left: 0;
    }
  }
  > h4 {
    font-size: 2.5em;
    margin-bottom: $gap-s;
    // color: $normal-gray
  }
  > p {
    color: $text-gray;
    font-size: 1.5em;
    margin-bottom: $gap-m;
  }

  .button-area {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
