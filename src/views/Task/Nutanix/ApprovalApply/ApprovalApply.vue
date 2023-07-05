<!--
  * 파일명 : ApprovalApply.vue
  * 파일 기능 : 결재 신청 페이지
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 fix: 접근 불가능 페이지 접근 후 뒤로가기시 이동 불가능 버그 수정
 -->

<template>
  <section
    :class="['approval-apply', { '-watermark': isProd }]"
    v-loading="loading"
  >
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
    <article>
      <h3 class="product-title">
        <!-- 결재 정보 -->
        {{ $v("결재 정보") }}
      </h3>

      <div class="approved-information-wrap" />

      <register-contents
        required
        :title="$v('제목')"
        style="border-top: 1px solid $line-dark-gray"
      >
        <el-input
          :placeholder="$v('제목을 입력해주세요.')"
          v-model="task.name"
          :maxlength="100"
        />
      </register-contents>
      <!-- 제목 -->

      <register-contents
        required
        :title="$v('결재선 설정')"
        style="border-top: 1px solid $line-dark-gray"
      >
        <button
          class="button"
          type="is-primary"
          @click="blsmModal = true"
        >
          {{ $v("설정") }}
        </button>
        <el-tag
          v-if="approvers && approvers.length"
          style="margin-left: 10px"
        >
          {{ approverTags(approvers) }}
        </el-tag>
      </register-contents>
      <!-- 결재선 설정 -->

      <register-contents
        :title="$v('완료희망일')"
        required
      >
        {{ expectDate }}
      </register-contents>
      <!-- 완료 희망일 -->

      <register-contents
        :title="$v('결재 내용')"
        required
      >
        <el-input
          resize="none"
          type="textarea"
          v-model="task.reason"
          :placeholder="$v('메모')"
          ref="textarea"
          @keyup.native.stop="ctrlTextAreaSize"
          @keydown.native.stop="ctrlTextAreaSize"
        />
      </register-contents>
      <!-- 결재 내용 -->

      <register-contents :title="$v('파일 업로드')">
        <el-upload
          :class="['cmp-upload', { 'is-disabled': false }] "
          ref="upload"
          action=""
          :on-change="fileOnChange"
          :before-remove="fileBeforeDelete"
          :auto-upload="false"
          :multiple="true"
          :limit="5"
          :file-list="fileList"
          :on-exceed="handleExceed"
          :on-preview="previewHandler"
        >
          <!-- :before-upload="beforeAvatarUpload" -->
          <button
            slot="trigger"
            class="button"
            type="is-primary"
          >
            {{ $v("파일 업로드") }}
          </button>
        </el-upload>
        <!-- /. 첨부 파일 -->
      </register-contents>

      <article class="button-area -center">
        <button
          class="button"
          size="is-large"
          type="is-primary"
          @click="setTask"
        >
          {{ $v("결재") }}
        </button>
      </article>
    </article>
    <!-- /. 결재 정보 -->

    <div v-if="useDoc">
      <h1>
        {{ reportName }}
      </h1>
      <article
        class="document-preview approval-apply-document"
        style="padding: 50px; background: #fff; color: #000; border-radius: 4px"
      />
    </div>
    <!-- /. 보고서 미리보가 -->

    <div v-else>
      <aws-task-tabs
        v-if="cloud === 'AWS'"
        :is-review-mode="true"
        :data="orderList"
      />
      <task-resource
        v-else
        :data="orderList"
      />
    </div>

    <!-- 조직도 모달 -->
    <approval-modal
      v-if="blsmModal"
      :active.sync="blsmModal"
      :data="approvers"
      @confirm="saveApprovers"
      @close="blsmModal = false"
    />
  </section>
</template>

<script>
import ApprovalMemberModal from '@/components/Modal/ApprovalMemberModal/ApprovalMemberModal'
import TaskResource from '../TaskResource/TaskResource'
import AwsTaskTabs from '@/components/TaskTabs/AwsTaskTabs.vue'
import TaskDetailCommon from '../TaskDetailCommon'

