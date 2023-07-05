<template>
  <div
    v-loading="loading"
    class="document-template-detail"
  >
    <p
      class="-noti"
      v-html="$v('* {{ data-key }} 가 포함된 텍스트 영역 편집시, 실제 데이터에 연결이 불가능하므로 편집시 주의가 필요합니다.')"
    />

    <article class="document-template-setting">
      <register-contents
        :title="$v('템플릿명')"
        required
      >
        <el-input
          v-model="values.name"
          :placeholder="$v('템플릿명을 입력하세요.')"
        />
      </register-contents>
    </article>

    <section class="template-editor-wrapper">
      <!-- <img alt="Vue logo" src="./assets/logo.png"> -->
      <editor
        ref="editor"
        api-key="no-api-key"
        :init="option"
        output-format="html"
        v-model="values.text"
        :disabled="false"
        @onChange="change"
        @on-render="setup"
      />

      <!-- @onSelectionChange="change" -->
      <!-- model-events="change" -->
      <!-- {{ values.text }} -->
      <!-- /. 템플릿 작성 -->

      <div class="template-editor-content">
        <h2>{{ $v('시스템 템플릿') }}</h2>
        <ul class="template-buttons tiny-scroll">
          <li
            v-for="template in systemTemplates"
            :key="template.function"
            @click="callTemplate(template)"
          >
            <strong>{{ template.label }}</strong>
          </li>
        </ul>
      </div>
      <!-- /. 시스템 템플릿 -->
    </section>

    <div class="button-area">
      <button
        class="button"
        type="is-anti"
        size="is-large"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        size="is-large"
        @click="save"
      >
        {{ $v('저장') }}
      </button>
    </div>
  </div>
</template>

<script>
import SystemTemplateScript from '../SystemTemplate.script'
import API, { TinyEditor } from '@sd-fe/cmp-core'

