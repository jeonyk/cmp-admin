<!--
  * 파일명 : SetFaqRegister.vue
  * 파일 기능 : FAQ 등록 상세 페이지
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2020-12-20
  * License By Shinsegae I&C
  * 2020-12-20 Update: faq 게시 여부
 -->

<template>
  <div class="faq-detail">
    <section class="detail-contents">
      <div class="divided">
        <register-contents
          :title="$t('admin.NOTI.category')"
          required
        >
          <el-select
            class="-selector"
            v-model="faqRegData.faqType"
            :placeholder="$t('common.MODAL.selectCate')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </register-contents>
        <!-- /. 카테고리 -->

        <register-contents
          :title="$t('admin.NOTI.post')"
          required
        >
          <el-select
            class="-selector"
            v-model="faqRegData.faqPosting"
            :placeholder="$t('admin.NOTI.isPostSelect')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="$t(item.keyPath) || item.label"
              :value="item.value"
            />
          </el-select>
        </register-contents>
      <!-- /. 게시 -->
      </div>

      <register-contents
        :title="$t('admin.NOTI.que')"
        required
      >
        <el-input
          v-model="faqRegData.faqQuestion"
          :placeholder="$t('admin.NOTI.enterQuestionTitle')"
        />
      </register-contents>

      <register-contents
        :title="$t('admin.NOTI.answerContent')"
        required
      >
        <cmp-editor @edited-contents="contents" />
      </register-contents>
    </section>

    <section class="button-area -center -form-bottom">
      <button
        class="button"
        type="is-anti"
        @click="routeTo({ name: 'faq-list' })"
        size="is-large"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirmRegisterData"
        size="is-large"
      >
        {{ $t('common.BTN.finEnroll') }}
      </button>
    </section>
  </div>
</template>
<script>
import API, { CMPEditor } from '@sd-fe/cmp-core'

export default {
  name: 'SetFaqRegister',
  components: {
    'cmp-editor': CMPEditor
  },
  created () {
    this.getCodeList()
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
    contents (json) {
      this.faqRegData.faqAnswer = JSON.stringify(json)
    },
    validateRequiredData (data = this.faqRegData) {
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
    confirmRegisterData (index, list) {
      const validator = this.validateRequiredData()
      // 내용을 등록하시겠습니까?
      if (validator) this.message(this.$t('common.CONFIRM.BASE.027'), () => this.postFaq())
    },
    async postFaq () {
      this.faqRegData.faqQuestion = this.faqRegData.faqQuestion.trim()
      const response = await API.config.postFaq(this.faqRegData)

      if (response) {
        this.$alert(this.$t('common.ALERT.BASE.034'))
        this.routeTo({ name: 'faq-list' })
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
      title: '',
      faqRegData: {
        createUser: 'User',
        faqType: '',
        faqPosting: undefined,
        faqQuestion: '',
        faqAnswer: '',
        updateUser: 'sample'
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.faq-detail {
  .detail-contents {
    border-top: 1px solid $border-color;
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
