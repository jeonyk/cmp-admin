<template>
  <div class="connect-from">
    <div class="modal-form">
      <slot name="beforeSlot" />
      <register-contents
        :title="$t('admin.PREF.authInfo')"
        :required="!disabled"
      >
        <template>
          <div class="input-form">
            <span class="input">ID: </span>
            <el-input
              v-model="connectTest.data.id"
              class="input-text"
              :placeholder="$v('아이디')"
              :disabled="connectTest.data.isSuccess || disabled"
            />
          </div>
          <div class="input-form password">
            <span class="input">{{ $v('비밀번호') }}: </span>
            <el-input
              v-model="connectTest.data.password"
              class="input-text"
              :disabled="disabled || otpSuccess"
              v-if="modalStatus.type === 'CREATE' || otpSuccess"
              :placeholder="$v('비밀번호 입력')"
              show-password
              ref="otpPasswordInput"
            />
            <button
              v-else
              @click="$emit('openModalOTP')"
              class="button -confirm password-btn"
              type="is-primary"
              :disabled="disabled"
            >
              {{ $v('비밀번호 보기') }}
            </button>
          </div>
        </template>
      </register-contents>
      <!-- 인증 정보 -->

      <register-contents
        title="Master URL"
        :required="!disabled"
      >
        <el-input
          v-model="connectTest.data.masterUrl"
          class="input-text"
          :placeholder="$t('admin.PREF.enterUrl')"
          :disabled="connectTest.isSuccess || disabled"
        />
      </register-contents>
      <!-- URL -->

      <span
        v-if="connectTest.isSuccess || connectTest.isConnecting"
        :class="['block-before-test', { 'is-connecting':connectTest.isConnecting }]"
      >
        {{ !connectTest.isConnecting ? $v('연결 테스트에 성공하였습니다.') : '' }}
      </span>
      <!-- /. 테스트 완료 문구 -->
      <slot name="afterSlot" />
    </div>

    <button
      :class="['test-btn', 'button', { 'confirm' : connectTest.isSuccess }]"
      :type="connectTest.isSuccess ? 'is-success' : 'is-primary'"
      @click="handleClickConnectionTest"
      :disabled="(disabled || connectTest.isSuccess || connectTest.isConnecting ||!hasValues)? true : false"
    >
      <i class="icon">
        <i
          v-if="connectTest.isConnecting"
          class="el-icon-loading"
        />
        <check-icon
          v-if="connectTest.isSuccess"
          class="check-icon"
        />
      </i>
      <!-- 테스트 (테스트 전 / 실패시) -->
      {{ connectTest.isSuccess?$v('연결 테스트 성공'):$v('연결 테스트') }}
    </button>
    <!-- 테스트 -->
    <slot name="otpTest" />
  </div>
</template>