export default {
  name: 'DocumentTemplateDetail',
  mixins: [SystemTemplateScript],
  props: {
    data: {
      type: Object,
      default: () => null
    }
  },
  components: {
    editor: TinyEditor
  },
  mounted () {
    const query = this.$route?.query

    setTimeout(() => {
      this.getDocTemplateDetail(query)
    }, 300)
  },
  watch: {
    data (data) {
      if (!data) return

      this.value = JSON.parse(JSON.stringify(data))
    },
    values: {
      deep: true,
      handler (value) {
      }
    }
  },
  methods: {
    /*
      ## 해당 컴포넌트가 사용되는 곳?
       - [어드민관리 > 환경설정 > 통합업무 > 보고서 템플릿 등록/수정]
    */

    // ============================================
    // ============================================
    // ============ [모든 페이지 공통 사용] ============
    // ============================================
    // ============================================

    /**
     * [저장] 버튼 클릭시 발생하는 이벤트
     */
    async save () {
      // 필수값 확인
      const conditions = [
        { condition: this.values.name, message: this.$v('템플릿명을 입력해주세요.') },
        { condition: !!this.editor.getContent(), message: this.$v('템플릿 내용을 입력해주세요.') }
      ]

      const validator = conditions.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })

      if (!validator) return

      // 저장
      return this.$confirm(this.$v('해당 내용으로 결재 템플릿을 저장하시겠습니까?'))
        .then(this.createDocTemplates) // [환경설정 > 보고서 템플릿 작성]
        .catch(() => false)
    },

    /**
     * [템플릿 상세] 인 경우 초기에 templateIdx 를 확인하여 상세 정보를 가져옵니다.
     * 새로 등록하는 경우라면, templateIdx가 없으므로 동작하지 않습니다.
     * @param {Object|undefined} templateIdx 보고서 템플릿 index
     */
    async getDocTemplateDetail ({ id: templateIdx }) {
      if (!templateIdx) return

      try {
        this.loading = true
        const { title, templateJson } = await API.work_v3.getDocTemplateDetail(templateIdx)

        this.values = { name: title }
        this.insertContent(templateJson)
      } catch (error) {
        console.error('@@ getDocTemplateDetail', error)
        this.$alert(this.$v('상세 정보를 가져오는데 문제가 발생하였습니다.'))
      } finally {
        this.loading = false
      }
    },

    /**
     * [템플릿 상세] 보고서 템플릿 저장
     * 저장 후 목록으로 돌아갑니다.
     * @return
     */
    async createDocTemplates () {
      try {
        const { roleIdx, mode, cloudType: cloud, docType, id: templateIdx } = this.$route.query

        const payload = {
          title: this.values.name,
          templateJson: this.editor.getContent(),
          category: { roleIdx, mode, cloud, docType }
        }

        // 수정일때 / 생성일때
        if (templateIdx) await API.work_v3.updateDocTemplate({ templateIdx, payload })
        else await API.work_v3.createDocTemplates(payload)

        return this.$alert('결재 템플릿 저장이 완료되었습니다.', {
          callback: () => this.$router.push({ name: 'integrated-set-template' })
        })
      } catch (error) {
        console.error('@@ createDocTemplates', error)

        const message = {
          1: '제목명이 중복되어 등록할 수 없습니다.',
          ODR0000: '서비스 정보가 미선택되었습니다.'
        }[error.response.data.code]

        return this.$alert(message)
      }
    },

    // =========================================
    // =========================================
    // ============ tinyMCE 관련 설정 ============
    // =========================================
    // =========================================

    /**
     * 제일 초기 화면 로드시, tinyMCE 로드 및 기본 데이터 세팅
     */
    setup (editor) {
      this.loading = true
      this.editor = editor

      const templateIdx = this.$route?.query.id
      if (templateIdx) return

      setTimeout(() => {
        this.loading = false
      }, 1000)
    },

    /**
     * tinyMCE Text Change Event
     * @param {String} text HTML 형식으로 저장
     */
    change (text) {
      // console.log(this.values.text)
      // activeEditor.selection.getNode().nodeName
    },

    /**
     * editor 에 컨텐츠를 삽입합니다.
     * @param {String} content
     */
    insertContent (content) {
      return this.editor.insertContent(content)
    },

    // callback (cb, value, meta) {
    callback (cb) {
      const input = document.createElement('input')
      input.setAttribute('type', 'file')
      input.setAttribute('accept', 'image/*')

      input.addEventListener('change', (e) => {
        const file = e.target.files[0]

        const reader = new FileReader()
        reader.addEventListener('load', () => {
          /*
            Note: Now we need to register the blob in TinyMCEs image blob
            registry. In the next release this part hopefully won't be
            necessary, as we are looking to handle it internally.
          */
          const id = 'blobid' + (new Date()).getTime()
          const blobCache = this.editor.editorUpload.blobCache
          const base64 = reader.result.split(',')[1]
          const blobInfo = blobCache.create(id, file, base64)
          blobCache.add(blobInfo)

          /* call the callback and populate the Title field with the file name */
          cb(blobInfo.blobUri(), { title: file.name })
        })
        reader.readAsDataURL(file)
      })

      input.click()
    }
  },
  data: root => ({
    loading: false,
    values: {},
    text: undefined,
    editor: null
  })
}
</script>

<style lang="scss" scoped>
.document-template-detail {
  .-noti {
    margin-bottom: $gap;
    color: $main-blue;
  }
  .document-template-setting {
    margin-bottom: $gap;
    border-top: 1px solid $dark-slate;
  }

  .template-editor {
    &-wrapper {
      display: grid;
      grid-template-columns: auto 300px;
      grid-template-rows: 555px;
      column-gap: 15px;
      box-sizing: border-box;
    }

    &-content {
      box-sizing: border-box;
      height: 555px;
      background-color: $dark-navy;
      border-radius: $radius-m;
      padding: $gap $gap-s $gap $gap;

      h2 {
        font-size: 18px;
        padding-bottom: $gap;
        margin-right: 15px;
        border-bottom: 1px solid $dark-slate;
      }
    }

  }
  .template-buttons {
    height: 475px;
    box-sizing: border-box;
    overflow-y: auto;
    border-bottom: 1px solid $dark-slate;

    > li {
      display: flex;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      background-color: transparent;
      border: 1px solid transparent;
      border-bottom: 1px solid $dark-slate;
      color: $white;
      height: 80px;
      box-sizing: border-box;
      cursor: pointer;
      padding: $gap;
      transition: .2s ease all;

      &:hover {
        background: rgba(63, 85, 187, 0.3);
        border: 2px solid #3F55BB;
        border-radius: 5px;
      }

      &:last-child {
        border: none;
        &:hover { border: 2px solid #3F55BB; }
      }

      strong {
        font-weight: normal;
        font-size: 14px;
        line-height: 22px;
        margin-bottom: 5px;
      }
      span { color: $input-placeholder }
    }
  }

  .button-area {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: $gap-m;
  }
}
</style>
