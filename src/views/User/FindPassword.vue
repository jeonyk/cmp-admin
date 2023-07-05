<!--
  * 파일명 : FindPassword.vue
  * 파일 기능 : OTP 인증 및 관리자 비밀번호 초기화/수정 컴포넌트
  * 작성자 : 이경환
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 add: 비밀번호 찾기 페이지 추가
 -->

<template>
  <section class="find-password-warp">
    <h5
      v-if="!otpPopup"
      class="title"
    >
      {{ otpTitle }}
    </h5>

    <article
      class="find-password-warp-article"
      v-if="!changeStage"
    >
      <register-contents
        :title="$t('common.GRID.pressure')"
        type="input"
        required
      >
        <div class="get-varification">
          <el-input
            :placeholder="$t('common.PLACEHOLDER.enterSome', { some: $t('common.GRID.pressure') })"
            class="input"
            v-model="identificationNum"
            :disabled="$route.name !== 'find-password'"
          />
          <button
            :disabled="creating"
            v-loading="creating"
            class="button get-num"
            type="is-dark"
            @click="getVerifNum"
            v-if="!isWatingCertNumber"
          >
            {{ $t('common.BTN.auth') }}
          </button>
        </div>
      </register-contents>
      <!-- 인증번호 받기 -->

      <register-contents
        v-if="showVerifInput"
        type="input"
      >
        <el-input
          :placeholder="$t('common.PLACEHOLDER.enterSome', { some: $t('common.TERMS.certNumber') })"
          v-model="varifNum"
          class="-check-button"
        />
        <span
          v-if="isWatingCertNumber"
          class="waiting-time"
        >
          {{ $t('common.TERMS.validTime') }} {{ waitingTimer }}{{ $t('common.TERMS.second') }}
        </span>
        <div class="register">
          <button
            class="button"
            type="is-primary"
            @click="confirm"
          >
            <!-- :disabled="confirmLoading"
            v-loading="confirmLoading" -->
            {{ $t('common.BTN.confirm') }}
          </button>
          <!-- /. 인증번호 이름 -->
        </div>
      </register-contents>
    </article>
    <!-- /. 인증번호 인증 영역  -->

    <article
      v-else
      class=""
    >
      <register-contents
        :title="$t('common.REGCON.newPw')"
        type="input"
        required
      >
        <el-input
          class="input new-password"
          type="password"
          :placeholder="$t('common.PLACEHOLDER.enterNewPw')"
          v-model="userInfo.userPw"
        />
        <span class="pw-info">{{ $t('common.PLACEHOLDER.pwValid') }} (&nbsp;&#33;&nbsp;&#35;&nbsp;&#36;&nbsp;&#37;&nbsp;&#38;&nbsp;&#42;&nbsp;&#63;&nbsp;&#64;&nbsp;) {{ $t('common.PLACEHOLDER.pwValidRight') }}</span>
      </register-contents>

      <register-contents
        :title="$t('common.REGCON.newRePw')"
        type="input"
        required
      >
        <el-input
          class="input new-password"
          type="password"
          :placeholder="$t('common.PLACEHOLDER.enterNewRePw')"
          v-model="userInfo.userPwRe"
        />
      </register-contents>

      <div class="button-area submit-information">
        <button
          class="button"
          type="is-primary"
          @click="changePW()"
        >
          {{ $t('common.BTN.change') }}
        </button>
      </div>
    </article>
  </section>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import API, { RegisterContents } from '@sd-fe/cmp-core'

export default {
  name: 'FindPassword',
  props: {
    otpPopup: {
      type: Boolean,
      default: false
    },
    randomString: {
      type: String,
      default: 'default'
    },
    requiredApi: {
      type: Boolean,
      required: false,
      default: false
    },
    callbackApi: {
      type: Function,
      required: false,
      default: () => {}
    },
    // Central, Element, Era
    ntxIdx: {
      type: Number,
      required: false,
      default: 0
    },
    // 네트워크 장비
    networkIdx: {
      type: Number,
      required: false,
      default: null
    },
    // 알람 서버
    alarmType: {
      type: String,
      required: false,
      default: ''
    },
    // itAutomation 정보
    itAutomationIdx: {
      type: Number,
      required: false,
      default: 0
    },
    // OTP 인증번호를 가지고 실행해야 하는 API가 각 모듈마다 다름
    // callbackApi의 이름으로 받으면 NODE_ENV=production 일 때 함수명이 매우 짧게
    // 변환되어 비교할 수 없는 상황 방지용으로 컴포넌트 이름을 받음
    apiCallComponentName: {
      type: String,
      required: false,
      default: ''
    }
  },
  components: {
    RegisterContents
  },
  computed: {
    otpTitle () {
      return this.otpPopup ? this.$t('admin.ACCOUNT.authOtp') : this.$t('common.GRID.findPw')
    },
    ...mapGetters(['user'])
  },
  created () {
    if (!this.otpPopup) this.setBreadCrumbs([{ label: this.$t('common.GRID.findPw'), name: 'find-password', path: false }])
    this.genRandomString()
    // 사번 자동으로 채우기
    if (this.user) {
      this.identificationNum = this.user.userId
    }
  },
  methods: {
    ...mapMutations({
      setBreadCrumbs: 'common/SET_BREADCRUMBS'
    }),
    // 인증번호 생성/확인용 랜덤 문자열을 만듭니다.
    genRandomString () {
      let result = this.randomString + '-'

      for (let i = 0; i < 5; i++) {
        result += Math.floor(Math.random() * 10)
      }

      this.certRandomString = result
    },
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
          isAdmin: true,
          userId: this.identificationNum
        })
        if (user === '' || !user.userIdx) {
          this.$alert(this.$t('common.ALERT.LOGIN.007'))
        } else {
          user.userPw = ''
          user.userPwRe = ''
          this.userInfo = user
          if (this.userInfo.userEmail || this.isSSG) {
            this.createCertNumber()
          } else {
            // 인증번호를 받을 이메일 주소가 없습니다.<br>이메일 등록 후 이용해주세요.
            this.$alert(this.$t('common.ALERT.ACCOUNT.043'), '', { dangerouslyUseHTMLString: true })
          }
        }
        // this.showVerifInput = true
      }
    },
    async createCertNumber () {
      this.creating = true
      // let userId
      // let alarmType
      // if (this.isSSG) {
      //   userId = this.userInfo.userId
      //   alarmType = 'TALK'
      // } else {
      const userId = this.userInfo.userId
      // const alarmType = 'MAIL'
      // }
      const res = await API.iam.createCertNumber({
        userId: userId,
        userEmail: this.userInfo.userEmail || null,
        userPhone: this.userInfo.userPhone || null,
        // alarmType: alarmType,
        code: this.certRandomString
      })
      if (res.result) {
        this.expireTime = res.expireTime
        this.isWatingCertNumber = true
        this.showVerifInput = true
        this.waitingTimerInterval = setInterval(() => {
          this.waitingTimer -= 1
          if (this.waitingTimer === 0) {
            clearInterval(this.waitingTimerInterval)
            this.isWatingCertNumber = false
            this.showVerifInput = false
            this.varifNum = ''
            this.waitingTimer = 180
            this.genRandomString()
          }
        }, 1000)
      } else {
        this.$alert(this.$t('common.ALERT.ACCOUNT.018'), '', { dangerouslyUseHTMLString: true })
      }
      this.creating = false
    },
    // 인증완료
    async confirm () {
      if (!this.showVerifInput || !this.varifNum) {
        return this.$alert(this.$t('common.ALERT.ACCOUNT.019'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => false
        })
      } else {
        this.confirmLoading = true
        const confirmPayload = {
          userId: this.userInfo.userId,
          userEmail: this.userInfo.userEmail || null,
          userPhone: this.userInfo.userPhone || null,
          // alarmType: 'MAIL',
          certNumber: this.varifNum,
          code: this.certRandomString
        }
        if (this.requiredApi) {
          try {
            let data
            const apiName = this.apiCallComponentName
            if (apiName === 'OrgJdbc' || apiName === 'OrgItsm') {
              data = await this.callbackApi(0, confirmPayload)
            } else if (
              // 뉴타닉스 쪽에서 사용하면 Index 필요함
              apiName === 'NutanixCentral' ||
              apiName === 'NutanixElement' ||
              apiName === 'NutanixEra'
            ) {
              console.log(this.ntxIdx)
              if (this.ntxIdx === undefined) return
              data = await this.callbackApi(this.ntxIdx, confirmPayload)
            } else if (apiName === 'ConfigNetworkEquip') {
              if (this.networkIdx === null) return
              data = await this.callbackApi(confirmPayload, this.networkIdx)
            } else if (apiName === 'ConfigAlarmServer') {
              data = await this.callbackApi(confirmPayload, this.alarmType)
              if (!data.isOtpAuth) {
                throw new Error()
              }
            } else if (apiName === 'ConfigITAutomation') {
              data = await this.callbackApi(confirmPayload, this.itAutomationIdx)
            } else {
              data = await this.callbackApi(confirmPayload)
            }
            return this.$emit('validated-otp', data)
          } catch (error) {
            return this.$alert(this.$t('common.ALERT.PROJECT.022'), '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              callback: () => false
            })
          }
        } else {
          const confirmCertNumberRes = await API.iam.confirmCertNumber(confirmPayload)
          if (!confirmCertNumberRes) {
            return this.$alert(this.$t('common.ALERT.ACCOUNT.021'))
          }
          if (this.otpPopup) {
            return this.$emit('validated-otp', confirmPayload)
          }
        }
        this.confirmLoading = false
        this.changeStage = true
      }
    },
    // 비밀번호 변경 버튼
    changePW () {
      if (this.userInfo.userPw === '' || this.userInfo.userPwRe === '') {
        this.$alert(this.$t('common.ALERT.ACCOUNT.004'))
        return
      }
      if (this.userInfo.userPw !== this.userInfo.userPwRe) {
        this.$alert(this.$t('common.ALERT.ACCOUNT.038'))
        return
      }
      const userPasswordValid = this.checkPasswordValid()
      if (!userPasswordValid) {
        this.$alert(this.$t('common.ALERT.ACCOUNT.037'))
        return
      }
      // if (this.isSSG) {
      //   delete this.userInfo.userEmail
      //   delete this.userInfo.userPhone
      // }
      this.$confirm(this.$t('common.CONFIRM.ACCOUNT.004'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        const isAdmin = true
        API.iam.updateUserPw(this.userInfo, isAdmin).then(res => {
          this.$alert(this.$t('common.ALERT.ACCOUNT.005'), {
            dangerouslyUseHTMLString: true
          })
          this.$router.push({ name: 'user-login' })
        }).catch(res => {
          if (res.code === 'IAM019') {
            this.$alert(this.$t('common.ALERT.ACCOUNT.036'))
          } else {
            this.$alert(res.message)
          }
        })
      }).catch(() => false)
    },
    checkPasswordValid (password = this.userInfo.userPw) {
      const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!#$%&*?@])[A-Za-z\d!#$%&*?@]{8,}$/
      return re.test(password)
    }
  },
  data () {
    return {
      confirmLoading: false,
      creating: false,
      certRandomString: '',
      identificationNum: '',
      showVerifInput: false,
      varifNum: '',
      changeStage: false,
      userInfo: {},
      pw: {
        pw: '',
        pwVerif: ''
      },
      isWatingCertNumber: false,
      waitingTimerInterval: null,
      waitingTimer: 180,
      isSSG: process.env.VUE_APP_SSG_USER === 'true'
    }
  }
}
</script>

<style lang="scss" scoped>
.find-password-warp {
  margin-top: 40px;
  .title {
    line-height: 18px;
    font-size: 18px;
    margin-bottom: 25px;
  }
  .find-password-warp-article {
    border-top :1px solid $gray;
    .get-varification {
      display: flex;
      .get-num { margin-left: $gap; }
    }
    .input { width: 200px; }
    .waiting-time {
      margin-top: 5px;
    }
    .register {
      margin-top: 15px;
      text-align: left;
    }
  }
  .button-area {
    margin-top: 30px;
    button {
      margin: 0 auto;
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>

<style lang="scss">
.find-password-warp {
  .-check-button {
    &.el-input {
      width: 200px;
      .el-input__inner {
        border: none;
        border-bottom: 1px solid $main-red;
      }
    }
  }
  .new-password {
    width:270px;
    height:32px;
    // background-color:red;
  }
}

.pw-info {
  padding-left:20px;
}
</style>
