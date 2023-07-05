<!--
  * 파일명 : SetFaqModify.vue
  * 파일 기능 : FAQ 수정 기능
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-12-20
  * License By Shinsegae I&C
  * 2020-12-20 fix: 전반적 css 수정
 -->

<template>
  <div class="faq-detail">
    <section class="detail-contents">
      <div class="divided">
        <register-contents
          title="카테고리"
          required
        >
          <template>
            <el-select
              v-model="modifiedData.cate"
              placeholder="카테고리 선택"
              :popper-append-to-body="false"
            >
              <el-option
                v-for="item in categoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </register-contents>
        <!-- /. 카테고리 -->

        <register-contents
          title="카테고리"
          required
        >
          <template>
            <el-select
              v-model="modifiedData.cate"
              placeholder="카테고리 선택"
              :popper-append-to-body="false"
            >
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </register-contents>
      <!-- /. 카테고리 -->
      </div>

      <register-contents
        title="질문"
        required
      >
        <template>
          <el-input
            v-model="modifiedData.title"
            placeholder="질문 제목을 입력하세요."
          />
        </template>
      </register-contents>
      <register-contents
        title="답변 내용"
        required
      >
        <template>
          <cmp-editor />
        </template>
      </register-contents>
    </section>

    <section class="big-button-area">
      <button
        class="button"
        @click="$router.push({ name: 'faq-list' })"
        type="is-anti"
      >
        취소
      </button>
      <button
        class="button"
        @click="confirmModifyData"
        type="is-primary"
      >
        수정 완료
      </button>
    </section>

    <!-- {{ $route.params }} <br>
    {{ modifiedData }} -->
  </div>
</template>
<script>
import { CMPEditor } from '@sd-fe/cmp-core'

export default {
  name: 'SetFaqDetailModify',
  components: {
    'cmp-editor': CMPEditor
  },
  created () {
    this.modifiedData = { ...this.$route.params }
  },
  methods: {
    routeTo (to) {
      this.$router.push(to)
    },
    confirmModifyData (index, list) {
      this.$confirm(this.$t('common.CONFIRM.BASE.024'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.034'))
        this.routeTo({ name: 'faq-list' })
      }).catch(() => { return false })
    },
    cancelModifyData () {
      this.$confirm(this.$t('common.CONFIRM.BASE.011'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.routeTo({ name: 'faq-list' })
      }).catch(() => { return false })
    }
  },
  data () {
    return {
      categoryOptions: [
        { label: '신규', value: 'new' },
        { label: '점검', value: 'check' },
        { label: '안내', value: 'notify' },
        { label: '장애', value: 'disorder' }
      ],
      statusOptions: [
        { label: '게시', value: 'exposed' },
        { label: '비게시', value: 'unexposed' }
      ],
      modifiedData: {}
    }
  }
}
</script>
<style lang="scss" scoped>
.faq-detail {
  .detail-contents {
    border-top: 1px solid $border-color;
    border-bottom: 1px solid $dark-slate;
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
}
</style>
