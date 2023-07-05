<template>
  <div>
    <el-dialog
      :visible.sync="publicProject.view"
      :title="publicProject.approvalNo"
      width="1020px"
      top="5vh"
      @close="close"
    >
      <div class="task-project-wrapper">
        <section id="approval-line-section">
          <div class="button-area -left">
            <button
              class="button"
              @click="openApprovalLine"
            >
              <!-- 결재선 -->
              {{ $t('task.PAY.DETAIL.line') }}
            </button>
            <button
              v-if="isApprovalRole"
              class="button"
              @click="openApproveConfirm"
              type="is-primary"
            >
              <!-- 결재 확인 -->
              {{ $t('task.PAY.confirm') }}
            </button>
          </div>
          <div class="approved-list">
            <draft-approve
              v-if="approverUserList.length > 0"
              :title="$t('task.PAY.title')"
              :data="approverUserList"
            />
            <!-- 결재 / 합의 -->
          </div>

          <dashboard-panel
            style="margin-top: 30px;"
            :title="$t('task.PAY.DETAIL.info')"
            :padding-top="0"
          >
            <vertical-table
              :data="publicProject"
              :columns="[
                { binding: 'taskName', header: '요청 제목', keyPath: 'task.PAY.DETAIL.subject' },
                { binding: 'reason', header: '신청 사유', keyPath: 'task.PAY.DETAIL.reasonRequest' },
                { binding: 'fileName', header: '첨부파일', keyPath: 'common.TERMS.file' }
              ]"
            >
              <template #fileName>
                <file-down-component
                  v-if="taskInfo.fileName"
                  :file-name="taskInfo.fileName"
                  :url="taskInfo.fileUrl"
                />
                <span v-else>{{ $t('admin.PREF.noFile') }}</span>
              </template>
            </vertical-table>
          </dashboard-panel>
        </section>

        <section id="info-section">
          <dashboard-panel
            :title="$t('common.MODAL.projectInfo')"
            :padding-top="0"
          >
            <vertical-table
              :data="publicProject"
              :columns="columns"
              type="horizontal"
            />
          </dashboard-panel>
        </section>
        <!-- 프로젝트 정보 -->

        <section id="account-section">
          <dashboard-panel
            :title="$t('common.BTN.ADMIN.regAcc')"
            :padding-top="0"
          >
            <div
              class="hidden-access-key"
              v-if="hiddenAccessKey"
            >
              <template v-if="field !== 'done'">
                <p>{{ $v('현재 로그인된 계정의 비밀번호를 입력 후 확인 가능합니다.') }}</p>
                <div
                  class="flex-wrap"
                  style="gap: 10px; justify-content: flex-start; align-items: flex-start;"
                >
                  <div>
                    <el-input
                      v-model="accountPw"
                      style="width: 300px"
                      show-password
                      @input="() => failMessage !== undefined ? failMessage = undefined : null"
                      @keyup.native.enter="confirmPw(accountPw)"
                    />
                    <small class="wrong-alert">{{ failMessage }}</small>
                  </div>
                  <button
                    class="button"
                    type="is-primary"
                    :disabled="!accountPw"
                    @click="confirmPw(accountPw)"
                  >
                    {{ $v('확인') }}
                  </button>
                </div>
              </template>
              <!-- /. 비밀번호 확인 -->

              <template v-else>
                <span
                  class="disable-text"
                  v-html="$v('계정 등록 완료<br>구성 관리 > 프로젝트 관리에서 확인 바랍니다.')"
                />
              </template>
            </div>
            <!-- /. [계정 등록] 전 비밀번호 확인 -->

            <vertical-table
              v-else
              :data="accessKeyInfo"
              :columns="accessKeyInfoColumns"
            >
              <template
                v-for="col in accessKeyInfoColumns"
                v-slot:[col.binding]
              >
                <div
                  class="flex-wrap"
                  :key="col.binding"
                >
                  <el-input
                    v-model="accessKeyInfo[col.binding]"
                    :disabled="!editAccessKey"
                  />
                </div>
              </template>
            </vertical-table>
          </dashboard-panel>
          <!-- 계정 등록 -->
        </section>

        <section id="memo-section">
          <dashboard-panel
            :title="$t('task.TODO.DETAIL.note')"
            :padding-top="0"
          >
            <task-memo
              :data="taskMemoList"
              @refresh-memo="activePublicProject(data, true)"
            />
          </dashboard-panel>
        </section>
        <!-- /. 메모 영역 -->
      </div>

      <div class="modal-button-area">
        <button
          class="button -modal-button"
          type="is-primary"
          @click="close"
        >
          <!-- 확인 -->
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
    <!-- /. [AWS 프로젝트 모달 끝] -->

    <!-- 모달 -->
    <el-dialog
      class="none-header approve-modal"
      :visible.sync="failModal"
      width="330px"
      top="35vh"
    >
      <p class="action-message">
        {{ $t('task.PRIOR.DETAIL.actionMessage') }}
      </p>

      <div>
        <el-input
          type="textarea"
          :autosize="{ minRows: 5, maxRows: 6 }"
          :placeholder="$t('task.TODO.DETAIL.enterFail')"
          resize="none"
          v-model="failReason"
          style="margin-top: 10px;"
        />
      </div>

      <div class="modal-button-area">
        <button
          class="button -modal-button"
          @click="failModal = false"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          type="is-primary"
          @click="e=>{
            failModal = false
            forceComplete()
          }"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>

    <!-- 결재선 / 결재 승인 -->
    <el-dialog
      :title="approvalProcessModal.title"
      :visible.sync="approvalProcessModal.view"
      :width="approvalProcessModal.width"
      @close="closeModal"
    >
      <!-- 결재선 -->
      <approval-process
        v-if="approvalProcessModal.title === $t('task.PAY.DETAIL.line')"
        :data="publicProjectDetail.approvalUserList"
      />

      <!-- 결재 승인 -->
      <article
        class="approval-approve-modal"
        v-if="approvalProcessModal.title === $t('task.PAY.confirm')"
      >
        <register-contents
          :title="$v('비고')"
          class="remark"
        >
          <div class="proceed-approval">
            <el-input
              type="textarea"
              v-model="note"
            />
          </div>
        </register-contents>
        <!-- /. 비고 -->

        <div class="modal-button-area">
          <button
            class="button"
            @click="closeModal"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button"
            type="is-primary"
            @click="appoveSuccess"
          >
            <!-- 결재 -->
            {{ $t('task.PAY.title') }}
          </button>
        </div>
      </article>
    </el-dialog>
  </div>
