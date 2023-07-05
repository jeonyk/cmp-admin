
<template>
  <div>
    <el-dialog
      :visible.sync="publicProject.view"
      :title="publicProject.orderNo"
      width="1020px"
      top="5vh"
      @close="loading ? null : close()"
    >
      <div class="aws-project-todo-modal task-project-wrapper">
        <section id="info-section">
          <dashboard-panel
            :title="$t('common.MODAL.projectInfo')"
            :padding-top="0"
          >
            <vertical-table
              :data="publicProject"
              :columns="field === 'todo' ? columns : removeColumn(columns, 'workResult')"
              type="horizontal"
            >
              <template #workResult="{ row }">
                <div
                  class="cell-flex-wrap"
                  v-if="row.workResult"
                >
                  <cmp-status-tag
                    v-if="row.workResult"
                    :type="workResult[row.workResult].type"
                    :contents="row.workResult !== 'PROCEED' ? $t(workResult[row.workResult].contents) : undefined"
                    :tooltip="!!row.failMessage"
                    :tooltip-cont="convertFailMessage(row.failMessage)"
                    tooltip-position="bottom"
                  >
                    <div v-if="row.workResult === 'PROCEED'">
                      <i
                        class="el-icon-loading"
                        style="margin-right: 5px;"
                      />
                      <span>{{ $t('task.TODO.working') }}</span>
                    </div>
                  </cmp-status-tag>
                  <button
                    v-if="publicProject.workResult === 'ERROR' && field === 'todo'"
                    class="button"
                    style="margin-left: 10px;"
                    @click.stop="setResultSuccess"
                  >
                    {{ $t('common.BTN.TASK.success') }}
                  </button>
                </div>
              </template>
              <!-- 작업 상태 -->
            </vertical-table>
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
              <template v-if="field !== 'done' && data && data.orderType === 'NEW'">
                <p>{{ $v('현재 로그인된 계정의 비밀번호를 입력 후 확인 가능합니다.') }}</p>
                <div
                  class="flex-wrap"
                  style="gap: 10px; justify-content: flex-start; align-items: flex-start;"
                >
                  <div>
                    <el-input
                      class="login-input"
                      style="width: 300px"
                      v-model="accountPw"
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
                  >
                    <a
                      v-if="editAccessKey"
                      slot="suffix"
                      class="save-key-btn"
                      @click="validateAccessKey"
                    >
                      {{ $v('저장') }}
                    </a>
                  </el-input>

                  <button
                    v-if="showExecute"
                    class="button -icon"
                    type="is-icon"
                    @click="editAccessKey ? cancelAccessKey() : changeAccessKey()"
                  >
                    <i :class="editAccessKey ? '-close-icon' : '-edit-icon'" />
                  </button>
                </div>
              </template>
            </vertical-table>
          </dashboard-panel>
          <!-- 계정 등록 -->
        </section>

        <div
          class="button-area -center"
          v-if="field === 'todo'"
        >
          <button
            v-if="showExecute"
            class="button"
            size="is-large"
            type="is-primary"
            :disabled="editAccessKey"
            @click="confirmExecuteWork"
          >
            <!-- 작업 실행 -->
            {{ $t('common.BTN.TASK.exec') }}
          </button>
          <button
            v-if="showComplete"
            class="button"
            size="is-large"
            type="is-primary"
            :disabled="editAccessKey"
            @click="setRoleDone"
          >
            <!-- 작업 완료 -->
            {{ $t('common.BTN.TASK.doneExec') }}
          </button>
        </div>
        <!-- [할 일] 작업 실행 / 작업 완료 -->

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
          @click="close()"
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
  </div>
</template>

<script>

