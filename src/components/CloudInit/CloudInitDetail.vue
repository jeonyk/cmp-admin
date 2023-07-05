<template>
  <vertical-table
    v-loading="isLoadingGetDetail"
    class="table"
    :columns="columns"
    :data="formData"
    :title-width-px="250"
  >
    <template #fetchTemplate>
      <button
        class="button"
        type="is-primary"
        @click="onClickActiveFetchModal"
      >
        {{ $v('Script 불러오기') }}
      </button>
    </template>
    <template #title>
      <el-input
        v-model="formData.title"
        placeholder="스크립트명을 입력하세요."
      />
    </template>
    <template #description>
      <el-input
        v-model="formData.description"
        placeholder="설명을 입력하세요."
      />
    </template>
    <template #macro>
      <macro-tab
        ref="macroTab"
        :network-cate-idx="selectedNetworkCategoryIdx"
        with-tree
        @select-tree="onSelectTreeItem"
      />
    </template>
    <template #codeEditor>
      <cmp-code-editor
        :values="formData.code"
        @input="val => formData.code = val"
        @ready="onReadyCodeEditor"
      />
    </template>
  </vertical-table>
</template>

<script>
import API, { CMPCodeEditor, MacroTab } from '@sd-fe/cmp-core'

const DEFAULT_COLUMNS = (root) => {
  return [
    { binding: 'fetchTemplate', header: root.$v('Script 불러오기') },
    // { binding: 'macro', header: root.$v('매크로') },
    { binding: 'title', header: root.$v('Cloud Init Script명'), required: true },
    { binding: 'description', header: root.$v('설명'), required: true },
    { binding: 'macro', header: root.$v('매크로 / 네트워크 환경변수') },
    { binding: 'codeEditor', header: 'Cloud Init Script', required: true }
  ]
}

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
  name: 'CloudInitDetail',
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
    modalActive: {
      type: Boolean,
      default: false
    },
    templateInfo: {
      type: Object,
      default: () => ({})
    },
    contents: {
      type: String,
      default: ''
    }
  },
  watch: {
    modalActive: {
      immediate: true,
      handler (active) {
        if (!active) {
          this.selectedNetworkCategoryIdx = null

          const macroTabRef = this.$refs.macroTab
          if (macroTabRef) {
            macroTabRef.initSelectedTab()
            macroTabRef.initTree()
          }
        } else {
          this.formData = {
            title: '',
            description: '',
            code: ''
          }
          this.setColumns()
          this.setFormData()
          if (this.mode === 'select' && this.contents) {
            this.formData.code = this.contents
          }
        }
      }
    },
    formData: {
      deep: true,
      immediate: true,
      handler (form) {
        this.$emit('change-form-data', form)
      }
    }
  },
  components: {
    'cmp-code-editor': CMPCodeEditor,
    MacroTab
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
    /**
     * 매크로 > 네트워크 환경변수 네트워크 카테고리 트리
     * 아이템 선택 이벤트
     */
    onSelectTreeItem (categoryIdx) {
      if (!categoryIdx) this.selectedNetworkCategoryIdx = null
      else this.selectedNetworkCategoryIdx = categoryIdx
    },
    /**
     * 변수에 색칠놀이
     * {HOSTNAME} - O
     * {HOSTNAME
     * } - X (new line 문자를 stream 에서 읽을 수 없음)
     */
    onReadyCodeEditor (cm, setValue) {
      cm.doc.mode = {
        name: 'custom-mode',
        token: function (stream) {
          if (stream.match('{')) {
            if (!stream.eatWhile(/\w/)) {
              return null
            }

            if (stream.match('}')) {
              return 'custom-mode'
            }
          }

          while (stream.next() && !stream.match('{', false)) {
            continue
          }

          return null
        }
      }

      if (setValue) {
        cm.doc.setValue(setValue)
      }
    },
    /**
     * 모드에 따라 폼 데이터 채우기
     */
    async setFormData () {
      if (!['edit', 'copy'].includes(this.mode)) return
      if (!this.templateInfo) return

      try {
        this.isLoadingGetDetail = true
        const { data } = await API.script.getScriptDetail(this.templateInfo.userInitScriptIdx)
        this.formData = {
          title: data.initScriptName,
          description: data.description,
          code: data.initScript || ''
        }
        if (this.mode === 'copy') {
          this.formData.title = '[복제] ' + this.formData.title
        }
      } catch (error) {
        this.$alert(this.$v('스크립트 상세 조회에 실패하였습니다.'))
      } finally {
        this.isLoadingGetDetail = false
      }
    },
    onClickActiveFetchModal () {
      this.$emit('active-fetch-modal')
    },
    /**
     * Columns을 Type에 맞게 조정한다.
     */
    setColumns () {
      this.columns = DEFAULT_COLUMNS(this)

      if (this.mode === 'select') {
        this.columns.splice(1, 2)
      } else {
        this.columns.splice(0, 1)
      }
    }
  },
  data: root => ({
    columns: DEFAULT_COLUMNS(root),
    formData: {
      title: '',
      description: '',
      code: ''
    },
    isLoadingGetDetail: false,
    selectedNetworkCategoryIdx: null
  })
}
</script>

<style lang="scss" scoped>
.table {
  .cmp-code-editor {
    min-height: 500px;
    padding-bottom: 15px;

    &::v-deep {
      .CodeMirror-scroll {
        max-height: 500px;
      }

      .cm-custom-mode {
        color: $main-red;
      }
    }
  }

  &::v-deep {
    .register-contents {
      .contents {
        overflow: hidden;
      }
    }
  }
}
</style>