</template>

<script>
import TaskMemo from '../Nutanix/TaskMemo/TaskMemo'
import ApprovalProcess from '../Nutanix/TaskApproved/ApprovedDetail/ApprovalProcess'
import AWSProjectMixins from './AWSProjectMixins.script'

import API, { DashboardPanel, DraftApprove } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  components: {
    'task-memo': TaskMemo,
    'draft-approve': DraftApprove,
    'approval-process': ApprovalProcess,
    'dashboard-panel': DashboardPanel
  },
  mixins: [AWSProjectMixins],
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    },
    field: {
      type: String, // 'todo', 'done', 'approved'
      default: ''
    }
  },
  mounted () {
  },
  watch: {
    active (view) {
      this.activePublicProject(this.data, view)
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.auth.user,
      user: state => state.auth.user
    })
  },
  destroyed () {
    clearInterval(this.interval)
  },
  methods: {
    async activePublicProject ({ approvalNo, project, ...data }, status) {
      if (!status) return this.close()

      try {
        const res = await API.work.getTaskUser({ approvalNo, userId: this.user?.userId })

        this.publicProject.loading = true
        this.publicProjectDetail = await this.getTask(approvalNo)

        if (this.publicProjectDetail.systemType === 'INSIDE' && (this.publicProjectDetail.taskStatus === 'WAIT' || this.publicProjectDetail.taskStatus === 'PROCEED') && res.allocationDate && res.approvalTime === null) {
          this.isApprovalRole = true
        }

        // 🔸 (220407) AWS 프로젝트는 한개밖에 신청못하니까 ... 일단 이렇게 ... 임시
        const roles = this.publicProjectDetail.taskDataList[0]
        const detail = roles.orderData
        // console.log(roles, detail)

        // // 선택 VPC
        const envType = { STG: this.$v('스테이징'), DEV: this.$v('개발'), PRD: this.$v('운영') }
        const environment = detail?.projectDto?.projectMapDto.map(({ environment }) => envType[environment])
        const date = (date, format = 'YYYY.MM.DD HH:mm:ss') => this.$options.filters.date(date, format)

        const { name: taskName, reason, fileName, fileUrl } = this.publicProjectDetail.userTask

        const copyData = Object.assign({
          approvalNo, // 결재 번호
          taskName, // 요청 제목
          finishTime: '?',
          reason, // 사유
          fileName, // 첨부파일
          fileUrl, // 첨부파일 (url)

          projectName: detail.projectName, // 프로젝트 명
          companyName: `${this.publicProjectDetail.companyName} > ${this.publicProjectDetail.groupName}`, // 관계사
          displayName: detail.projectDto.region, // 사용 Region
          environment: environment.join('/'), // 선택 VPC
          cloudType: detail.moduleType, // Public Cloud 유형
          applyDate: date(this.publicProjectDetail.createTime), // 협의 시작일
          doneDate: date(roles.createTime) || this.$v('대기'), // 완료일
          accessKey: detail.projectDto.accessKey || undefined,
          secretKey: detail.projectDto.secretKey || undefined
        })

        // 메모 목록 설정
        this.taskMemoList = {
          orderNo: this.publicProjectDetail.orderNo,
          data: this.publicProjectDetail.orderMemoList?.filter(memo => !memo.isDeleted)
        }

        // 상세 정보 저장
        this.publicProject = { ...copyData, view: status }

        // 결재선 정보
        this.approvalUserSetting(this.publicProjectDetail.approvalUserList)

        // accessKey 복사
        this.accessKeyInfo = {
          accessKey: this.publicProject.accessKey || undefined,
          secretKey: this.publicProject.secretKey || undefined
        }
      } catch (error) {
        console.error('@@ activePublicProject : ', error)
        return this.close(false)
      } finally {
        this.publicProject.loading = false
      }
    },

    async getTask (taskNo) {
      try {
        return API.work.getTaskAdmin({ approvalNo: taskNo })
      } catch (error) {
        console.error('@@ getTask : ', error)
        return {}
      }
    },

    /**
     * [저장] 클릭시 AccessKey 를 검사합니다.
     */
    async validateAccessKey () {
      const isValid = await this.checkKey(this.accessKeyInfo)
      if (!isValid) return this.$alert(this.$v('Access Key 가 올바르지 않습니다.'), { callback: () => false })

      this.editAccessKey = false
      return this.activePublicProject(this.data, true)
    },

    /**
     * AWS 프로젝트 AccessKey 정보 저장
     */
    async saveKey ({ accessKey, secretKey }) {
      try {
        const roles = this.publicProjectDetail.roleDataList
        const detail = roles['5'][0].orderData
        detail.projectDto = { ...detail.projectDto, accessKey, secretKey }

        const payload = {
          userId: this.user?.userId,
          userName: this.user?.userName,
          userPosition: this.user?.userPosition,
          groupIdx: this.user?.userGroup,
          groupName: this.user?.userGroupName,
          taskDataList: [detail]
        }

        // console.log(JSON.stringify(payload), payload)
        await API.work.saveKey(payload)

        return true
      } catch (error) {
        console.error('@@ saveKey : ', error)
        this.$alert(this.$v('저장에 실패했습니다. <br> 다시 시도해주세요.'), {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.publicProject.loading = false
      }
    },

    /**
     * AccessKey [변경] 버튼을 클릭했을때 발생합니다
     */
    changeAccessKey () {
      this.editAccessKey = !this.editAccessKey
    },

    /**
     * AccessKey 변경사항을 [취소] 할때 사용되는 메서드입니다
     */
    cancelAccessKey () {
      this.accessKeyInfo = {
        accessKey: this.publicProject.accessKey,
        secretKey: this.publicProject.secretKey
      }
      this.editAccessKey = false
    },

    /**
     * [계정 등록] > [비밀번호 입력] > [확인] 눌렀을 때 발생 이벤트
     */
    async confirmPw (password = this.accountPw) {
      try {
        const { data: passed } = await API.aws.checkPassword({ password, isAdmin: true, userId: this.user.userId })

        if (passed) this.hiddenAccessKey = false
        else this.failMessage = this.$v('비밀번호가 틀렸습니다. 재확인 후 입력 바랍니다.')
      } catch (error) {
        console.error('@@ confirmPw : ', error)
      }
    },

    close (status) {
      this.publicProject.view = status
      return this.$emit('close')
    },

    closeModal () {
      this.note = ''
      this.approveProcess = null
      this.approvalProcessModal = {
        view: false,
        title: null,
        width: ''
      }
    },

    async appoveSuccess () {
      // 결재 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.APPROVAL.001'), '알림', {
        confirmButtonText: this.$t('common.TERMS.yes'),
        cancelButtonText: this.$t('common.TERMS.no')
      }).then(async () => {
        await this.updateTask()
        this.$alert(this.$t('common.ALERT.BASE.045'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => {
            this.$router.go(-1)
            this.closeModal()
          }
        })
      }).catch(() => { return false })
    },
    async updateTask () {
      try {
        const hours = new Date()
        hours.setHours(hours.getHours() - 9)

        this.isApproval = true
        const payload = {
          status: 'DONE',
          approvalTime: this.$options.filters.timestamp(hours),
          note: this.note
        }

        // console.log(this.approvalNo, this.user?.userId, payload)

        await API.work.updateTask(this.publicProject.approvalNo, this.user?.userId, payload)
      } catch (error) {
        this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.isApproval = false
      }
    },

    approvalUserSetting (approvalUserList) {
      // [결재 / 합의] 할당된 계정 리스트 설정
      if (approvalUserList && approvalUserList.length) {
        const empty = { userPosition: '-', userName: '-' }
        this.approverUserList = approvalUserList.map(usr => {
          if (usr.type === 'S' || usr.type === 'M') return usr
          else return empty
        })
      }
    },
    openApprovalLine () {
      this.approvalProcessModal = {
        view: true,
        title: this.$t('task.PAY.DETAIL.line'), // 결재선
        width: '80%'
      }
    },
    openApproveConfirm () {
      this.approvalProcessModal = {
        view: true,
        title: this.$t('task.PAY.confirm'), // 결재승인
        width: '500px'
      }
    }
  },
  data: root => ({
    note: '',
    publicProjectDetail: null,
    publicProject: { // 프로젝트 결재 모달 데이터
      loading: false
    },
    accessKeyInfo: {
      accessKey: undefined,
      secretKey: undefined
    },
    editAccessKey: false,
    // ===
    // ===
    // ===
    // ===
    // ===
    projectModalHandler: false, // 프로젝트 할 일 모달 Handler
    isApprovalRole: false,
    approverUserList: [],
    agreementUserList: [],
    taskInfo: {
      taskName: '',
      finishTime: '',
      reason: 'test',
      fileName: ''
    },
    approvalProcessModal: {
      view: false,
      title: null,
      width: ''
    },

    resourceProject: { // 프로젝트 결재 모달 데이터
      orderNo: '0000', // 주문 번호
      oldTaskNo: '', // 결재 번호
      projectName: 'project_1',
      companyInfo: '신세계 I&C > 데이터센터팀',
      cloudType: 'AWS',
      region: '서울',
      vpc: '운영/개발',
      accessKey: '',
      secretAccessKey: ''
    },

    isFailMsg: false,
    orderType: undefined,
    isAuto: false,
    isLoading: false,
    odrDataCount: undefined,
    isOrderMemoRoel: false,
    userPermUpperRole: undefined,
    roleDataList: undefined,
    taskTodoInfo: undefined,
    taskMemoList: undefined,
    workFlowJson: undefined,
    rawDetail: undefined,
    loading: true,
    loadingText: '',
    order: {},
    orderInfo: null,
    lastStep: undefined, // 주문에 적용된 workFlow 중 마지막 스텝. 여기서 완료 시 한일로 넘어간다.
    currentStep: undefined, // 주문에 적용된 workFlow 중 현재 진행되어야 하는 스텝. DB task_todo_role에서 role_order와 proceed_status를 기준으로 조회해온 값.
    tabStep: {
      roleName: null
    }, // 탭에서 선택한 단계. 초기값은 로그인 관리자의 권한있는 업무[0] >> 이후 currentStep이 있으면 currentStep으로 덮어쓴다.
    taskDetailTab: [
      { field: 'work', name: root.$v('업무 내용'), isActive: true, keyPath: 'common.TERMS.business' },
      { field: 'order', name: root.$v('주문 정보'), keyPath: 'common.TERMS.orderInfo' }
    ],
    applyExamData: {
      projectName: '구매', serviceName: 'BI_2020_Q1', target: '김포', deparment: '신세계', ownerRelation: '신세계 아이앤씨', task: 'IT 통합인프라 백화점 스마트 HUB', relation: '신세계푸드', team: '백화점 워크스마트팀', itsmName: '[에, Nu]발주', serverManager: '서버2', taskManager: '신세계 프라퍼티, 신세계 푸드', installDate: '2020.06.08 10:00:00', chargeDate: '2020.06.08 10:00:00', attachment: 'file', applyDesc: '서버 증설로 인해 자원 신청합니다. 기일 엄수 부탁드립니다.'
    },
    dataExam: [],
    // 자원 테이블 데이터
    computeGridData: [],
    databaseGridData: [],
    storageGridData: [],
    marketplaceGridData: [],
    l7GridData: [],
    securityGridData: [],
    // 체크리스트 임시 데이터
    checkList: [],
    view: 'work',
    failModal: false,
    failReason: '',
    hiddenAccessKey: true, // access 키 read 가능 여부
    accountPw: '', // 현재 로그인된 계정의 비밀번호 인풋 창에 적힌 값
    failMessage: undefined, // 계정 패스워드 실패 메세지
    columns: [
      { binding: 'projectName', header: root.$v('프로젝트 명'), colspan: true },
      // { binding: 'workResult', header: root.$v('작업 상태'), customHtml: true },
      { binding: 'companyName', header: root.$v('관계사') },
      { binding: 'cloudType', header: root.$v('Public Cloud 유형') },
      { binding: 'displayName', header: root.$v('사용 Region') },
      { binding: 'environment', header: root.$v('선택 VPC') },
      { binding: 'applyDate', header: root.$v('협의 시작일') },
      { binding: 'doneDate', header: root.$v('완료일') }
    ],
    accessKeyInfoColumns: [
      { binding: 'accessKey', header: 'Access Key' },
      { binding: 'secretKey', header: 'Secret Access Key' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.task-project-wrapper {
  height: 70vh;
  overflow-y: auto;
}

#account-section {
  margin-top: $gap-m;
  .hidden-access-key {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 160px;
    border-radius: $radius;
    background-color: $ticket-back-color;
    > p { margin-bottom: $gap; font-size: 14px; text-align: center; }
    .wrong-alert { display: block; margin-top: 10px; color: $main-red; font-size: 12px;}
  }

  .save-key-btn {
    margin-right: 12px;
    font-size: 13px;
    line-height: 32px;
    color: $purple;
  }
}

#memo-section {
  margin-top: $gap-m;
  padding: $gap $gap-m;
  border-radius: $radius;
  border: 1px solid $border2A;
}

.disable-text {
  text-align: center;
  line-height: 1.3;
  color: $text-lighter-gray;
}

.approved-list {
  margin-top: 20px;
}

.-icon {
  margin-left: 5px;

  .-close-icon {
    display: block;
    width: 20px;
    height: 20px;
    background-color: $white;
    border-radius: 50%;
    position: relative;
    cursor: pointer;

    &::before, &::after {
      content: '';
      position: absolute;
      background: $text-black;
      width: 10px;
      height: 1px;
      top: 10px; left: 5px;
    }
    &::before {
      transform: rotate(-45deg);
    }
    &::after {
      transform: rotate(45deg);
    }
  }
}
</style>