import API, { RegisterContents } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { mapState } from 'vuex'

export default {
  name: 'ApprovalApply',
  mixins: [TaskDetailCommon],
  components: {
    RegisterContents,
    'task-resource': TaskResource,
    AwsTaskTabs,
    'approval-modal': ApprovalMemberModal
  },
  provide () {
    return {
      $field_V3: () => '',
      $orderType: () => this.orderList?.[0]?.workItemRsps?.[0]?.resourceType
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      userInfo: state => state.common.userInfo,
      selectedProject: state => state.project.selectedProject,
      isProd: state => state.common.isProd,
      packageType: state => state.common.packageType,
      cloud: state => state.cloud.cloud.toUpperCase()
    })
  },

  /*
    (🟩 필독) 필수 파라미터 & 쿼리

    @@ params
      step: "conference|todo"
      orderNo // 주문번호

    @@ query
      orderType: "NEW|CHANGE|DELETE" // 주문 타입
      roleIdx
      useDoc: "true|false" // 보고서 설정 여부
      workState: "REVIEW|TODO" // 현재 주문의 상태
      expectDate: "YYYY-mm-dd" // 완료 희망일
  */

  async created () {
    this.setBreadCrumbs()

    // console.log(this.$route?.query)
    const { orderType, workState, roleIdx, useDoc, expectDate } = this.$route?.query
    this.useDoc = useDoc
    this.expectDate = expectDate.replace(/-/g, '.')
    this.getApprovalType({ orderType, workState, roleIdx, useDoc })
  },
  mounted () {
    // console.log()
    // this.$refs.pdfDownload.confirmForSavingPDF()
  },
  methods: {
    /**
     * 첨부파일 다운로드
     * @param {Object} fileName
     */
    async fileDownload ({ fileName }) {
      try {
        const { approvalNo, approvalType } = this.data
        const params = { approvalNo, approvalType, fileName }
        const response = await API.work_v3.downloadAttachedFile(params)

        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }))
        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
      } catch (error) {
        console.error('@@ ApprovalBoxDetailDraft > fileDownload', error)
      }
    },

    async previewHandler (file) {
      if (this.reportName === file.name) {
        this.$refs.pdfDownload.confirmForSavingPDF()
      } else {
        console.log(file)
        const params = {
          approvalNo: this.approvalNo,
          fileName: file.name
        }
        const response = await API.work_v3.getReviewFile(params)
        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }))
        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', file.name)
        document.body.appendChild(link)
        link.click()
      }
    },
    handleExceed (files, fileList) {
      this.$alert('최대 5개 파일까지 업로드 가능합니다.')
    },

    /**
     * 빵가루 처리
     */
    setBreadCrumbs () {
      const { step, orderNo } = this.$route.params
      const label = {
        conference: this.$v('사전협의'),
        todo: this.$v('할 일')
      }[step]

      const elements = [label, `${this.$v('주문번호')} ${orderNo}`]

      for (const key of elements) {
        this.$store.commit('common/ADD_PARAMETERS', {
          label: key,
          path: ''
        })
      }
    },

    /**
     * 워크플로우가 어떻게 설정되어있느냐에 따라 [결재선 목록], [보고서 설정] 다르게 호출
     */
    getApprovalType ({ orderType, workState, roleIdx, useDoc }) {
      // 현재 페이지에 맞춰서 결재선을 각각 다르게 확인해야함!
      const workflowStep = {
        REVIEW: 'APPROVAL1', // [사전협의] => 결재1
        APPROVAL1_REJECTED: 'APPROVAL1', // [결재함 > 결재1 반려] => 재결재
        TODO_FINISHED: 'APPROVAL2', // [할일] => 결재2
        APPROVAL2_REJECTED: 'APPROVAL2' // [결재함 > 결재2 반려] => 재결재
      }[workState]
      const workflowId = `-${orderType}-${workflowStep}-${roleIdx}`.toLowerCase()

      this.setWorkflowApprovers(workflowId)

      // [보고서 설정] ON/OFF 에 따라 상세 데이터를 다르게 불러옵니다.
      // - ON  (true)   : 작성한 보고서 템플릿 정보 가져오기
      // - OFF (false)  : 신청한 자원 정보 가져오기 (readonly)
      return useDoc ? this.getReaOnlyDocument() : this.getReadOnlyResource()
    },

    /**
     * 워크플로우에 저장된 결재선 호출
     * @param {String} workflowId
     */
    async setWorkflowApprovers (workflowId) {
      // workflow 에 저장된 결재
      const { approvers } = await this.getWorkflowId(workflowId)
      this.approvers = approvers || []
    },

    /**
     * workflow 프로세스 상세 정보 호출
     * @param {String} workflowId
     */
    async getWorkflowId (workflowId) {
      try {
        const response = await API.work_v3.getWorkflowId(workflowId)
        return response
      } catch (error) {
        console.error('@@ getWorkflowId', error)
        return []
      }
    },

    /**
     * 보고서 설정 ON 일때 호출
     * [사전협의|할일 > 작업계획서|완료보고서 > 보고서 상세 조회]
     */
    async getReaOnlyDocument () {
      try {
        if (this.type === 'new') return

        const roleIdx = this.$route?.query?.roleIdx
        const orderNo = this.$route?.params?.orderNo
        const step = this.$route?.params?.step
        const workId = `${orderNo}-${roleIdx}`

        const orderType = this.$route?.query?.orderType
        const isUrgent = orderType === 'URGENT'

        const apiName = isUrgent
        // [사전협의 긴급] 페이지에서 저장된 [사후완료보고서] 조회
          ? 'getAADocument'
          : {
            conference: 'getReviewDocument', // [사전협의] 페이지에서의 저장된 보고서
            todo: 'getTodoDocument' // [할일] 페이지에서의 저장된 보고서
          }[step]

        const { title, jsonData, lastModifiedAt } = await API.work_v3[apiName]({ workId })
        this.values = { name: title, text: jsonData }

        // 파일 세팅
        this.reportName = title + '_' + Dayjs(lastModifiedAt).format('YYYY-MM-DD')
        document.querySelector('.document-preview').innerHTML = jsonData
        this.fileList = [{ name: title + '_' + Dayjs(lastModifiedAt).format('YYYY-MM-DD') }]
      } catch (error) {
        console.error('@@ DocumentWorkDetail > getReaOnlyDocument', error)
      }
    },

    /**
     * 보고서 설정 OFF 일때 호출
     * [사전협의|할일 > 자원 상세]
     */
    async getReadOnlyResource () {
      try {
        if (this.type === 'new') return

        const roleIdx = this.$route?.query?.roleIdx
        const workState = this.$route?.query?.workState
        const orderNo = this.$route?.params?.orderNo
        const workId = `${orderNo}-${roleIdx}`

        const workStep = {
          APPROVAL1_REJECTED: 'REVIEW', // 결재 1 ([사전협의] 호출)
          APPROVAL2_REJECTED: 'TODO', // 결재2 ([할일] 호출)
          TODO_FINISHED: 'TODO' // [할일] 완료 ([할일] 호출)
        }[workState] || workState

        const data = await API.work_v3.getReadOnlyResource({ workId, workStep })
        this.orderList = [data] // 무조건 Array 형식 이어야함 ...
      } catch (error) {
        console.error('@@ ApprovalApply > getReadOnlyResource', error)
      }
    },

    async setTask () {
      try {
        const validator = this.validator()
        if (!validator) return

        // 결재 신청자
        const { company, group, approvee } = this.setApprovee()
        const { expectDate } = this.$route?.query

        const fileList = this.fileList.filter(f => f.name !== this.reportName)
        const formData = new FormData()

        const attachedFiles = []

        console.log('testFile')
        for (let i = 0; i < fileList.length; i++) {
          formData.append('file', fileList[i].raw)
          const data = await API.work_v3.saveReviewFile(formData)
          console.log('#url', data)
          attachedFiles.push({
            fileUrl: data.fileUrl,
            fileName: data.fileName
          })
        }

        const payload = {
          approvee,
          approveeCompany: company,
          approveeGroup: group,
          departId: group.idx, // 결재 신청자 부서 인덱스
          departName: group.name, // 결재 신청자 부서 이름
          approvers: this.approvers, // 결재자
          expectDate, // 완료희망일
          attachFiles: attachedFiles,
          documentJson: JSON.stringify(this.values),
          reason: this.task.reason,
          title: this.task.name,
          orderNo: this.$route.params.orderNo,
          roleIdx: Number(this.$route.query.roleIdx),
          workId: {
            orderNo: this.$route.params.orderNo,
            roleIdx: Number(this.$route.query.roleIdx)
          },
          csp: this.cloud
        }

        console.log(payload, '결재 완료!')

        const step = this.$route?.params?.step
        const orderType = this.$route?.query?.orderType

        const isUrgent = orderType === 'URGENT' // [긴급] 건 일때

        const apiName = {
          conference: isUrgent ? 'applyAAReportApproval' : 'applyReviewApproval', // [사전협의] 페이지에서의 저장된 보고서
          todo: 'applyTodoApproval' // [할일] 페이지에서의 저장된 보고서
        }[step]

        await API.work_v3[apiName](payload)

        this.$alert(this.$v('결재가 완료되었습니다.'), { callback: () => this.$router.go(-1) })
      } catch (error) {
        this.catchMessage(error, this.$v('결재가 신청을 진행하는동안 문제가 발생하였습니다. <br> 다시 시도해주세요.'))
        console.error('@@ ApprovalApply > setTask', error)
      }
    },

    /**
     * 결재 전 필수값 확인
     * @return {Boolean}
     */
    validator () {
      const conditions = [
        { condition: this.task.name, message: this.$v('결재 제목을 입력해주세요.') },
        { condition: this.approvers.length > 0, message: this.$v('결재자를 지정해주세요.') },
        { condition: this.task.reason, message: this.$v('결재 내용을 입력해주세요.') }
        // { condition: true, message: this.$v('') },
      ]

      // [결재 사용 ON] 이라면 결재 파일 필수
      if (this.useDoc) conditions.push({ condition: this.fileList.length > 0, message: this.$v('결재 파일을 하나 이상 추가해주세요.') })

      return conditions.every(({ condition, message }) => {
        if (!condition) this.$alert(message)
        return condition
      })
    },

    /**
     * [결재선 설정] 저장
     * @param {Array} approvers 선택된 결재선 데이터
     */
    saveApprovers (approvers) {
      const result = approvers.map(({ userId, userName, userPosition, companyName, groupName, no, type }) => {
        return {
          no,
          type,
          approver: { id: userId, name: userName, position: userPosition },
          company: { idx: null, name: companyName },
          userGroup: { idx: null, name: groupName }
        }
      })

      this.approvers = result
    },

    /**
     * 현재 결재하고있는 [주문자(=결재신청자)] 정보 가공
     */
    setApprovee () {
      const {
        userCompanyCode, userCompany, userCompanyName,
        userDuty, userId, userIdx, userName, userPosition,
        userGroupCode, userGroup: groupIdx, userGroupName
      } = this.user

      // [주문자 (=결재신청자)] 정보 세팅
      const company = { code: userCompanyCode, idx: userCompany, name: userCompanyName, ownerIdx: 1004, ownerName: 'randomValue' }
      const group = { code: userGroupCode, idx: groupIdx, name: userGroupName }
      const approvee = { duty: userDuty || 'randomValue', id: userId, idx: userIdx, name: userName, position: userPosition }

      return { company, group, approvee }
    },

    /**
     * [결재선 선택] 모달로 선택한 결재자 목록 가공
     */
    setApprovers (userList) {
      // [결재자] 목록 지정
      const approvers = []
      for (let i = 0; i < userList.length; i++) {
        const {
          no, type, // isDrafter,
          userDuty, userId, userName, userPosition,
          userCompanyCode, userCompany, userCompanyName,
          userGroupCode, userGroup, userGroupName
        } = userList[i]

        approvers.push({
          no, // 결재 담당자 순번
          type, // 합의, 결재
          approver: { duty: userDuty || 'randomValue', id: userId, name: userName, position: userPosition }, // 결재 담당자 유저 정보
          approverCompany: { code: userCompanyCode, idx: userCompany || '????', name: userCompanyName, ownerIdx: 1004, ownerName: 'randomValue' }, // 결재 담당자 관계사 정보
          approverGroup: { code: userGroupCode, idx: userGroup || '????', name: userGroupName } // 결재 담당자 조직 정보
        })
      }

      return approvers
    },
    /**
     * textarea 텍스트 입력시마다 영역 높이 설정
     * @param {EventObject} e
     */
    ctrlTextAreaSize (e) {
      const textareaWrap = this.$refs.textarea.$el
      const textarea = textareaWrap.querySelector('textarea')

      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
      textareaWrap.style.height = textarea.scrollHeight + 'px'
    },
    /**
     * 결재 신청 버튼 클릭시 발생하는 이벤트
     * 필수값 validator
     * @param {Object} data 결재 정보
     */
    validateToSendApproval (data = this.task) {
      const keys = Object.keys(data)
      const valid = keys.filter(key => {
        const validKeys = ['name', 'finishTime', 'reason']
        return validKeys.includes(key)
      })

      const checkData = valid.map(key => data[key].trim())
      const checkValue = checkData.every(val => val)
      return checkValue
    },
    fileOnChange (file, fileList) {
      console.log('#fileOnChange', file)

      if (file.size >= (1024 * 1024 * 10)) { // 10Mb 이하 파일만 업로드 가능
        this.fileList = this.fileList.filter(x => x.uid !== file.uid) // 해당하는
        setTimeout(() => {
          this.$alert(this.$t('common.ALERT.PROJECT.081', { size: '10Mb', fileName: file.name }))
        }, 0)
        console.log(111, this.fileList)
      } else {
        this.fileList.push(file)
        console.log(222, this.fileList)
      }
    },
    fileBeforeDelete (file, fileList) {
      this.fileList = this.fileList.filter(x => x.uid !== file.uid) // 해당하는
    }
  },
  data () {
    return {
      loading: false,
      reportName: '',
      values: {},
      approvers: [],
      useDoc: false,
      expectDate: undefined,
      rawData: [],
      orderList: [], // 주문한 내역
      task: {
        name: '',
        reason: '',
        oldTaskNo: '',
        companyId: '',
        companyName: '',
        groupId: '',
        groupName: '',
        userId: '',
        userName: '',
        userPosition: '',
        departId: '',
        departName: '',
        finishTime: '',
        orders: [],
        approvals: []
      },
      fileList: [],
      blsmModal: false,

      /**
       * 선택된 결재선 카운트
       */
      approverTags (approvers) {
        if (approvers.length === 0) return null

        const userName = approvers[0].approver.name
        return approvers.length > 1 ? `${userName} 외 ${approvers.length - 1}` : userName
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.button-area {
  margin: $gap-m 0;
}

.document-preview {
  // border: 1px solid red;
}

.approval-apply {
  &::v-deep {
    .cmp-upload {
      .el-upload-list {
        :first-child {
          .el-icon-close {
            display: none;
          }
        }
      }

      &.is-disabled {
        .el-upload--text {
          display:none;
        }
        .el-upload-list {
           .el-icon-close {
              display: none;
            }
        }
      }
    }
  }
}
</style>
