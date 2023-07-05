<template>
  <el-dialog
    :visible="isVisible"
    @close="$emit('close')"
    :title="$v('비밀번호 확인')"
    width="456px"
  >
    <div class="confirm-password-modal">
      <span class="password-label">
        {{ $v('현재 로그인된 계정의 비밀번호를 입력해주세요') }}
      </span>
      <el-input
        class="login-input"
        v-model="password"
        :placeholder="$v('비밀번호를 입력해주세요.')"
        type="password"
        show-password
        @keypress.native.enter="checkPassword"
      />
    </div>
    <div class="modal-footer modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        @click="checkPassword"
        class="button"
        type="is-primary"
        :disabled="!checkPasswordLength"
      >
        {{ $v('확인') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ConfirmPasswordModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    isVisible: {
      immediate: true,
      handler (newVal) {
        if (!newVal) this.password = ''
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    checkPasswordLength () {
      if (this.password !== '') {
        return true
      }
      return false
    }
  },
  methods: {
    async checkPassword () {
      try {
        const { data: passed } = await API.aws.checkPassword({
          password: this.password,
          isAdmin: true,
          userId: this.user.userId
        })

        if (passed) {
          this.$emit('confirm')
        } else {
          return this.$alert(this.$v('비밀번호가 틀렸습니다<br> 재확인 후 입력 바랍니다'), {
            dangerouslyUseHTMLString: true
          })
        }
      } catch (error) {
        console.error('@@ confirmPw : ', error)
      }
    }

  },
  data () {
    return {
      password: ''
    }
  }
}
</script>

<style lang="scss" scoped>
.password-label {
  display: block;
  margin-bottom: 20px;
}

.confirm-password-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 38px 20px;
}
</style>
<style lang="scss">
.confirm-password-modal {
  .login-input {
    > .el-input__inner {
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
                top: 26%;
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

</style>
