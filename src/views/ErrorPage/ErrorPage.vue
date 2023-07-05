<!--
  * 파일명 : ErrorPage.vue
  * 파일 기능 :
  * 작성자 : 전경열
  * 최종 작성일 : 2020-11-05
  * License By Shinsegae I&C
  * 2020-11-05 운영관리자 페이지 권한 추가
 -->

<template>
  <div class="error-page">
    <div class="error-message-wrap">
      <!-- <b-icon
        icon="alert-circle-outline"
        size="is-large"
      /> -->
      <div class="error-page-message">
        <p class="error-message-title">
          {{ message }}
        </p>
        <p class="error-message-desc">
          {{ $t('common.PLACEHOLDER.contactManager') }}
        </p>
      </div>
    </div>
    <!-- icon-left="home-import-outline" -->
    <button
      v-if="canGoDshbrd"
      type="is-primary"
      size="is-large"
      class="button button-go-gome"
      @click="goHome"
    >
      {{ $t('main.LAYOUT.goToMain') }}
    </button>
    <button
      v-else
      type="is-primary"
      size="is-large"
      class="button button-go-gome"
      @click="logout"
    >
      {{ $t('main.LAYOUT.logout') }}
    </button>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'NoContent',
  created () {
    if (this.$route.params && this.$route.params.message) {
      this.message = this.$route.params.message
    }
  },
  computed: {
    ...mapState({
      perm: state => state.auth.perm,
      user: state => state.auth.user
    }),
    canGoDshbrd () {
      if (this.perm?.userPermLevel !== 0) {
        // 운영관리자는 역할에 따라 접근 권한이 있는 메뉴가 있으면
        // '메인으로 이동' 버튼이 활성화 됨.
        return this.perm?.menu?.length > 0 && !this.user?.isFirstLogin
      } else {
        // 최고관리자
        return true
      }
    }
  },
  methods: {
    /**
     * '메인페이지로 이동' 버튼 클릭 시 실행.
     * 운영관리자는 역할에 따라 접근 권한이 있는 메뉴의 제일 첫번째로 이동.
     */
    goHome () {
      if (this.perm.userPermLevel !== 0) {
        this.$router.push({ name: this.perm.menu[0] })
      } else {
        window.location.assign(window.location.origin)
      }
    },
    logout () {
      this.$store.dispatch('logout')
    }
  },
  data () {
    return {
      message: this.$t('common.ALERT.BASE.063')
    }
  }
}
</script>

<style lang="scss" scoped>
  .error-page {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: block;
    padding: $gap;
    margin: auto;
    text-align: center;
    > .error-message-wrap {
      display: flex;
      align-items: flex-start;
      opacity: .9;
      .icon {
        margin-top: 12px;
        // color: $c-text-disabled;
      }
      .error-page-message {
        margin-left: $gap;
        font-weight: bold;
        // color: $c-text-disabled;
        > .error-message-title {
          font-size: 4em;
          font-weight: bold;
          text-align: center;
          position: relative;
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
        > .error-message-desc {
          font-size: 2.5em;
          text-align: center;
          opacity: .7;
          margin-top: 30px;
        }
      }
    }
    .button-go-gome {
      margin: $gap * 3 auto 0;
    }
  }
</style>
