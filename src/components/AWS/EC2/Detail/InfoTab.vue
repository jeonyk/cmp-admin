<!-- 관리자에서 안쓰는 컴포넌트 -->

<template>
  <div class="info-tab">
    <g-tab :data="footerTab">
      <template #detail>
        <div class="wrapper">
          <div class="detail-info">
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  운영체제
                </div>
                <div class="value">
                  {{ resData.platformDetail }}
                </div>
              </div>
            </div>
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  플랫폼 세부 정보
                </div>
                <div class="value">
                  {{ resData.platformDetail }}
                </div>
              </div>
            </div>
            <div class="divider" />
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  AMI ID
                </div>
                <div class="value">
                  {{ resData.amiId }}
                </div>
              </div>
            </div>
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  AMI 이름
                </div>
                <div class="value">
                  {{ resData.amiName }}
                </div>
              </div>
            </div>
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  AMI 위치
                </div>
                <div class="value">
                  {{ resData.imageLocation }}
                </div>
              </div>
            </div>
            <div class="divider" />
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  세부 모니터링
                </div>
                <div class="value">
                  {{ parseInt(resData.monitoringState) ? "활성" : "비활성" }}
                </div>
              </div>
            </div>
            <div class="detail-info-table">
              <div class="item">
                <div class="title">
                  BASTION 접속 정보
                </div>
                <div class="value">
                  <p
                    class="check-bastion"
                    @click="onClickCheckBastion"
                  >
                    확인하기
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #history>
        <div class="wrapper">
          <detail-history />
        </div>
      </template>
    </g-tab>
    <el-dialog
      title="BASTION 접속 정보 확인"
      :visible.sync="activeCheckBastionModal"
      @close="activeCheckBastionModal = false"
      :width="authed ? '480px' : '610px'"
      :before-close="beforeCloseCheckModal"
    >
      <div class="check-bastion">
        <template v-if="!authed">
          <div class="placeholder">
            BASTION 접속 정보는 추가 인증 확인 후 조회 가능 합니다.
          </div>
          <register-contents
            type="input"
            title="이메일"
            :title-width-px="160"
          >
            <el-input
              :value="emailValue"
              disabled
            />
            <button
              class="button"
              type="is-primary"
              @click="onClickRequestAuthCode"
              :disabled="isLoadingRequestAuthNum"
              v-loading="isLoadingRequestAuthNum"
            >
              {{ requestedAuthNum ? "인증번호 재요청" : "인증번호 요청" }}
            </button>
          </register-contents>
          <register-contents
            v-if="requestedAuthNum"
            v-model="authNum"
            type="input"
            title="인증번호 입력"
            class="auth"
            :title-width-px="160"
          >
            <el-input
              v-model="authNum"
              class="is-suffix"
            >
              <template #suffix>
                {{ displayAuthInterval }}
              </template>
            </el-input>
            <div
              v-if="authError"
              class="error-message"
            >
              {{ authErrorMessage }}
            </div>
          </register-contents>
        </template>
        <template v-else>
          <div class="placeholder">
            BASTION 접속 정보는 유출되지 않게 주의해주세요.
          </div>
          <register-contents
            type="input"
            title="접속 경로"
            :title-width-px="160"
          >
            <el-input
              disabled
              key="connect-path"
            />
          </register-contents>
          <register-contents
            type="input"
            title="ID"
            :title-width-px="160"
          >
            <el-input
              disabled
              key="id"
            />
          </register-contents>
          <register-contents
            type="input"
            title="PASSWORD"
            :title-width-px="160"
          >
            <el-input
              disabled
              key="pw"
            />
          </register-contents>
        </template>
      </div>
      <section class="modal-button-area">
        <template v-if="!authed">
          <button
            class="button"
            type="is-anti"
            @click="onClickCancelModal"
          >
            취소
          </button>
          <button
            class="button"
            type="is-primary"
            :disabled="!requestedAuthNum || !authNum"
            @click="onClickConfirmCert"
          >
            인증하기
          </button>
        </template>
        <template v-else>
          <button
            class="button"
            type="is-primary"
            @click="onClickConfirm"
          >
            확인
          </button>
        </template>
      </section>
    </el-dialog>
  </div>
