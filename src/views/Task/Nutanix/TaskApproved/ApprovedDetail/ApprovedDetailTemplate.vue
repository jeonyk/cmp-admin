<!--
  * 파일명 : ApprovedDetailTemplate.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-12-20
  * License By Shinsegae I&C
  * 2020-12-20 Merge branch 'dev' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/markupfix
 -->

<template>
  <div class="approved-detail">
    <section class="top-area">
      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="openConfirmModal({ view: true, title: '', type: 'DONE', class: 'approval-modal', width: '300px', top: '35vh' })"
          v-if="setApprovalRole"
        >
          {{ $v('승인') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="openConfirmModal({ view: true, title: '', type: 'REJECT', class: 'approval-modal', width: '300px', top: '35vh' })"
          v-if="setApprovalRole"
        >
          {{ $v('반려') }}
        </button>
        <button
          class="button"
          @click="openConfirmModal({ view: true, title: $v('결재선'), type: 'LINE', class: undefined, width: '80%', top: '25vh' })"
        >
          {{ $v('결재선') }}
        </button>
      </div>
    </section>

    <section class="draft-wrap">
      <div class="approve-block">
        <div class="approved-list">
          <draft-approve
            v-if="approvers.length > 0"
            :title="$t('task.PAY.title')"
            :data="approvers"
          />
          <!-- 결재 / 합의 -->
        </div>
      </div>

      <div class="register-item-wrap">
        <div class="divided">
          <register-contents :title="$v('신청조직')">
            <span> {{ data.approveeGroup ? data.approveeGroup.name : '-' }} </span>
          </register-contents>
          <!-- 신청조직 -->
          <register-contents :title="$v('기안자')">
            <span> {{ data.approvee ? data.approvee.name : '-' }} </span>
          </register-contents>
          <!-- 기안자 -->
          <register-contents :title="$v('보존년한')">
            <!-- (5년) -->
            <span> {{ inServiceLife }} ({{ data.expectDate | dateSimple }}) </span>
          </register-contents>
          <!-- 보존년한 -->
        </div>
      </div>
    </section>

    <section class="approved-information-wrap">
      <dashboard-panel
        :title="$v('결재 정보')"
        :padding-top="0"
        class="panel-body -info"
      >
        <register-contents
          :title="$v('제목')"
          style="border-top: 1px solid #2A2D44"
        >
          {{ data.title }}
        </register-contents>
        <!-- /. 요청 제목 -->

        <register-contents :title="$v('완료 희망일')">
          <!-- {{ YYYY.MM.DD }} -->
          {{ data.expectDate | dateSimple }}
        </register-contents>
        <!-- /. 완료 희망일 -->

        <register-contents :title="$v('결재 내용')">
          <p style="white-space: pre-line">
            {{ data.reason }}
          </p>
        </register-contents>
        <!-- /. 신청 사유 -->

        <register-contents
          v-if="data.orderReqNote"
          :title="$v('주문 요청 사항')"
        >
          <p style="white-space: pre-line">
            {{ data.orderReqNote }}
          </p>
        </register-contents>
        <!-- /. 주문 요청 사항 (주문결재문서에만 노출) -->

        <register-contents
          :title="$v('첨부파일')"
          style="border-bottom: 1px solid #2A2D44"
        >
          <div v-if="getFiles.length">
            <file-down-component
              v-for="({ fileName, text }, index) in getFiles"
              :key="`file_${index}`"
              :file-name="fileName"
              @click="text ? downloadPDF(fileName, text) : getReviewFile(fileName)"
            />
          </div>
          <!-- /. 등록한 보고서에 대한 정보 + 첨부파일 목록 -->

          <span v-else>{{ $t('admin.PREF.noFile') }}</span>
        </register-contents>
        <!-- /. 첨부파일 -->
      </dashboard-panel>

      <dashboard-panel
        :title="$t('자원 정보')"
        v-loading="isLoading"
      >
        <task-resource-user
          v-if="isReviewMode === true"
          :data="orderList"
        />
        <div
          v-loading="isLoading"
          v-else
        >
          <aws-task-tabs
            v-if="isAWS"
            :data="orderList"
            task-type="DONE"
            :is-read-only="true"
            :is-review-mode="isReviewMode"
          />
          <task-resource
            v-else
            read-only
            :data="orderList"
          />
        </div>
      </dashboard-panel>
    </section>

    <el-dialog
      :title="modalOption.title"
      :visible.sync="modalOption.view"
      :width="modalOption.width"
      @close="closeModal"
    >
      <!-- 결재선 -->
      <approval-process
        v-if="modalOption.title === $t('task.PAY.DETAIL.line')"
        :data="approvers"
      />

      <!-- 결재 승인 -->
      <article
        class="approval-approve-modal"
        v-else
      >
        <p class="proceed-confirm">
          {{ modalOption.type === 'REJECT' ? $v('결재를 반려 하시겠습니까?') : $v('결재를 승인 하시겠습니까?') }}
        </p>

        <div class="proceed-approval">
          <el-input
            :placeholder="$v('비고 입력')"
            type="textarea"
            v-model="note"
          />
        </div>
        <!-- /. 비고 -->

        <div class="modal-button-area">
          <button
            class="button"
            @click="closeModal"
          >
            {{ $v('취소') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="execute"
          >
            {{ $v('완료') }}
          </button>
        </div>
      </article>
    </el-dialog>
    <template>
      <button
        class="button -pdf-download"
        type="is-icon"
        style="display: none"
      >
        <pdf-download
          ref="pdfDownload"
          capture-el=".approval-apply-document"
          :file-name="reportName"
          file-background-color="#fff"
        />
      </button>
    </template>
    <template>
      <div style="position:absolute; width:100%; left:200%;">
        <article
          class="document-preview approval-apply-document"
          style="padding: 50px; background: #fff; color: #000; border-radius: 4px;"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import API, { ApprovalDraftUtil, FileDownComponent, DashboardPanel, DraftApprove, ApprovalProcess } from '@sd-fe/cmp-core'
import TaskResource from '../../TaskResource/TaskResource'
import TaskResourceUser from '../../TaskResource/TaskResourceUser'
import AwsTaskTabs from '@/components/TaskTabs/AwsTaskTabs.vue'

export default {
  name: 'ApprovedDetailTemplate',
  mixins: [ApprovalDraftUtil.approvalUtil],
  props: {
    data: { // 결재 데이터
      type: Object,
      default: () => {}
    },
    approvers: { // [결재자] 목록 (외부에서 정의)
      type: Array,
      default: () => []
    },
    setApprovalRole: { // [승인/반려] 권한이 있는지 확인
      type: Boolean,
      default: false
    },
    orderList: { // 자원 정보 데이터 ([주문결재문서], [결재함 상세] 둘다 사용해서 따로 뺐음)
      type: Array,
      default: () => []
    },
    isReviewMode: { // ([주문결재문서], [결재문서조회])
      type: Boolean,
      default: false
    }
  },
  components: {
    'file-down-component': FileDownComponent,
    'dashboard-panel': DashboardPanel,
    'task-resource-user': TaskResourceUser,
    'task-resource': TaskResource,

    'approval-process': ApprovalProcess,
    'draft-approve': DraftApprove,
    'aws-task-tabs': AwsTaskTabs
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      csp: state => state.cloud.cloud.toUpperCase()
    }),
    /**
     * [보존년한] 표기
     */
    inServiceLife () {
      const source = this.data.expireDate - this.data.createTime
      const year = this.$v('년')
      if (!source) return `5 ${year}`
      return Math.floor(source / 1000 / 60 / 60 / 24 / 365) + ` ${year}`
    },
    isAWS () {
      return this.csp === 'AWS'
    },
    /**
     * 등록된 [첨부파일] 다운로드
     */
    getFiles () {
      const document = this.data.documentJson && Object.keys(JSON.parse(this.data.documentJson)).length > 0 ? JSON.parse(this.data.documentJson) : null
      const files = this.data.attachFiles ?? []
      const file = document ? { fileName: document.name, text: document.text } : null

      // 등록된 [첨부파일] + [보고서] 정보
      let result = []
      if (file) result.push(file)

      const attatched = files.map(({ fileName }) => ({ fileName }))
      if (attatched) result = [...result, ...attatched]

      return result
    }
  },
  created () {
    this.isLoading = false
  },
  methods: {

    /**
     * [결재 승인/반려] 누를때
     */
    openConfirmModal (values) {
      this.modalOption = values
    },
    closeModal () {
      this.note = ''
      this.modalOption = {
        view: false,
        title: null,
        width: ''
      }
    },
    /**
     * [첨부파일] 파일 다운로드 실행
     */
    async getReviewFile (fileName) {
      try {
        const approvalNo = this.data.approvalNo
        const params = { approvalNo, fileName }
        const response = await API.work_v3.getReviewFile(params)

        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }))
        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
      } catch (error) {
        console.error('@@ getReviewFile :: ', error)
      }
    },
    /**
     * [보고서] 파일 다운로드 진행
     */
    downloadPDF (fileName, text) {
      this.reportName = fileName.replace(/\./g, '')
      document.querySelector('.document-preview').innerHTML = text
      this.$refs.pdfDownload.confirmForSavingPDF()
    },
    /**
     * [결재 승인/반랴 > 완료] 시 동작
     */
    async execute () {
      const type = this.modalOption.type
      this.$emit('update', { type, note: this.note })
      this.closeModal()
    }
  },
  data () {
    return {
      reportName: '',
      isLoading: true,
      roles: [],
      resources: [],
      note: undefined,
      tabs: [],
      publicTabs: [],
      modalOption: {
        view: false,
        title: null,
        width: ''
      }
    }
  }
}
</script>

<style lang="scss">
.approved-detail {
  .top-area {
    margin-bottom: $gap;
    justify-content: space-between;
    align-items: center;

    > .option-buttons {
      > button:first-child {
        margin-right: $gap-s;
      }
    }
  }

  .draft-wrap {
    .approve-block {
      display: flex;
      justify-content: flex-end;
      margin-bottom: $gap;
      text-align: right;

      > .approved-list {
        // width: 500px;
        > *:first-child {
          margin-bottom: $gap-s;
        }
      }
    }
  }

  .proceed-confirm {
    text-align: center;
    margin-bottom: $gap;
    font-size: 16px;
    line-height: 22px;
  }

  .approved-information-wrap {
    > .dashboard-panel {
      margin-top: 50px;
      &.-info {
        .panel-body {
          padding-top: 0;
        }
      }
    }
  }
}

.register-item-wrap {
  border-top: 1px solid $border-color;
  .divided {
    display: flex;
    > * {
      flex: 0 0 33.33%;
    }
  }
}

.remark .contents {
    border-top: 1px solid $dark-slate;
  }
</style>
