<!--
  * 파일명 : ConfirmModal.vue
  * 파일 기능 : 사전협의 > Public 자원 생성 반려/승인 처리 모달
  * 작성자 : 조현
  * 최종 작성일 : 2022-03-07
  * License By Shinsegae I&C
 -->

<template>
  <el-dialog
    class="none-header"
    title=""
    :visible.sync="isActive"
    width="300px"
    top="35vh"
    @close="close"
  >
    <p
      class="message"
      v-html="state === 'approve' ? '작업을 승인 하시겠습니까 ?' : '주문취소를 진행하시겠습니까?<br> 주문취소 사유를 입력하세요.'"
    />

    <el-input
      v-model="note"
      type="textarea"
      :autosize="{ minRows: 5, maxRows: 2 }"
      placeholder="[필수] 주문취소 사유를 입력하세요."
      resize="none"
    />

    <div class="modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="close"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        :disabled="note.trim() === ''"
        class="button -modal-button"
        type="is-primary"
        @click="save"
      >
        <!-- 완료 -->
        {{ $v('완료') }}
      </button>
    </div>
  </el-dialog>
</template>
<script>

export default {
  name: 'ConfirmModal',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    state: { // 승인('approve') / 반려('reject')
      type: String,
      default: 'approve'
    }

  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal
    }
  },
  methods: {
    // [취소]
    close () {
      this.$emit('close')
    },
    // [완료]
    save () {
      this.$emit('save', {
        state: this.state,
        note: this.note
      })
    }
  },
  data () {
    return {
      isActive: this.active || false,
      note: ''

    }
  }
}
</script>
<style lang="scss" scoped>
.message {
  margin-bottom: $gap;
  text-align: center;
  line-height: 1.38;
}
</style>