</template>

<script>
import gTab from '@/components/common/g-tab/g-tab.vue'
import DetailHistory from './DetailHistory.vue'
import { mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'
import { getBastion } from '@/components/Apis/AWS'

export default {
  name: 'InfoTab',
  components: { 'g-tab': gTab, DetailHistory },
  props: {
    resData: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapGetters({
      user: state => state.auth.user
    }),
    displayAuthInterval () {
      if (!this.waitingTimer) return ''
      const minutes = parseInt(this.waitingTimer / 60)
      const seconds = parseInt(this.waitingTimer % 60)

      return `0${minutes}:${seconds < 10 ? '0' + seconds : seconds}`
    }
  },
  watch: {
    activeCheckBastionModal (visible) {
      if (!visible) {
        this.requestedAuthNum = false
        this.activeCheckBastionModal = false
        this.authed = false
        this.waitingTimer = 180
        this.isLoadingRequestAuthNum = false
        this.isLoadingConfirmCert = false
        this.authError = false
        this.authErrorMessage = ''
        this.sendRandomString = ''
        this.bastion.ip = ''
        this.bastion.id = ''
        this.bastion.pw = ''
        if (this.timerInterval) clearInterval(this.timerInterval)
        this.timerInterval = null
        this.authNum = ''
      }
    },
    authed (isAuth) {
      if (isAuth) {
        this.getBastionData()
      }
    }
  },
  methods: {
    onClickConfirm () {
      this.activeCheckBastionModal = false
    },
    async getBastionData () {
      try {
        this.isLoadingBastionData = true

        const { data } = await getBastion({
          instanceId: this.resData.instanceId,
          projectIdx: this.resData.projectIdx
        })

        this.bastion.id = data.id
        this.bastion.ip = data.publicIp
        this.bastion.pw = data.password
      } catch (error) {
        console.log(error)
        this.$alert('Bastion 데이터 조회에 실패하였습니다.')
      } finally {
        this.isLoadingBastionData = false
      }
    },
    onClickCancelModal () {
      this.$confirm('인증 진행중입니다. 취소하고 팝업을 닫으시겠습니까?')
        .then(() => {
          this.activeCheckBastionModal = false
        })
        .catch(() => false)
    },
    async onClickConfirmCert () {
      if (!this.authNum) {
        this.authError = true
        this.authErrorMessage = '인증번호를 입력해주세요.'
      }

      try {
        this.isLoadingConfirmCert = true

        const authed = await API.iam.confirmCertNumber({
          userId: this.user.userId || null,
          userEmail: this.user.userEmail || null,
          userPhone: this.user.userPhone || null,
          certNumber: this.authNum.trim(),
          code: this.sendRandomString
        })

        if (!authed) throw new Error('invalid')

        this.expired()
        this.authed = true
      } catch (error) {
        this.authError = true
        this.authErrorMessage = '인증번호를 재확인해주세요.'
      } finally {
        this.isLoadingConfirmCert = false
      }
    },
    expired () {
      clearInterval(this.timerInterval)
      this.timerInterval = null
      this.waitingTimer = 180
      this.requestedAuthNum = false
      this.authed = false
      this.authNum = ''
      this.authError = false
      this.authErrorMessage = ''
      this.sendRandomString = ''
    },
    tick () {
      this.waitingTimer--

      if (this.waitingTimer <= 0) {
        this.expired()
      }
    },
    genRandomString () {
      let result = this.randomString + '-'

      for (let i = 0; i < 10; i++) {
        result += Math.floor(Math.random() * 10)
      }

      this.sendRandomString = result
    },
    async onClickRequestAuthCode () {
      try {
        // 인증번호 재요청
        if (this.requestedAuthNum) {
          this.requestedAuthNum = false
          this.expired()
        }
        this.isLoadingRequestAuthNum = true
        this.genRandomString()

        await API.iam.createCertNumber({
          userId: this.user.userId || null,
          userEmail: this.user.userEmail || null,
          // userEmail: 'khlee@seowoninfo.com',
          userPhone: this.user.userPhone || null,
          code: this.sendRandomString
        })

        this.requestedAuthNum = true
        this.timerInterval = setInterval(this.tick, 1000)
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingRequestAuthNum = false
      }
    },
    beforeCloseCheckModal (done) {
      if (!this.requestedAuthNum) return done()

      this.$confirm('인증 진행중입니다. 취소하고 팝업을 닫으시겠습니까?')
        .then(() => {
          done()
        })
        .catch(() => false)
    },
    onClickCheckBastion () {
      if (!this.user.userEmail) {
        return this.$alert('이메일 등록 후 이용바랍니다.')
      }
      this.activeCheckBastionModal = true
      this.emailValue = this.user.userEmail
    }
  },
  data: () => ({
    emailValue: '',
    authNum: '',
    requestedAuthNum: false,
    activeCheckBastionModal: false,
    authed: false,
    waitingTimer: 180,
    isLoadingRequestAuthNum: false,
    isLoadingConfirmCert: false,
    isLoadingBastionData: false,
    timerInterval: null,
    authError: false,
    authErrorMessage: '',
    randomString: 'cmp',
    sendRandomString: '',
    footerTab: [
      { name: '상세정보', field: 'detail', isActive: true },
      { name: '모니터링', field: 'monitoring' },
      { name: '히스토리', field: 'history' }
    ],
    bastion: {
      ip: '',
      id: '',
      pw: ''
    }
  })
}
</script>

<style lang="scss" scoped>
.info-tab {
  position: relative;
  top: 60px;
  left: -40px;
  width: 100vw;
  box-sizing: border-box;

  .wrapper {
    min-height: 300px;

    .detail-info {
      width: 1490px;
      height: 270px;
      border-radius: 6px;
      background-color: white;
      box-sizing: border-box;
      padding: 30px 40px 35px 40px;

      &-table {
        display: inline-block;

        .item {
          width: 450px;

          .title {
            margin-bottom: $gap-s;
            font-size: 13px;
            color: #999;
          }

          .value {
            .check-bastion {
              display: inline-block;
              color: #32a1ff;
              cursor: pointer;
              text-decoration: underline;
            }
          }
        }
      }

      .divider {
        margin: 20px 0;
        height: 1px;
        width: 100%;
        background-color: #c9c9c9;
        display: block;
      }
    }
  }

  &::v-deep {
    .g-tab-wrap {
      .tab-header {
        padding-left: 40px;
      }

      .tab-contents-area {
        padding: 40px;
        margin-bottom: 50px;
        background-color: #fafafa;
      }
    }
  }

  &::v-deep {
    .el-dialog {
      &__header {
        margin-bottom: $gap-s;
      }
    }
  }
}

.check-bastion {
  .placeholder {
    color: #999;
    margin-bottom: $gap;
  }

  &::v-deep {
    .register-contents {
      .contents-title {
        min-width: 140px;
        width: 140px;
      }

      &.auth {
        .contents-title {
          margin-bottom: $gap;
        }
      }

      .el-input {
        display: inline-block;
        width: 60%;
        margin-right: $gap-s;
      }

      .error-message {
        font-size: 13px;
        color: $main-red;
        margin-top: $gap-s;
      }
    }
  }
}

.el-input.is-suffix {
  &::v-deep .el-input__inner {
    padding-right: 55px;
  }

  &::v-deep .el-input__suffix {
    display: flex;
    align-items: center;
    color: $main-red;
    padding-right: $gap-s;
  }
}
</style>
