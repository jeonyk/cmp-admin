<!--
  * 파일명 : ConfCommonProjectApplyModal.vue
  * 파일 기능 : 사전협의 > 공통 프로젝트 생성 반려/승인 처리 모달
  * 작성자 : 김예담
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
      v-html="$t('task.PRIOR.DETAIL.createCommonProject', {
        projectType: isCommonProject ? $v('공통 프로젝트') : $v('AWS 프로젝트'),
        state: state === 'approve' ? $t('common.BTN.TASK.ack') : $t('task.STATE.reject')
      })"
    />

    <el-input
      v-model="note"
      type="textarea"
      :autosize="{ minRows: 5, maxRows: 6 }"
      :placeholder="$t('common.REGCON.remark')"
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
        class="button -modal-button"
        type="is-primary"
        @click="save"
      >
        <!-- 완료 -->
        {{ $t('common.BTN.complete') }}
      </button>
    </div>
  </el-dialog>
</template>
<script>

export default {
  name: 'ConfCommonProjectApplyModal',
  props: {
    active: {
      type: Boolean,
      default: false
    },
    state: { // 승인('approve') / 반려('reject')
      type: String,
      default: 'approve'
    },
    projectType: {
      type: String,
      validator: function (value) {
        return ['common', 'aws'].indexOf(value) !== -1
      },
      default: 'common'
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
  computed: {
    isCommonProject () {
      return this.projectType === 'common'
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
