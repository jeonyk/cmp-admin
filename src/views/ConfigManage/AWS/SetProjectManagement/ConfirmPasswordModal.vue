<template>
  <el-dialog
    :visible="isVisible"
    @close="$emit('close')"
    title="비밀번호 확인"
    width="350px"
  >
    <div class="confirm-password-modal">
      <label
        class="password-label"
        for="confirm-password"
      >현재 로그인된 계정의 비밀번호를 입력해주세요.</label>
      <el-input
        id="confirm-password"
        v-model="password"
        placeholder="비밀번호를 입력해주세요."
        type="password"
      />
    </div>
    <div class="button-area">
      <button
        class="button"
        type="is-anti"
        @click="$emit('close')"
      >
        취소
      </button>
      <button
        @click="$emit('confirm-password', password)"
        class="button"
        type="is-primary"
        :disabled="!checkPasswordLength"
      >
        확인
      </button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    checkPasswordLength () {
      if (this.password !== '') {
        return true
      }
      return false
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
  // text-align: center;
  display: block;
  margin-bottom: 20px;
  cursor:pointer;
}

.button-area {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}
</style>

<style lang="scss">
.confirm-password-modal {
    .el-input__inner {
      height: 44px !important;
      background: #2a2d44 !important;
      &:focus {
        background: #fff !important;
      }
    }

}
</style>
