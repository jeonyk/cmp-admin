<template>
  <el-dialog
    :title="$v('보고서 작성')"
    :visible="active"
    width="400px"
    @close="$emit('close')"
  >
    <div class="document-wrapper">
      <div class="document-lists">
        <span
          class="document-contents -empty"
          v-if="!documents.length"
        >
          {{ $v('데이터가 없습니다.') }}
        </span>

        <ul
          v-else
          class="document-contents"
        >
          <li
            v-for="document, idx in documents"
            :key="idx"
            :class="{ '-active': (doc && document.idx === doc.idx) }"
            @click="doc = document"
          >
            <a>
              <strong>{{ document.title }}</strong>
              <span>{{ document.updatedTime | date('YYYY.MM.DD') }}</span>
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="modal-button-area -center">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        :disabled="!doc"
        @click="register(doc)"
      >
        {{ $v('등록') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>

import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  inject: ['$orderType', '$field_V3'],
  name: 'OrderDocument',
  props: {
    active: { // 모달 on/off
      type: Boolean,
      default: false
    },
    data: { // 모달 데이터 (반드시 필요한 값들만 충족해도 됨)
      type: [Object, Array],
      default: () => []
      // required: true
      /*
      {
        orderNo: String,
        roleIdx: Number,
        cloudType: 'PRIVATE|PUBLIC',
        orderType: 'NEW(신규)|CHANGE(변경)|DELETE(삭제)'
        setting: {
          planDocument: Object|undefined (등록된 작업계획서 - 사전협의)
          reportDocument: Object|undefined (등록된 완료보고서 - 할일)
        },
      }
      */
    }
  },
  watch: {
    active (active) {
      if (active) this.getDocTemplates()
      else {
        this.documents = []
        this.doc = null
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
  },
  methods: {
    /*
      작업계획서 :: 사전협의 → 보고서 수정 → 보고서 설정 페이지로 이동
      작업완료보고서 :: 할일 → 보고서 수정 → 보고서 작업신청 페이지로 이동

      * 페이지 내에서 등록된 양식이 없고 새로 추가되는 경우 (신규)
        [보고서 추가] > [새 보고서 문서]
        [보고서 추가] > [양식 불러오기]
      * 페이지 내에서 이미 관리자가 작성해둔 보고서가 있는 경우 (수정)
        [보고서 수정] > [최근 작성된 보고서명]
      * 페이지 내에서 작성해둔 보고서가 있으나 다른 양식을 추가해서 새로 작성하는 경우 (수정)
    */

    /**
     * DB에 저장된 모든 템플릿 가져오기
     * 개수가 많지 않아 내부에서 분류 및 검색
     */
    async getDocTemplates () {
      try {
        this.loading = true

        // 사전협의 vs 할일 인지 확인
        this.step = this.$route.name.split('-')[0]

        console.log('%c$$ this.data : ', 'background-color: skyblue; color: blue', this.data)

        const approvalDocument = this.getApprovalDocument(this.data) // 보고서 등록 여부 확인

        const response = await API.work_v3.getDocTemplates()
        const templates = response.map(template => {
          template.isNew = approvalDocument ? undefined : true // 신규인데 템플릿인 경우는 true
          return template
        })

        this.documents = this.filterWorkflowDocuments({ data: this.data, templates, approvalDocument })
        // console.log(this.documents)
      } catch (error) {
        console.error('@@ getDocTemplates', error)
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * 보고서 등록 여부 판별
     */
    getApprovalDocument ({ orderType, setting }) {
      // [사전협의] vs [할일] 에 따라 보고서 형태 다르게 저장
      const { planDocument, reportDocument } = setting
      const isUrgent = orderType === 'URGENT' // [긴급] 여부 확인

      // 이미 등록된 보고서가 있다면 페이지를 비교해서 데이터를 넣어주는데,
      const approvalDocument = (planDocument || reportDocument)
        ? (
          // [긴급] 일 경우는 [사후결재보고서]
          isUrgent ? reportDocument
            : {
              // [일반] 일 경우는 [사전협의 - 작업계획서] vs [할일 - 작업완료보고서]
              conference: planDocument ? { ...planDocument } : undefined,
              todo: reportDocument ? { ...reportDocument } : undefined
            }[this.step]
        )
        : undefined // 등록된 보고서 없으면 undefined

      return approvalDocument
    },

    /**
     * 워크플로우에 저장된 보고서 목록 필터링 해서 저장
     *
     * @param {Object} data this.data
     * @param {Array} templates
     * @param {Object|undefined} approvalDocument
     */
    filterWorkflowDocuments ({ data, templates, approvalDocument }) {
      const roleIdx = Number(data.roleIdx)
      const orderType = data.orderType
      const cloudType = data.cloudType

      const isUrgent = orderType === 'URGENT'
      const docType = isUrgent ? 'AA_REPORT' : { conference: 'PLAN', todo: 'REPORT' }[this.step]

      const result = templates.filter(template => {
        const { roleIdx: idx, cloud, mode, docType: type } = template.category

        return (
          idx === roleIdx &&
          cloud === cloudType &&
          mode === orderType &&
          type === docType // REPORT(사전협의-작업계획서), PLAN(할일-작업완료보고서), AA_REPORT(긴급-사후완료보고서)
        )
      })

      // console.log(roleIdx, orderType, cloudType, docType)
      // console.log(docType, templates)

      // 보고서 형식 클론
      const category = { roleIdx, cloud: cloudType, mode: orderType, docType }

      // [보고서 작성] 신규 작성일 경우
      const newDocument = {
        title: this.$v('새 보고서 문서'),
        isNew: true,
        idx: -1, // 고유값 임의 입력
        category: { ...category }
      }

      // [보고서 수정] 기존에 보고서가 등록되어있는 경우
      const updateDocument = {
        title: approvalDocument ? approvalDocument.title : undefined,
        isNew: false,
        idx: -1, // 고유값 임의 입력
        category: { ...category }
      }

      // (신규/수정) 상황에 따라 형식 변경
      const unshift = approvalDocument ? updateDocument : newDocument
      result.unshift(unshift)

      return result
    },

    /**
     * [등록] 버튼 클릭시 [보고서 작성] 상세 페이지로 이동
     * @param {Object} doc isNew (신규등록)
     * @param {Boolean|undefined} isNew 신규등록 true, 수정 false
     * @param {Number} idx 저장된 기본 템플릿 idx
     */
    register ({ isNew, category, idx: templateIdx } = this.doc) {
      const { setting, orderNo, roleIdx, cloudType } = this.data

      const query = {
        workState: setting.workState, // 현재 탭의 상태
        roleIdx: Number(roleIdx),
        orderType: category.mode,
        cloudType,
        templateIdx,
        isNew
      }

      return this.$router.push(
        {
          name: 'task-document',
          params: { step: this.step, orderNo },
          query
        }
      )
    }
  },
  data: () => ({
    step: undefined,
    doc: null,
    documents: []
  })
}
</script>

<style lang="scss" scoped>
.document {
  &-wrapper {
    position: relative;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 0; right: 16px;
      height: 1px;
      background-color: $purple-gray;
      z-index: 1;
    }

    &::before { top: 0; }
    &::after { bottom: 0; }
  }
  &-lists {
    height: 390px;
    box-sizing: border-box;
    position: relative;
    padding-right: $gap-s;
    overflow-y: auto;
  }

  &-contents {
    position: absolute;
    top: 0; left: 0; right: 0;
    margin-right: 10px;
    // border: 1px solid $purple-gray;

    > li {
      height: 80px;
      border-bottom: 1px solid $purple-gray;
      padding: 0 $gap-s;
      box-sizing: border-box;
      font-weight: normal;
      transition: .2s ease background-color;

      &:last-child { border: none; }
      &.-active { background-color: $purple-gray; }

      a {
        height: 100%;
        display: block;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      strong {
        font-weight: normal;
        max-width: 200px;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span {
        color: $text-lighter-gray;
      }
    }

    &.-empty {
      color: $input-placeholder;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  }
}
</style>
