<!--
  * 파일명 : UserLogin.vue
  * 파일 기능 : 로그인 ui 페이지
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 add: 비밀번호 찾기 페이지 추가
 -->

<template>
  <div class="user-login">
    <section class="login-header -inner">
      <a class="flex-wrap logo-wrap">
        <i class="logo" />
        <p class="logo-title">
          <span style="font-size: 8px;">Brighten Tomorrow</span>
          <!-- <span>Spharos</span> -->
          <span>CMP</span>
        </p>
      </a>

      <el-select
        class="dropdown-language"
        :popper-append-to-body="true"
        popper-class="dropdown-popper"
        v-model="lang"
        :placeholder="$t('common.BTN.select')"
        @change="selectLanguage"
      >
        <el-option
          v-for="item in languageList"
          :key="item.field"
          :label="item.name"
          :value="item.field"
        />
      </el-select>
    </section>

    <section class="login-body -inner">
      <div class="image-area">
        <cloud-animate-contents style="overflow: hidden;" />
      </div>
      <!-- /.image-area -->
      <div class="form-area">
        <!-- /.form-area -->
        <h3 class="login-title -only-mobile-hide">
          Spharos CMP
        </h3>
        <h3 class="login-title -only-mobile">
          Spharos<br>CMP
        </h3>
        <ul class="login-info-list">
          <li class="login-item">
            <el-input
              class="login-input"
              :placeholder="$t('common.GRID.id')"
              @keydown.native.enter="login"
              v-model="id"
              @input="trimString('id', $event)"
            />
          </li>
          <li class="login-item -password">
            <el-input
              class="login-input -input-password"
              :placeholder="$t('common.GRID.pw')"
              @keydown.native.enter="login"
              v-model="password"
              show-password
              id="password"
              @input="trimString('password', $event)"
            />

            <span
              class="capslock-alert"
              v-if="capsOn"
              v-html="$t('main.LAYOUT.capsOn')"
            />
          </li>
        </ul>
        <!-- /.login-info-list -->
        <div class="login-service">
          <el-checkbox
            v-model="saveId"
            style="font-size: 14px;"
          >
            {{ $t('common.GRID.saveId') }}
          </el-checkbox>
        </div>
        <button
          class="button -login-button"
          type="is-primary"
          size="is-large"
          @click="login"
          :disabled="loadingLogin"
        >
          {{ $t('LOG_IN.BTN_01') }}
        </button>
        <div class="service">
          <b>{{ $t('main.LAYOUT.loginTerms') }}</b>
          <span
            class="item"
            @click="routeTo({ name: 'find-password' })"
          >
            {{ $t('common.BTN.initPw') }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import CloudAnimateContents from './CloudAnimateContents'
import VueCookies from 'vue-cookies'

export default {
  name: 'UserLogin',
  components: {
    'cloud-animate-contents': CloudAnimateContents
  },
  computed: {
    ...mapGetters(['authed', 'token', 'perm'])
  },
  created () {
    if (this.$route.params?.code) {
      this.$alert(this.errType[this.$route.params?.code] || this.errType.IAM003, '', {
        dangerouslyUseHTMLString: true
      }, () => false)
    }

    const id = localStorage.getItem('userLoginId')
    if (id && id !== '') {
      this.id = id
      this.saveId = true
    } else {
      this.saveId = false
    }
    this.langCheck()

    if (typeof window !== 'undefined') {
      document.addEventListener('keyup', this.checkCapsLock)
      document.addEventListener('click', this.checkCapsLock)
    }
  },
  beforeDestroy () {
    if (typeof window !== 'undefined') {
      document.removeEventListener('keyup', this.checkCapsLock)
      document.removeEventListener('click', this.checkCapsLock)
    }
  },
  methods: {
    trimString (type, e) {
      const trimmedString = e.replace(/ /g, '')
      if (type === 'id') {
        this.id = trimmedString
      }

      if (type === 'password') {
        this.password = trimmedString
      }
    },
    routeTo (to) {
      this.$router.push(to)
    },
    async login (e) {
      // 마구 누르기 방지
      if (this.loadingLogin) return

      this.loadingLogin = true
      e.preventDefault()
      e.stopPropagation()

      const payload = {
        userId: this.id,
        userPw: this.password,
        isAdmin: true
      }

      const res = await this.$store.dispatch('login', payload)
      if (res.code) {
        const message = this.errType[res.code]

        setTimeout(() => (this.loadingLogin = false), 50)

        if (message) return this.$alert(message, { dangerouslyUseHTMLString: true })
        // else return this.$alert(`로그인을 시도하던 도중<br>문제가 발생하였습니다.<br>다시 시도해주세요.<br> Code : ${res.code}`, { dangerouslyUseHTMLString: true })
        else return this.$alert(this.$t('common.ALERT.LOGIN.001', { code: res.code }), { dangerouslyUseHTMLString: true })
      }

      if (res.token) {
        // 로그인 처리
        if (this.saveId) localStorage.setItem('userLoginId', this.id)
        else localStorage.removeItem('userLoginId')

        if (!res.isUpdatePw && !res.isFirstLogin) await this.$store.dispatch('checkPackageType')

        if (res.isUpdatePw || res.isFirstLogin) {
          const message = res.isUpdatePw ? this.$t('common.ALERT.LOGIN.013') : this.$t('common.ALERT.LOGIN.014')
          this.$alert(message, {
            dangerouslyUseHTMLString: true,
            callback: () => {
              this.routeTo({
                name: 'change-password',
                params: { firstLogin: res.isFirstLogin }
              })
            }
          })
        } else {
          const routeTo = { name: this.perm.menu.length > 0 ? this.perm.menu[0] : 'main' }
          this.routeTo(routeTo)
        }
      }

      setTimeout(() => (this.loadingLogin = false), 50)
    },
    /**
     * 초기 언어 세팅
     */
    langCheck () {
      const cookLocale = VueCookies.get('CMPLang')
      if (cookLocale) {
        this.lang = cookLocale === 'ko' ? 'korean' : 'english'
      } else {
        this.lang = 'korean'
      }
    },
    // 세팅된 랭귀지를 스토어에 저장
    selectLanguage () {
      const locale = this.lang === 'korean' ? 'ko' : 'en'
      this.$store.dispatch('setLanguage', locale)
      // this.$i18n.locale = locale
      this.$router.go()
    },
    /**
     * 'CapsLack' 버튼
     * 비밀번호 입력창에 focus일 떄만 처리.
     */
    checkCapsLock (e) {
      const focusEle = document.activeElement
      const capsOn = e.getModifierState && e.getModifierState('CapsLock')
      this.capsOn = capsOn && focusEle.id === 'password'
    }
  },
  data () {
    return {
      loadingLogin: false,
      lang: '',
      id: '',
      password: '',
      saveId: false,
      capsOn: false, // CapsLock 키 Active 여부
      languageList: [
        { field: 'korean', name: 'KOR' },
        { field: 'english', name: 'ENG' }
      ],
      errType: {
        // '001': '사번 또는 비밀번호를 입력해주세요.',
        '001': this.$t('common.ALERT.LOGIN.008'),
        // '002': '사번 또는 비밀번호를 입력해주세요.',
        '002': this.$t('common.ALERT.LOGIN.008'),
        // IAM001: '존재하지않는 사용자입니다.',
        IAM001: this.$t('common.ALERT.LOGIN.006'),
        // IAM002: '중복로그인으로 인하여 로그아웃 되었습니다.',
        IAM002: this.$t('common.ALERT.LOGIN.009'),
        // IAM003: '세션이 만료되어 로그아웃 되었습니다.',
        IAM003: this.$t('common.ALERT.LOGIN.010'),
        // IAM004: '발행자가 일치하지 않습니다.',
        IAM004: this.$t('common.ALERT.LOGIN.011'),
        // IAM005: '잘못된 비밀번호입니다.',
        IAM005: this.$t('common.ALERT.LOGIN.005'),
        // IAM007: '해당 계정은 잠금되어 로그인 할 수 없습니다.<br>관리자에게 문의해주세요.',
        IAM007: this.$t('common.ALERT.LOGIN.003'),
        // IAM008: '해당 계정은 비활성화된 계정입니다.<br> 관리자에게 문의해주세요.',
        IAM008: this.$t('common.ALERT.ACCOUNT.002'),
        // IAM009: '승인 반려 되었습니다.<br>관리자에게 문의해주세요.'
        IAM009: this.$t('common.ALERT.LOGIN.012'),
        // 퇴사 처리된 계정입니다.<br>관리자에게 문의해주세요.
        IAM015: this.$t('common.ALERT.LOGIN.015'),
        // 관리자 승인 대기 사번입니다.
        IAM006: this.$t('common.ALERT.LOGIN.016')
      }
    }
  }
}

</script>
<style lang="scss">
  .user-login {
    position: relative;
    background-color: $dark-gray;
    width: 100%;
    height: 100vh;
    overflow-x: auto;
    overflow-y: hidden;
    >.login-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 32px 0;
      .logo-wrap {
        display: flex;
        height: 44px;
        .logo {
          display: inline-block;
          width: 100px;
          // width: 32px;
          height: 44px;
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
          background-image: url('../../../assets/images/spharos-logo-sol.png');
          // opacity: .3;
        }
        .logo-title {
          display: flex;
          flex-direction: column;
          margin-left: $gap;
          font-weight: bold;
          vertical-align: middle;
          line-height: 1.26;
          height: 44px;
        }
      }
       > .dropdown-language {
        margin-left: $gap-s;
        width: 70px;
        .el-input {
          .el-select__caret.el-input__icon.is-reverse {
            color: $color-black;
          }
          .el-input__inner {
            padding: 10px;
            border-radius: $radius-r $radius-r 0 0;
            border: 0 !important;
            &+.el-input__suffix {
              display: flex;
              align-items: center;
              justify-content: flex-end;
            }
          }
        }
        > .el-select-dropdown.el-popper {
          box-shadow: none;
          border-radius: 0 0 $radius-r $radius-r;
          // background-color: transparent;
          .el-select-dropdown__wrap.el-scrollbar__wrap{
            overflow: hidden;
            .el-scrollbar__view {
              padding: 0 0 10px 0;
              background-color: transparent;
              border: none;
              > .el-select-dropdown__item {
                padding: 0 $gap-s;
                font-size: 13px;
                background-color: transparent;
              }
            }
          }
        }
      }
      // 언어 선택
    }

    > .login-body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 158px;
      height: calc(100vh - 108px);
      .image-area {
        position: relative;
        margin-top: 300px;
        width: 682px;
        height: 100%;
      }
      .form-area {
        padding: 0 130px;
        margin-top: 100px;
        margin-left: 40px;
        max-width: 420px;
        min-width: 320px;
        width: calc(100vw - 682px);
        height: auto;
        > .service {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 100px;
          font-size: 14px;
          > b {
            margin-right: 10px;
            color: #ccc;
          }
          > .item {
            color: $color-grey;
            cursor: pointer;
          }
        }
        > .login-title {
          color: $white;
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          // text-transform: uppercase;
          &.-only-mobile {
            display: none;
          }
        }
        > .login-info-list {
          margin-top: 50px;
          .login-item {
            & + .login-item {
              margin-top: $gap-s;
              .login-input {
                > .el-input__inner {
                  + .el-input__suffix { right: 15px; }
                  &[type=text] {
                    & + .el-input__suffix {
                      .el-input__suffix-inner {
                        .el-icon-view {
                          position: relative !important;

                          &::before {
                            position: absolute;
                            display: inline-block !important;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                          }
                          &::after {
                            content: '';
                            position: absolute;
                            top: 32%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            height: 16px;
                            width: 1px;
                            transform: rotate(-45deg);
                            background: $main-red;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            .login-input {
              > .el-input__inner {
                padding: 22px 25px;
                background-color: transparent;
                color: $white;
              }
            }
            &.-password {
              position: relative;
              .capslock-alert {
                position: absolute;
                top: 7px;
                left: calc(100% + 10px);
                display: inline-block;
                padding: $gap-s;
                border-radius: $radius;
                color: $color-black;
                font-size: 12px;
                box-sizing: border-box;
                background-color: #fff;
                white-space: nowrap;
                z-index: 5;
                &::before {
                  content: '';
                  position: absolute;
                  top: 50%;
                  left: -4px;
                  margin-top: -4px;
                  width: 8px;
                  height: 8px;
                  background-color: #fff;
                  transform: rotate(45deg);
                }
              }
            }
          }
        }

        > .login-service {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: $gap-s;
          width: 100%;
        }
        .-login-button {
          margin-top: $gap-m;
          width: 100%;
          height: 65px;
          font-size: 20px;
        }

      }
    }
  }

  @media only screen and (max-width: 1366px) {
    .user-login {
      >.login-header {
        padding:35px $gap-m;
        .logo-wrap {
          .logo { width: 25pxp; }
          .logo-title {
            font-size: 11px;
            margin-left: $gap-s;
            justify-content: center;
            span:first-child {
              font-size: 10px;
              font-weight: normal;
            }
          }
        }
        > .dropdown-language {
          display: none;
        }
      // 언어 선택
      }

      > .login-body {
        width: 100%;
        margin:0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0;
        height: 100%;
        .image-area {
          display: none;
        }
        .form-area {
          padding: 0 10%;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          height: auto;
          > .login-title {
            text-align: left;
            line-height: 1.5;

            color: $white;
            font-size: 48px;
            letter-spacing:8px;
            position: relative;

            &.-only-mobile-hide {
              display: none;
            }
            &.-only-mobile {
              display: block;
            }

            &::after {
              position: absolute;
              content: '';
              bottom: 55px;
              left: 110px;
              background: $main-red;
              width: $gap-s; height: $gap-s;
              border-radius: 50%;
            }
          }
          > .login-info-list {
            margin-top: $gap-m;
            // width: 100%;
            width: clamp(250px, 100%, 400px);
            > .login-item {
              & + .login-item {
                margin-top: $gap-s;
              }
              .login-input {
                > .el-input__inner {
                  padding: 22px 25px;
                  background-color: transparent;
                  color: $white;
                }
              }
              & + .login-item {
                margin-top: $gap-s;

              }
            }
          }

          > .login-service {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: $gap;
            width: 100%;

          }
          .-login-button {
            margin-top: 50px;
            height: 55px;
            font-size: 20px;
            border-radius: 2px;
          }

        }
      }
    }
  }

   @media only screen and (max-width: 650px) {
      .user-login {
        > .login-body {
          .form-area {
            > .login-info-list {
              .login-item {
                &.-password {
                  .capslock-alert {
                    left: 0;
                    top: calc(100% + 10px);
                    &::before {
                      position: absolute;
                      left: 50%;
                      top: -4px;
                      margin: 0 0 0 -4px;
                    }
                  }
                }
              }
            }
          }
        }
      }
   }

</style>