import TaskMemo from '../Nutanix/TaskMemo/TaskMemo'
import AWSProjectMixins from './AWSProjectMixins.script'
import API, { DashboardPanel } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  components: {
    'task-memo': TaskMemo,
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
      type: String, // 'todo', 'done'
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
    }),
    /**
     * [작업실행] 버튼 disabled 조건
     */
    showExecute () {
      const { workResult } = this.publicProject
      return workResult === undefined || /ERROR/g.test(workResult)
    },
    /**
     * [작업완료] 버튼 disabled 조건
     */
    showComplete () {
      const { workResult } = this.publicProject
      return /ERROR|DONE/g.test(workResult)
    }
  },
  destroyed () {
    clearTimeout(this.time)
  },
  methods: {
    /**
     * interval 주기적으로 돌리기
     */
    timeout () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(() => this.activePublicProject(this.data, true), 5000)
    },

    async activePublicProject ({ id, project, orderType, ...data }, status) {
      if (!status) return this.close()

      try {
        this.loading = true
        // todo(getTaskTodo) / done(getTaskDone)
        this.publicProjectDetail = (this.field === 'todo') ? await API.work.getTaskTodo(id) : await API.work.getTaskDone(id)

        // 🔸 (220407) AWS 프로젝트는 한개밖에 신청못하니까 ... 일단 이렇게 ... 임시
        const roles = this.publicProjectDetail.roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
        const detail = roles.taskList[0].resourceList[0]

        // 선택 VPC
        const envType = { STG: this.$v('스테이징'), DEV: this.$v('개발'), PRD: this.$v('운영') }
        const environment = detail.orderData?.projectDto?.projectMapDto?.map(({ environment }) => envType[environment]) || []
        const date = (date, format = 'YYYY.MM.DD HH:mm:ss') => this.$options.filters.date(date, format)

        const copyData = Object.assign({
          orderNo: this.publicProjectDetail.orderNo, // 프로젝트 번호
          companyName: `${this.publicProjectDetail.companyName} > ${this.publicProjectDetail.groupName}`, // 관계사
          displayName: detail.orderData.projectDto.region, // 사용 Region
          environment: environment.join('/'), // 선택 VPC
          projectName: this.publicProjectDetail.projectName,
          moduleType: this.publicProjectDetail.moduleType, // Public Cloud 유형
          orderType,
          workResult: detail.proceedStatus, // 작업 상태
          failMessage: detail.taskSendRes ? detail.taskSendRes.failMessage : '-', // 살패 사유
          applyDate: date(this.publicProjectDetail.approvalCreateTime), // 협의 시작일
          doneDate: date(this.publicProjectDetail.doneDate) || '-', // 완료일
          accessKey: detail.orderData.projectDto.accessKey || undefined,
          secretKey: detail.orderData.projectDto.secretKey || undefined,
          regionName: detail.orderData.projectDto.regionName
        })

        // 메모 목록 설정
        this.taskMemoList = {
          orderNo: this.publicProjectDetail.orderNo,
          data: this.publicProjectDetail.orderMemoList?.filter(memo => !memo.isDeleted)
        }

        // console.log(this.publicProjectDetail, 'this.publicProjectDetail')
        // 상세 정보 저장
        this.publicProject = { ...copyData, view: status }

        // accessKey 복사
        this.accessKeyInfo = {
          ...this.publicProject,
          accessKey: this.publicProject.accessKey || undefined,
          secretKey: this.publicProject.secretKey || undefined
        }

        // 인터벌을 돌릴지 확인합니다 workResult 를 확인하여 설정합니다
        if (/WAIT|PROCEED/g.test(this.publicProject.workResult)) this.timeout()
      } catch (error) {
        console.error('@@ activePublicProject : ', error)
        return this.close()
      } finally {
        this.loading = false
      }
    },

    /**
     * [저장] 클릭시 AccessKey 를 검사합니다.
     */
    async validateAccessKey () {
      this.loading = true
      const isValid = await this.checkKey(this.accessKeyInfo)
      this.loading = false
      if (!isValid) return this.$alert(this.$v('Access Key 가 올바르지 않습니다.'), { callback: () => false })

      this.editAccessKey = false
      return this.activePublicProject(this.data, true)
    },

    /**
     * AWS 프로젝트 AccessKey 정보 저장
     */
    async saveKey ({ accessKey, secretKey }) {
      try {
        const roles = this.publicProjectDetail.roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
        const detail = roles.taskList[0].resourceList[0]

        const { orderDataIdx, orderNo, roleIdx, orderType, workType } = detail
        detail.orderData.projectDto = { ...detail.orderData.projectDto, accessKey, secretKey }

        const payload = {
          userId: this.user?.userId,
          userName: this.user?.userName,
          userPosition: this.user?.userPosition,
          groupIdx: this.user?.userGroup,
          groupName: this.user?.userGroupName,
          taskDataList: [{
            orderDataIdx,
            orderNo,
            roleIdx,
            orderType,
            workType,
            orderData: detail.orderData
          }]
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
        this.loading = false
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

    confirmExecuteWork () {
      this.$confirm(this.$v('선택한 자원에 대한 작업을 실행하시겠습니까?'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(async () => this.executeWork())
        .catch(() => false)
    },

    /**
     * [작업 실행]
     */
    async executeWork () {
      const roles = this.publicProjectDetail.roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
      const detail = roles.taskList[0].resourceList[0]

      const { orderDataIdx, orderNo, orderType, workType } = detail
      const reqData = [{ orderDataIdx, orderNo, orderType, workType }]
      const payload = {
        orderNo,
        userId: this.userInfo?.userId,
        userName: this.userInfo?.userName,
        userPosition: this.userInfo?.userPosition,
        groupIdx: this.userInfo?.userGroup,
        groupName: this.userInfo?.userGroupName,
        reqData
      }

      // console.log('@@ payload : ', payload, JSON.stringify(payload))
      const response = await API.work.runTasks(payload)

      if (response.status === 500) {
        const status = response.data.message.split(': ')[1].replace(' )', '')
        const message = { WAIT: this.$t('task.STATE.wait') }[status]
        // `작업 ${message}중인 자원이 있습니다.`
        return this.$alert(this.$t('common.ALERT.CONF.014', { message }))
      } else {
        // 작업 끝났을 때 처리
        this.activePublicProject(this.data, true)
      }
    },

    /**
     * [작업완료] 버튼 클릭시 실행
     */
    setRoleDone () {
      const isProceeding = this.publicProject.workResult === 'PROCEED'
      const isWaiting = this.publicProject.workResult === 'WAIT'
      const isError = this.publicProject.workResult === 'ERROR'

      // 진행중인 작업이 있습니다.
      if (isProceeding) return this.$alert(this.$t('common.ALERT.CONF.006'))

      // 잔여 작업이 있습니다. (실행대기중 이거나 or 넘어가도 되는지 테스트 통과 못했거나)
      if (isWaiting) return this.$alert(this.$t('common.ALERT.CONF.004'))

      // if (isError && !this.isFailMsg) {
      if (isError) {
        // '실패한 작업이 있습니다. <br> 계속 진행하시겠습니까?
        this.$confirm(this.$t('common.ALERT.CONF.001'), '알림', {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$t('common.TERMS.yes'),
          cancelButtonText: this.$t('common.TERMS.no')
        }).then(() => { this.failModal = true })
          .catch(() => false)
        return false
      }

      // 해당 작업을 완료 처리 하시겠습니까?
      return this.$confirm(this.$t('common.CONFIRM.CONF.007'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => this.confirmTask())
        .catch(() => false)
    },

    async confirmTask () {
      try {
        this.loading = true
        const roles = this.publicProjectDetail.roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
        const detail = roles.taskList[0].resourceList[0]

        const { orderType, roleIdx } = detail

        const { userId, userName, userPosition, userGroup, userGroupName } = this.userInfo
        const { orderNo } = this.publicProject
        const payload = {
          orderNo,
          roleIdx,
          roleName: roles.roleName,
          lastRole: roleIdx,
          orderType,
          userId,
          userName,
          userPosition,
          groupIdx: userGroup,
          groupName: userGroupName
        }

        const response = await API.work.updateTodoStatus(payload)

        if (response) {
          // 작업이 완료되었습니다. <br> 한 일로 이동하시겠습니까? <br> 취소 시 할 일 목록으로 이동합니다.
          this.$confirm(this.$t('task.TODO.DETAIL.finishedComplete'), '', {
            dangerouslyUseHTMLString: true,
            confirmButtonText: this.$t('common.BTN.confirm'),
            cancelButtonText: this.$t('common.BTN.cancel')
            // 한 일로 라우트
          }).then(() => this.$router.push({ name: 'task-done' }))
            // 할 일 리스트로 라우트
            .catch(() => this.close(true))
        }

        this.loading = false
        return true
      } catch (error) {
        console.error(error)
        this.loading = false
        // 작업을 완료하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.errorComplete'))
        return false
      }
    },

    /**
     * 성공 처리
     */
    async setResultSuccess (data) {
      const roles = this.publicProjectDetail.roles.filter(role => role.roleMemo === 'AWS프로젝트')[0]
      const detail = roles.taskList[0].resourceList[0]

      const { orderDataIdx } = detail

      const payload = {
        orderDataIdx,
        userId: this.userInfo?.userId,
        userName: this.userInfo?.userName,
        userPosition: this.userInfo?.userPosition,
        groupIdx: this.userInfo?.userGroup,
        groupName: this.userInfo?.userGroupName
      }
      const response = await API.work.createRunTaskResultSuccess(payload)

      if (response) this.activePublicProject(this.data, true)
    },

    /**
     * 실패 후 작업완료 처리 시 실행. 실패 사유 입력 창 뜸.
     */
    async forceComplete () {
      if (!this.failReason) {
        // 실패 사유를 입력해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.enterFail'))
        this.failModal = true
        return
      }

      const taskDone = await this.confirmTask()
      if (taskDone) return this.sendMemo(this.failReason, true)
    },

    /**
     * memo 를 저장합니다.
     */
    async sendMemo (memo, isUser) {
      const user = this.userInfo
      const memoData = {
        companyIdx: user.userCompany,
        companyName: user.userCompanyName,
        groupIdx: user.userGroup,
        groupName: user.userGroupName,
        memo,
        orderNo: this.publicProject.orderNo,
        userId: user.userId,
        userName: user.userName,
        userPosition: user.userPosition
      }

      // 사용자 화면 노출여부 결정
      if (isUser) memoData.isUser = true

      try {
        const insert = await API.work.insertMemo(memoData)

        if (insert) {
          this.activePublicProject(this.data, true)
          this.isFailMsg = false
          this.failReason = undefined
        }
      } catch (error) {
        console.error('@@@ insertMemo Error', error)
      }
    },

    close (call = false) {
      this.publicProject.view = false
      this.accountPw = undefined
      this.hiddenAccessKey = true
      this.editAccessKey = false
      clearTimeout(this.time)

      this.$emit('close')
      if (call) this.$emit('call')
    },

    /**
     * vertical table에서 column을 제거합니다.
     * @param {Array} columns columns
     * @param {String, Array} binding 제거 할 column의 binding 키
     */
    removeColumn (columns, binding) {
      let filteredColumns
      if (Array.isArray(binding)) { // 제거 할 column이 배열로 들어올 때
        filteredColumns = columns.filter(col => !binding.includes(col.binding))
      } else filteredColumns = columns.filter(col => col.binding !== binding)
      filteredColumns[0].colspan = true
      return filteredColumns
    }
  },
  data: root => ({
    loading: false,
    time: null,
    publicProjectDetail: null,
    publicProject: {}, // 프로젝트 결재 모달 데이터
    accessKeyInfo: {
      accessKey: undefined,
      secretKey: undefined
    },
    editAccessKey: false,
    isFailMsg: false,
    taskMemoList: undefined,
    failModal: false,
    failReason: '',
    hiddenAccessKey: true, // access 키 read 가능 여부
    accountPw: '', // 현재 로그인된 계정의 비밀번호 인풋 창에 적힌 값
    failMessage: undefined, // 계정 패스워드 실패 메세지
    columns: [
      { binding: 'projectName', header: root.$v('프로젝트 명') },
      { binding: 'workResult', header: root.$v('작업 상태'), customHtml: true },
      { binding: 'companyName', header: root.$v('관계사') },
      { binding: 'moduleType', header: root.$v('Public Cloud 유형') },
      { binding: 'displayName', header: root.$v('사용 Region') },
      { binding: 'environment', header: root.$v('선택 VPC') },
      { binding: 'applyDate', header: root.$v('협의 시작일') },
      { binding: 'doneDate', header: root.$v('완료일') }
    ],
    accessKeyInfoColumns: [
      { binding: 'accessKey', header: 'Access Key' },
      { binding: 'secretKey', header: 'Secret Access Key' }
    ],
    workResult: {
      WAIT: { type: 'is-wait', contents: 'task.TODO.waitWork' },
      PROCEED: { type: 'is-loading', contents: 'task.TODO.working' },
      DONE: { type: 'is-success', contents: 'common.success' },
      ERROR: { type: 'is-fail', contents: 'common.fail' }
    },
    convertFailMessage (raw) {
      // [시뮬레이션] 실패사유 JSON 데이터 가공 (🟡 JSON 데이터가 풀로 나오지 않은 상태)
      // const message = raw.split(' : ')[1]
      // const result = JSON.parse(message).map(({ code, message }) => {
      //   return `${code} : ${message}`
      // })
      // return result.join('<br>')
      return raw
    }
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

<style lang="scss">
.aws-project-todo-modal {
  .login-input {
    > .el-input__inner {
      &[type=text] {
        & + .el-input__suffix {
          .el-input__suffix-inner {
            .el-icon-view {
              position: relative !important;
              &::before {
                position: absolute;
                display: inline-block !important;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
              }
              &::after {
                content: '';
                position: absolute;
                top: 26%;
                left: 50%;
                transform: translate(-50%, -50%);
                height: 16px;
                width: 1px;
                transform: rotate(-45deg);
                background: $main-red;
              }
            }
          }
        }
      }
    }
  }
}

</style>
