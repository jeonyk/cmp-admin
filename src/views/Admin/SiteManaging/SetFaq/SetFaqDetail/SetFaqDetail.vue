<!--
  * 파일명 : SetFaqDetail.vue
  * 파일 기능 : FAQ 상세 조회 페이지
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-09
  * License By Shinsegae I&C
  * 2021-02-09 Update: 어드민관리 차단 페이지 추가
 -->

<template>
  <section class="faq-detail">
    <article class="detail-contents">
      <div class="divided">
        <register-contents
          :title="$t('admin.NOTI.category')"
          :required="isModifying"
        >
          <el-select
            class="-selector"
            v-model="modifyData.faqType"
            :placeholder="$t('common.MODAL.selectCate')"
            :popper-append-to-body="false"
            v-if="isModifying"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <span v-else>{{ typeCheck(modifyData.faqType) }}</span>
        </register-contents>
        <!-- /. 카테고리 -->

        <register-contents
          :title="$t('admin.NOTI.post')"
          :required="isModifying"
        >
          <el-select
            class="-selector"
            v-model="modifyData.faqPosting"
            :placeholder="$t('admin.NOTI.isPostSelect')"
            :popper-append-to-body="false"
            v-if="isModifying"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="$t(item.keyPath) || item.label"
              :value="item.value"
            />
          </el-select>
          <span v-else>{{ modifyData.faqPosting ? $t('admin.NOTI.post') : $t('admin.NOTI.unPost') }}</span>
        </register-contents>
      <!-- /. 게시 -->
      </div>

      <register-contents
        :title="$t('admin.NOTI.que')"
        :required="isModifying"
      >
        <el-input
          v-if="isModifying"
          v-model="modifyData.faqQuestion"
          :placeholder="$t('admin.NOTI.enterQuestionTitle')"
        />
        <span v-else>{{ modifyData.faqQuestion }}</span>
      </register-contents>

      <register-contents
        :title="$t('admin.NOTI.answerContent')"
        :required="isModifying"
      >
        <cmp-editor
          :edit="isModifying"
          :set-content="uneditContents"
          @edited-contents="editContents"
        />
      </register-contents>
    </article>
    <!-- /. FAQ 영역 -->
    <!-- ///////////// -->
    <!-- testcommit -->

    <article
      v-if="!isModifying"
      class="button-area -center -form-bottom"
    >
      <button
        class="button"
        @click="deleteDetail"
        type="is-anti"
        size="is-large"
      >
        {{ $t('common.BTN.delete') }}
      </button>
      <button
        class="button"
        @click="routeTo({ name: 'faq-list' })"
        size="is-large"
      >
        {{ $t('common.BTN.list') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="isModifying = true"
        size="is-large"
      >
        {{ $t('common.BTN.modify') }}
      </button>
    </article>

    <div
      v-else
      class="button-area -center -form-bottom"
    >
      <button
        class="button"
        @click="cancelModifyData"
        type="is-anti"
        size="is-large"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        @click="confirmModifyData"
        type="is-primary"
        size="is-large"
      >
        {{ $v('수정 완료') }}
      </button>
    </div>
  </section>
</template>
<script>
import API, { CMPEditor } from '@sd-fe/cmp-core'

export default {
  name: 'SetFaqDetail',
  components: {
    'cmp-editor': CMPEditor
  },
  async created () {
    await this.getCodeList()
    await this.getFaqData()
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    async getCodeList () {
      try {
        const response = await API.config.getCodeList({ codeType: 'FAQ' })

        if (response) {
          const filters = response.map(resp => { return { value: resp.codeVal, label: resp.codeName } })
          this.categoryOptions = [...filters]
        }
      } catch (error) {
        console.error('@@ getCodeList :: ', error)
      }
    },
    async getFaqData () {
      const idx = await this.$route.params.faqIdx
      const response = await API.config.getFaqList({ faqIdx: idx })

      if (response.length) {
        this.modifyData = { ...response[0] }
        this.uneditContents = this.modifyData.faqAnswer
        const codes = this.categoryOptions.map(category => category.value)
        if (!codes.includes(this.modifyData.faqType)) this.modifyData.faqType = ''
      } else {
        this.$alert(this.$t('common.ALERT.IND.008'))
        return this.$router.push({ name: 'set-faq' })
      }
    },
    typeCheck (type) {
      const category = this.categoryOptions?.filter(cate => cate.value === type)[0]
      return category?.label || this.$t('admin.NOTI.unClassified')
    },
    editContents (data) {
      this.modifyData.faqAnswer = JSON.stringify(data)
    },
    validateRequiredData (data = this.modifyData) {
      const keys = Object.keys(data)
      const rawTextContent = document.querySelector('.ProseMirror').textContent.trim()
      const isEmpty = keys.filter(key => {
        if (
          data[key] === undefined ||
          (typeof data[key] === 'string' && data[key].trim() === '') ||
          (key === 'faqAnswer' && !rawTextContent)
        ) return true
      })

      for (const key of isEmpty) {
        const alertMsg = {
          faqType: this.$t('common.ALERT.IND.005'), // 카테고리를
          faqPosting: this.$t('common.ALERT.NOTICE.008'), // 게시 여부를
          faqQuestion: this.$t('common.ALERT.IND.004'), // 질문을
          faqAnswer: this.$t('common.ALERT.BASE.027') // 내용을
        }[key]

        this.$alert(alertMsg, '알림', { confirmButtonText: this.$t('common.BTN.confirm') }) // ~를 입력해주세요.
        return false
      }
      return true
    },
    // 수정 완료
    confirmModifyData (index, list) {
      const validator = this.validateRequiredData()
      // 내용을 등록하시겠습니까?
      if (validator) this.message(this.$t('common.CONFIRM.BASE.024'), () => this.modifyFaq())
    },
    async modifyFaq () {
      this.modifyData.isDelete = false
      this.modifyData.faqQuestion = this.modifyData.faqQuestion.trim()
      const response = await API.config.modifyFaq(this.modifyData)

      if (response) {
        return this.$alert(this.$t('common.ALERT.BASE.043'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.routeTo({ name: 'faq-list' })
        })
      }
    },
    // 수정 취소
    cancelModifyData () {
      this.message(this.$t('common.CONFIRM.BASE.011'), () => this.routeTo({ name: 'faq-list' }))
    },
    async deleteDetail () {
      this.message(this.$t('common.CONFIRM.BASE.032'), () => this.deleteFaq())
    },
    async deleteFaq () {
      const response = await API.config.deleteFaq({ faqIdx: this.$route.params.faqIdx })

      if (response) {
        return this.$alert(this.$t('common.ALERT.BASE.013'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => this.routeTo({ name: 'faq-list' })
        })
      }
    },
    message (message, action) {
      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(action)
        .catch(() => false)
    }
  },
  data () {
    return {
      params: undefined,
      modifyData: {
        faqType: '',
        faqPosting: '',
        faqQuestion: ''
      },
      isModifying: false,
      uneditContents: '',
      categoryOptions: [
        // { label: '회원', value: 'faq_user' },
        // { label: '결재', value: 'faq_billing' },
        // { label: '프로젝트', value: 'faq_project' },
        // { label: '기타', value: 'faq_etc' }
      ],
      statusOptions: [
        { label: '게시', value: true, keyPath: 'admin.NOTI.post' },
        { label: '비게시', value: false, keyPath: 'admin.NOTI.unPost' }
      ],

      selectedCate: '',
      selectedState: '',

      title: ''
    }
  }
}
</script>
<style lang="scss" scoped>
.faq-detail {
  .detail-contents {
    border-top: 1px solid $border-color;
  }
  .faq-contents {
    min-height: 400px;
  }
  .button-area {
    margin-top: $gap-m;
  }
}

.divided {
  display: flex;
  > * {
    flex: 0 0 50%;
  }
  .-selector {
    width: 200px;
  }
}
</style>
