<!--
  * 파일명 : ChangePassword.vue
  * 파일 기능 : 비번 설정 90일 이후 비번 번경
  * 작성자 : 염창윤
  * 최종 작성일 : 2021-03-18
  * License By Shinsegae I&C
  * 2021-03-18 Update: 페이지 생성
 -->

<template>
  <section class="chg-pw">
    <div class="chg-pw__title">
      <div>
        <h1
          class="title"
        >
          {{ $t('common.REGCON.changePw') }}
        </h1>
        <p>{{ newPwMessage }}</p>
      </div>
    </div>
    <div class="chg-pw__info">
      <div>
        <register-contents
          :title="$t('common.REGCON.currentPw')"
          type="input"
          required
        >
          <el-input
            class="pw-input"
            type="password"
            show-password
            v-model="userInfo.currentPw"
            :placeholder="$t('common.PLACEHOLDER.enterCurrentPw')"
          />
        </register-contents>
        <!-- /. 현재 비밀번호 -->

        <register-contents
          :title="$t('common.REGCON.newPw')"
          type="input"
          required
        >
          <el-input
            class="pw-input"
            type="password"
            show-password
            v-model="userInfo.userPw"
            :placeholder="$t('common.PLACEHOLDER.enterNewPw')"
          />
          <p class="pw-info">
            {{ $t('common.PLACEHOLDER.pwValid') }} (&nbsp;&#33;&nbsp;&#35;&nbsp;&#36;&nbsp;&#37;&nbsp;&#38;&nbsp;&#42;&nbsp;&#63;&nbsp;&#64;&nbsp;) {{ $t('common.PLACEHOLDER.pwValidRight') }}
          </p>
        </register-contents>
        <!-- /. 비밀번호 -->

        <register-contents
          :title="$t('common.REGCON.newRePw')"
          type="input"
          required
        >
          <el-input
            class="pw-input"
            type="password"
            show-password
            v-model="userInfo.userPwRe"
            :placeholder="$t('common.PLACEHOLDER.enterNewRePw')"
          />
        </register-contents>
        <!-- /. 비밀번호 재입력 -->

        <register-contents
          :title="$t('admin.ACCOUNT.authOtp')"
          type="input"
          required
        >
          <div class="get-varification">
            <el-input
              :placeholder="$t('common.PLACEHOLDER.enterSome', { some: $t('common.GRID.pressure') })"
              class="input"
              v-model="identificationNum"
              :disabled="true"
            />
            <button
              v-if="!isWaitingCertNumber"
              :disabled="creating"
              v-loading="creating"
              @click="getVerifNum"
              class="button get-num"
              type="is-dark"
            >
              {{ $t('common.BTN.auth') }}
            </button>
            <span
              v-if="afterConfirm"
              class="after-confirm-txt"
            >
              {{ $t('common.ALERT.ACCOUNT.029') }}
            </span>
          </div>
        </register-contents>
        <!-- 인증번호 받기 -->

        <register-contents
          v-if="showVerifInput"
          type="input"
          class="register-area"
        >
          <div class="register-area-inner">
            <div>
              <el-input
                :placeholder="$t('common.PLACEHOLDER.enterSome', { some: $t('common.TERMS.certNumber') })"
                v-model="varifNum"
                class="-check-button"
              />
              <span
                v-if="isWaitingCertNumber"
                class="waiting-timer"
              >
                {{ $t('common.TERMS.validTime') }} {{ waitingTimer }}{{ $t('common.TERMS.second') }}
              </span>
            </div>
            <button
              class="button"
              type="is-primary"
              @click="confirm"
            >
              {{ $t('common.BTN.confirm') }}
            </button>
          </div>
        </register-contents>
      </div>
    <!-- /. 인증번호 입력 -->
    </div>

    <div class="button-area submit-information">
      <!-- <button
        class="button"
        size="is-large"
        @click="$router.go(-1)"
      >
        나중에 변경
      </button> -->
      <button
        v-if="user"
        class="button"
        size="is-large"
        @click="logout"
      >
        {{ $t('main.LAYOUT.logout') }}
      </button>
      <button
        :disabled="!canClickSaveBtn"
        class="button"
        type="is-primary"
        size="is-large"
        @click="updateUserPw"
      >
        {{ $t('common.BTN.save') }}
      </button>
    </div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'
import VueCookies from 'vue-cookies'

export default {
  name: 'ChangePassword',
  components: {
  },
  created () {
    this.login()
    if (this.user) {
      this.identificationNum = this.user.userId
      this.isAdmin = this.user.userPermLevel === 0 || this.user.userPermLevel === 1
    }
  },
  beforeRouteLeave (to, from, next) {
    const q = ['/', '/login']
    if (q.includes(to.path)) next()
    else next(false)
  },
  computed: {
    ...mapGetters(['user']),
    newPwMessage () {
      return this.$route.params.firstLogin ? this.$t('common.PLACEHOLDER.setNewPwMessageFirst') : this.$t('common.PLACEHOLDER.setNewPwMessage')
    },
    canClickSaveBtn () {
      return this.userInfo.currentPw !== '' &&
            this.userInfo.userPw !== '' &&
            this.userInfo.userPwRe !== '' &&
            this.changeStage
    }
  },
  methods: {
    login () {
      const user = VueCookies.get('User')
      if (user) this.$store.commit('setUser', user)
    },
    logout () {
      this.$store.dispatch('logout')
      this.$router.push({ name: 'user-login' })
    },
    /**
     * 인증번호 생성/확인용 랜덤 문자열을 만듭니다.
     */
    genRandomString () {
      let result = this.randomString + '-'
      for (let i = 0; i < 5; i++) {
        result += Math.floor(Math.random() * 10)
      }
      this.certRandomString = result
    },
    initVarify () {
      clearInterval(this.waitingTimerInterval)
      if (!this.afterConfirm) this.isWaitingCertNumber = false
      this.showVerifInput = false
      this.certRandomString = ''
      this.varifNum = ''
      this.waitingTimer = 180
      if (!this.afterConfirm) this.changeStage = false
    },
    /**
     * 인증번호 요청을 위해 사용자 확인을 합니다.
     */
    async getVerifNum () {
      this.identificationNum = this.identificationNum.replace(/\s/g, '')
      if (!this.identificationNum || this.identificationNum === '') {
        return this.$alert(this.$t('common.ALERT.ACCOUNT.010'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => false
        })
      } else if (this.identificationNum.length <= 3 || this.identificationNum.length > 20) {
        this.$alert(this.$t('common.ALERT.ACCOUNT.009'))
      } else {
        const user = await API.iam.findId({
          isAdmin: this.isAdmin,
          userId: this.identificationNum
        })

        if (user === '' || !user.userIdx) {
          this.$alert(this.$t('common.ALERT.LOGIN.007'))
        } else {
          this.createCertNumber()
        }
      }
    },
    /**
     * 인증번호를 요청합니다.
     */
    async createCertNumber () {
      if (!this.user.userEmail && !this.user.userPhone) {
        return this.$alert(this.$v('인증번호를 받을 이메일 주소 또는 휴대폰 번호가 없습니다.<br>등록 후 이용해주세요.'), { dangerouslyUseHTMLString: true })
      }

      this.genRandomString()
      this.creating = true
      // let userId
      // let alarmType
      // if (this.isSSG) {
      //   userId = this.identificationNum
      //   alarmType = 'TALK'
      // } else {
      const userId = this.user.userId
      // const alarmType = 'MAIL'
      // }
      const res = await API.iam.createCertNumber({
        userId: userId,
        userEmail: this.user.userEmail || null,
        userPhone: this.user.userPhone || null,
        // alarmType: alarmType,
        code: this.certRandomString
      })
      if (res) {
        this.showVerifInput = true
        this.expireTime = res.expireTime
        this.isWaitingCertNumber = true
        this.waitingTimerInterval = setInterval(() => {
          this.waitingTimer -= 1
          if (this.waitingTimer === 0) {
            this.initVarify()
          }
        }, 1000)
      } else {
        this.$alert(this.$t('common.ALERT.ACCOUNT.018'), '', { dangerouslyUseHTMLString: true })
      }
      this.creating = false
    },
    /**
     * 인증번호 확인 클릭시 실행 됩니다.
     */
    async confirm () {
      if (!this.showVerifInput || !this.varifNum) {
        return this.$alert(this.$t('common.ALERT.ACCOUNT.019'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => false
        })
      } else {
        const confirmPayload = {
          userId: this.user.userId,
          userEmail: this.user.userEmail || null,
          userPhone: this.user.userPhone || null,
          // alarmType: 'MAIL',
          certNumber: this.varifNum,
          code: this.certRandomString
        }
        const confirmCertNumberRes = await API.iam.confirmCertNumber(confirmPayload)
        if (!confirmCertNumberRes) {
          this.$alert(this.$t('common.ALERT.ACCOUNT.021'))
          return
        }
        this.$alert(this.$t('common.ALERT.ACCOUNT.029'), {
          callback: () => {
            this.changeStage = true
            this.showVerifInput = false
            this.afterConfirm = true
          }
        })
      }
    },
    /**
     * 저장 클릭 시 실행 됩니다.
     */
    updateUserPw () {
      // validation
      if (this.userInfo.currentPw === '') {
        this.$alert(this.$t('common.ALERT.ACCOUNT.030'))
        return
      }
      if (this.userInfo.userPw === '') {
        // this.$alert('새로운 비밀번호를 입력해주세요.')
        this.$alert(this.$t('common.ALERT.ACCOUNT.031'))
        return
      }
      if (this.userInfo.userPwRe === '') {
        // this.$alert('새로운 비밀번호를 다시한번 입력해주세요.')
        this.$alert(this.$t('common.ALERT.ACCOUNT.032'))
        return
      }
      if (this.userInfo.userPw !== this.userInfo.userPwRe) {
        // 변경할 비밀번호와 확인 비밀번호가 일치하지 않습니다.
        this.$alert(this.$t('common.ALERT.ACCOUNT.033'))
        return
      }
      const userPasswordValid = this.checkPasswordValid()
      if (!userPasswordValid) {
        // this.$alert('새로운 비밀번호를 확인해주세요. (문자, 숫자, 특수문자 포함 8자 이상)')
        this.$alert(this.$t('common.ALERT.ACCOUNT.037'))
        return
      }

      const params = {
        userId: this.identificationNum,
        isAdmin: this.isAdmin
      }
      const payload = {
        currentPw: this.userInfo.currentPw,
        userId: this.identificationNum,
        userPermLevel: this.user.userPermLevel,
        userPw: this.userInfo.userPw,
        userName: this.user.userName
      }
      this.$confirm(this.$t('common.CONFIRM.ACCOUNT.004'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.initVarify()
        API.iam.updateUserPwd(params, payload).then(res => {
          this.$alert(this.$t('common.ALERT.ACCOUNT.005'), {
            dangerouslyUseHTMLString: true,
            callback: () => {
              this.$store.dispatch('logout')
              this.$router.push({ name: 'user-login' })
            }
          })
        }).catch(res => {
          if (res.code === 'IAM010') {
            this.$alert(this.$t('common.ALERT.ACCOUNT.035'))
          } else if (res.code === 'IAM019') {
            this.$alert(this.$t('common.ALERT.ACCOUNT.036'))
          } else {
            this.$alert(res.message)
          }
        })
      }).catch(() => false)
    },
    /**
     * 패스워드 유효성 검사 함수.
     */
    checkPasswordValid (password = this.userInfo.userPw) {
      const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!#$%&*?@])[A-Za-z\d!#$%&*?@]{8,}$/
      return re.test(password)
    }
  },
  data () {
    return {
      userInfo: {},
      identificationNum: '',
      creating: false,
      isWaitingCertNumber: false,
      varifNum: '',
      waitingTimerInterval: null,
      waitingTimer: 180,
      showVerifInput: false,
      isAdmin: null,
      certRandomString: '',
      randomString: 'chgpw',
      isSSG: process.env.VUE_APP_SSG_USER === 'true',
      changeStage: false,
      afterConfirm: false
    }
  }
}
</script>

<style lang="scss" scoped>
.chg-pw {
  padding-top: 150px;
  .chg-pw__title {
    display: flex;
    justify-content: center;
    margin-bottom: 50px;
    > div {
      text-align: center;
      h1 {
        margin-top: 0;
        margin-bottom: 15px;
        font-size: 2.8em;
      }
      p {
        font-size: 1.2em;
        color: #aaa;
      }
    }
  }
  .chg-pw__info {
    display: flex;
    justify-content: center;
    > div {
      width: 774px;
    }
    .pw-input {
      max-width: 350px;
      height: 35px;
    }
    .pw-info {
      margin-top: 5px;
      font-size: 0.9em;
    }
    .get-varification {
      display: flex;
      .input {
        max-width: 350px;
      }
      button {
        margin-left: 10px;
      }
      .after-confirm-txt {
        margin-left: 10px;
        line-height: 32px;
      }
    }
    .register-area {
      .register-area-inner {
        display: flex;
        button {
          margin-left: 10px;
        }
      }
    }
  }
  .button-area {
    margin-top: 50px;
    display: flex;
    justify-content: center;
  }
}
</style>

<style lang="scss">
.chg-pw {
  .register-area {
    .register-area-inner {
      div {
        .-check-button {
          margin-bottom: 5px;
          &.el-input {
            width: 200px;
            .el-input__inner {
              border: none;
              border-bottom: 1px solid $main-red;
            }
          }
        }
        .waiting-timer {
          display: block;
        }
      }
    }
  }
}
</style>
