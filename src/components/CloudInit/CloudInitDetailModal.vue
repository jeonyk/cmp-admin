<template>
  <el-dialog
    :visible="active"
    :title="modalTitle"
    width="80%"
    @close="$emit('close')"
  >
    <div
      class="ci-detail tiny-scroll"
      v-loading="loading"
    >
      <cloud-init-detail
        ref="formRef"
        :mode="mode"
        :template-info="templateInfo"
        :contents="contents"
        :modal-active="active"
        @active-fetch-modal="onClickActiveFetchModal"
        @change-form-data="onChangeFormData"
      />
      <cloud-init-fetch-modal
        :active="isActiveFetchModal"
        @close="isActiveFetchModal = false"
        @apply="onFetchScript"
      />
    </div>
    <div class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        size="is-large"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        size="is-large"
        @click="onClickSaveScript"
      >
        {{ $v('저장') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import CloudInitFetchModal from './CloudInitFetchModal.vue'
import CloudInitDetail from './CloudInitDetail.vue'

/**
 * 2022/11/14
 * 두 개의 타입이 있을 수 있다.
 * 1. 관리 페이지에서 직접 추가하느 경우
 * - 제목, 설명을 직접 입력하고 불러오기는 없으나 리스트에서 복제 가능
 * 2. 타 페이지에서 Script를 불러오는 경우
 * - 제목, 설명 입력 란이 없으며 불러오기 버튼이 있고,
 * - 불러온 Script를 수정하거나 그대로 사용할 수 있음.
 */
export default {
  name: 'CloudInitDetailModal',
  props: {
    /**
     * 모달 모드
     * - create
     * - edit
     * - copy
     * - select
     */
    mode: {
      type: String,
      default: 'create'
    },
    active: {
      type: Boolean,
      default: false
    },
    templateInfo: {
      type: Object,
      default: () => ({})
    },
    /**
     * 생성중 여부
     */
    loading: {
      type: Boolean,
      default: false
    },
    contents: {
      type: String,
      default: ''
    },
    /**
     * 추가, 수정시 이름 중복 체크를 위한 리스트 데이터
     */
    gridList: {
      type: Array,
      default: () => ([])
    }
  },
  components: {
    CloudInitFetchModal,
    CloudInitDetail
  },
  computed: {
    modalTitle () {
      if (!this.active) return ''

      let base = 'Cloud Init Script '

      switch (this.mode) {
        case 'create':
          base += this.$v('추가')
          break
        case 'edit':
          base += this.$v('수정')
          break
        case 'copy':
          base += this.$v('복제')
          break
        case 'select':
          base += this.$v('선택')
          break
        default:
          break
      }

      return base
    }
  },
  methods: {
    onChangeFormData (form) {
      this.formData = form
    },
    onFetchScript (script) {
      if (!script) return

      if (this.$refs.formRef) {
        this.$refs.formRef.formData.code = script.initScript
      }
    },
    /**
     * 검증
     */
    validateScript (form) {
      if (!form.title) {
        this.$alert(this.$v('Cloud Init Script명을 입력해주세요.'))
        return false
      }
      if (this.gridList.find(item => item.initScriptName === form.title)) {
        this.$alert(this.$v('중복된 Cloud Init Script명이 존재합니다.'))
        return false
      }
      if (!form.description) {
        this.$alert(this.$v('설명을 입력해주세요.'))
        return false
      }
      if (!form.code) {
        this.$alert(this.$v('Cloud Init Script를 입력해주세요.'))
        return false
      }
      return true
    },
    /**
     * 저장 버튼 클릭 이벤트
     */
    onClickSaveScript () {
      if (this.mode === 'select') {
        if (!this.formData.code) {
          this.$alert(this.$v('스크립트를 입력해주세요.'))
          return false
        }
        this.$emit('save-select', this.formData.code)
        this.$emit('close')
        return
      } else if (!this.validateScript(this.formData)) return

      const emitForm = {
        title: this.formData.title,
        description: this.formData.description,
        content: this.formData.code
      }
      if (this.mode === 'edit') {
        emitForm.userInitScriptIdx = this.templateInfo.userInitScriptIdx
      }

      this.$confirm(this.$v('입력한 내용으로 저장하시겠습니까?'))
        .then(() => {
          this.$emit('create', emitForm, this.mode || 'create')
        })
        .catch(() => {})
    },
    onClickActiveFetchModal () {
      this.isActiveFetchModal = true
    }
  },
  data: root => ({
    formData: {
      title: '',
      description: '',
      code: ''
    },
    isActiveFetchModal: false
  })
}
</script>

<style lang="scss" scoped>
.ci-detail {
  max-height: 800px;
  overflow-y: auto;
}
</style>
