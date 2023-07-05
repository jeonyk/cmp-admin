<template>
  <article class="script-locked-wrapper">
    <div class="locker">
      <!-- 비밀번호를 입력하세요. -->
      <p>{{ $t('service.AMIImage.ALERT.010') }}</p>
      <el-input
        class="password"
        type="password"
        auto-complete="new-password"
        v-model="password"
        @input="() => failMessage !== undefined ? failMessage = undefined : null"
        @keyup.native.enter="confirm(password)"
      />
      <span
        class="warning"
        v-if="failMessage"
      >
        {{ failMessage }}
      </span>

      <button
        class="button"
        type="is-primary"
        @click="confirm(password)"
      >
        <!-- 확인 -->
        {{ $t('common.BTN.confirm') }}
      </button>
    </div>
  </article>
</template>

<script>
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ScriptLocked',
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    async confirm (password = this.password) {
      // 입력하지 않은경우
      if (!password) {
        this.failMessage = this.$v('비밀번호를 입력해주세요.')
        return
      }

      try {
        const { data: passed } = await API.aws.checkPassword({ password, isAdmin: true, userId: this.user.userId })
        this.failMessage = !passed ? this.$v('입력한 정보가 일치하지 않습니다.') : undefined

        return this.$emit('pass', passed)
      } catch (error) {
        console.error('@@ confirm : ', error)
        return this.$emit('pass', false)
      }
    }
  },
  data () {
    return {
      failMessage: false,
      password: undefined
    }
  }
}
</script>

<style lang="scss" scoped>
.script-locked-wrapper {
  height: 700px;
  border-radius: 6px;
  background-color: rgba(193, 188, 208, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;

  .locker {
    width: 290px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    p { width: 100%; }
    .password {
      margin: $gap-s 0;
    }
    .warning {
      display: block;
      color: $main-red;
      margin-bottom: 40px;
      width: 100%;
    }
    button {
      width: 80px;
    }
  }
}
</style>