<script>
import CheckIcon from '@/components/Icons/CheckIcon.vue'
import { cloneDeep } from 'lodash'
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false
    },
    optionalData: {
      type: Object,
      default () {
        return null
      }
    },
    otpSuccess: {
      type: Boolean,
      default () {
        return false
      }
    },
    requireData: {
      type: Object,
      default () {
        return null
      }
    },
    // 모달 상태 (자식 컴포넌트)
    modalStatus: {
      type: Object,
      default () {
        return {
          type: 'CREATE',
          isOpen: false
        }
      }

    },
    testCallbackApi: {
      type: Function,
      required: true,
      default: null
    }
  },
  components: {
    CheckIcon
  },
  watch: {
    'modalStatus.isOpen': {
      handler (val) {
        if (val && this.modalStatus.type === 'UPDATE') {
          this.connectTest.data = cloneDeep(this.requireData) // id, password, masterUrl
        } else {
          this.initFormData()
        }
      }
    },
    disabled (newVal, val) {
      if (newVal) { this.connectTest.data = this.initialData }
    },
    otpSuccess: {
      handler (val) {
        if (val && this.modalStatus.type === 'UPDATE') {
          this.connectTest.data = cloneDeep(this.requireData) // id, password, masterUrl
        }
      }
    }
  },
  created () {
    this.initFormData()
    this.connectTest.data = cloneDeep(this.requireData) // id, password, masterUrl
  },
  computed: {
    hasValues () {
      // 옵션으로 받은 키값 + 기본 (id, pw, url)이 전부 있으면 True
      const optionKeyVals = Object.entries(this.optionalData)
      for (let i = 0; i < optionKeyVals.length; i++) {
        const [, val] = optionKeyVals[i]
        if (val === undefined || val === null || val === '') return false
      }
      if (!this.connectTest.data.id || !this.connectTest.data.password || !this.connectTest.data.masterUrl) return false
      return true
    }
  },
  methods: {
    initFormData () {
      this.connectTest.data = cloneDeep(this.initialData)
    },
    async handleClickConnectionTest () {
      // 2023.02.14 네트워크 장비 연결 테스트에서 네트워크 타입을 Payload로 받지않습니다.
      const payload = {
        ...this.optionalData,
        ...this.connectTest.data
      }
      if (this.connectTest.data.masterUrl && !this.checkUrl(this.connectTest.data.masterUrl)) {
        this.$alert(this.$t('common.ALERT.SECURITY.034'))
        return false
      }
      try {
        const isConfirmed = await this.$confirm(this.$v('테스트에 최대 30초가 소요될 수 있습니다.<br>진행하시겠습니까?'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel'),
          dangerouslyUseHTMLString: true
        }).then(() => true).catch(() => false)

        if (isConfirmed) {
          this.connectTest.isConnecting = true
          const result = await this.testCallbackApi(payload)
          if (!result) throw new Error()
          if (result) {
            this.connectTest.isSuccess = result
            this.$emit('connect', this.connectTest)
            const message = this.$v('연결 테스트를 성공하였습니다.')
            this.$alert(message)
          }
        }
      } catch (error) {
        const message = this.$v('연결 테스트에 실패하였습니다.')
        this.$alert(`${message} </br> <span style="color: gray;">${error}</span>`, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          dangerouslyUseHTMLString: true
        })
      } finally {
        this.connectTest.isConnecting = false
      }
    },
    // URL 값이 올바른지 검사합니다.
    checkUrl: (url) => {
      const urlRegExp = /(http(s)?:\/\/)([a-z0-9\w]+\.*)+[a-z0-9]{2,4}/gi
      return urlRegExp.test(url)
    }

  },
  data () {
    return {
      // OTP Test
      otpTest: {
        isSuccess: false,
        isOpenModal: false,
        data: {
          testNumber: ''
        }
      },
      // 테스트 상태 및 데이터
      connectTest: {
        isSuccess: false,
        isConnecting: false,
        data: null
      },
      initialData: {
        id: null,
        password: null,
        hashPassword: null,
        masterUrl: null
      }

    }
  }
}
</script>

<style lang="scss" scoped>
 .test-btn {
    width: 100%;
    margin-top:4px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;

      &.confirm {
        background-color: $success;
        &:disabled {
          background: $success;
          opacity: 1;
        }
      }
    .icon {
      margin-right: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 15px;
      height: 15px;
      .check-icon {
        height: 12px;
      }
    }
  }
  .input-form {
  display: flex;
  align-items: center;
  position: relative;
    .input {
      min-width: 100px;
    }
  }
.modal-form{
  border-top: 1px solid $border-color;
  position: relative;
  .password-btn {
    width: 100%;
  }
  .block-before-test {
    background: rgba(0, 0, 0, 0.8);
    position: absolute;
    top: 0; left: 0; bottom: 0; right: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $light-gray;
    transition: background 0.2s ease-in-out;
    &.is-connecting {
      background: rgba(0, 0, 0, 0.2);
    }
  }
}
.password {
  margin-top: 10px;
}
</style>
