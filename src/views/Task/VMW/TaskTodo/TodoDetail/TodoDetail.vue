<!--
  * 파일명 : TodoDetail.vue
  * 파일 기능 : [할일 > 상세] 페이지 입니다. 주문한 내역의 정보를 볼 수 있으며, 업무를 변경 / 작업 실행 / 작업완료 시킬 수 있습니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 보안그룹 > 경유지 정보 있을 때만 노출, 할 일에서 경유지 정보가 없을 때, 작업 실행 불가능하게 처리
 -->

<template>
  <div class="todo-detail">
    <section
      class="workflow-contents"
      v-loading="isLoading"
    >
      <g-tab :data="taskDetailTab">
        <template #work>
          <div class="workflow-helper-wrap">
            <div class="helpers">
              <a
                class="memo-icon"
                @click="moveTo"
              >
                <span class="-alarm">
                  <span v-if="taskMemoList&&taskMemoList.data"> {{ taskMemoList.data.length }}</span>
                  <span v-else>0</span>
                </span>
              </a>

              <view-box-cnt type="is-white">
                {{ odrDataCount }}
              </view-box-cnt>
              <div
                class="conferece-checklist"
                v-if="checkList.length"
              >
                <conference-checklist
                  :data="checkList"
                  right="-190px"
                  @save="updateTaskTodoChkList"
                />
              </div>
            </div>

            <div class="download-buttons">
              <pdf-download
                file-name="todo"
                :grids="$refs"
              />
            </div>
          </div>
          <!-- /.workflow-helper-wrap -->

          <task-workflow-step
            :data="dataExam"
            :field="tabStep.roleName"
            @change="changeStep"
          />
          <div
            class="total-warpper"
            id="task-total-resource"
            v-loading="loading"
            :element-loading-text="loadingText"
          >
            <div
              v-for="(item, idx) in dataExam"
              :key="idx"
              class="workflow-list"
            >
              <div v-if="item.roleIdx === tabStep.roleIdx">
                <section
                  v-for="(resource, srcIdx) in item.taskList"
                  :key="srcIdx + '_resource'"
                >
                  <template
                    v-if="resource.resourceList.length && (resource.workType === 'COMPUTE' || resource.workType === 'OVA')"
                  >
                    <task-compute
                      class="resource-area"
                      ref="taskCompute"
                      :data="resource.resourceList"
                      :order-type="orderType"
                      field="todo"
                      :order-no="orderNo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>

                  <template
                    v-if="resource.resourceList.length && resource.workType === 'MARKET'"
                  >
                    <task-marketplace
                      class="resource-area"
                      ref="taskMarket"
                      :data="resource.resourceList"
                      field="todo"
                      :order-no="orderNo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>

                  <template
                    v-if="resource.resourceList.length && resource.workType === 'DATABASE'"
                  >
                    <task-database
                      class="resource-area"
                      ref="taskDatabase"
                      :data="resource.resourceList"
                      field="todo"
                      :order-no="orderNo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>

                  <template
                    v-if="resource.resourceList.length && resource.workType === 'STORAGE'"
                  >
                    <task-storage
                      class="resource-area"
                      ref="taskStorage"
                      :data="resource.resourceList"
                      field="todo"
                      :order-no="orderNo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>

                  <template
                    v-if="resource.resourceList.length && resource.workType === 'NETWORK_L4'"
                  >
                    <task-l4
                      class="resource-area"
                      ref="taskNetworkL4"
                      :data="resource.resourceList"
                      field="todo"
                      :order-no="orderNo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>
                  <template
                    v-if="resource.resourceList.length && resource.workType === 'NETWORK_L7'"
                  >
                    <task-l7
                      class="resource-area"
                      ref="taskNetworkL7"
                      :data="resource.resourceList"
                      field="todo"
                      :order-no="orderNo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>

                  <template
                    v-if="resource.resourceList.length && resource.workType === 'SECURITY'"
                  >
                    <task-security
                      class="resource-area"
                      ref="taskSecurity"
                      :data="resource.resourceList"
                      field="todo"
                      :order-no="orderNo"
                      :order-info.sync="orderInfo"
                      :editable="resource.editable && tabStep.roleIdx === currentStep"
                      :is-auto="isAuto"
                      :all-success="resource.allSuccess"
                      @refresh-todo="setTaskTodoInfo"
                      @run-interval="setIntervalFun"
                      @update="saveUpdatedData"
                      use-checkbox
                    />
                  </template>
                </section>

                <div
                  class="big-button-area has-border"
                  data-html2canvas-ignore="true"
                >
                  <button
                    class="button"
                    size="is-large"
                    type="is-primary"
                    :disabled="isAuto"
                    v-if="
                      item.dataCount
                        && currentStep===tabStep.roleIdx
                        && checkRolePerm(item)
                    "
                    @click="setRoleDone(item)"
                  >
                    <!-- 작업 완료 -->
                    {{ $t('common.BTN.TASK.doneExec') }}
                  </button>
                </div>
              </div>
            </div>

            <div
              class="empty-data"
              v-if="isEmpty()"
            >
              {{ $t('common.PLACEHOLDER.noData') }}
            </div>
          </div>
        </template>
        <!-- 업무 내용 -->

        <template #order>
          <task-detail-apply :data="taskTodoInfo" />
        </template>
      <!-- 주문 정보 -->
      </g-tab>
    </section>
    <!-- /.workflow-contents -->

    <section id="memo-section">
      <h5 class="product-title">
        {{ $t('task.TODO.DETAIL.note') }}
      </h5>
      <task-memo
        :data="taskMemoList"
        @refresh-memo="setTaskTodoInfo"
      />
    </section>

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
import ViewBox from '@/components/ViewBoxCnt/ViewBoxCnt'
import TaskWorkflowStep from '@/components/TaskWorkflowStep/TaskWorkflowStep'
import PDFDownload from '@/components/PDFDownload/PDFDownload'

import TaskCompute from '../../TaskResource/TaskCompute/TaskCompute'
import TaskMarketplace from '../../TaskResource/TaskMarketplace/TaskMarketplace'
import TaskDatabase from '../../TaskResource/TaskDatabase/TaskDatabase'
import TaskStorage from '../../TaskResource/TaskStorage/TaskStorage'
import TaskL4 from '../../TaskResource/TaskNetwork/TaskL4/TaskL4'
import TaskL7 from '../../TaskResource/TaskNetwork/TaskL7/TaskL7'
import TaskSecurity from '../../TaskResource/TaskSecurity/TaskSecurity'
import TaskDetailCommon from '../../TaskDetailCommon'

import TaskDetailApply from './TaskDetailApply'
import TaskMemo from '../../TaskMemo/TaskMemo'
import ConferenceCheckList from '@/components/ConferenceCheckList/ConferenceCheckList'
import API from '@/components/Apis/'
import { mapState } from 'vuex'

import Dayjs from 'dayjs'

export default {
  name: 'TodoDetail',
  components: {
    'task-workflow-step': TaskWorkflowStep,
    'pdf-download': PDFDownload,
    'conference-checklist': ConferenceCheckList,
    'view-box-cnt': ViewBox,

    'task-compute': TaskCompute,
    'task-marketplace': TaskMarketplace,
    'task-database': TaskDatabase,
    'task-storage': TaskStorage,
    'task-l4': TaskL4,
    'task-l7': TaskL7,
    'task-security': TaskSecurity,
    'task-detail-apply': TaskDetailApply,
    'task-memo': TaskMemo
  },
  mixins: [TaskDetailCommon],
  mounted () {
    this.init()
    this.getITSM()
  },
  watch: {
    '$route' () {
      clearInterval(this.interval)
      this.init()
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.auth.user
    })
  },
  destroyed () {
    clearInterval(this.interval)
  },
  methods: {
    async init () {
      this.orderNo = this.$route.params.id
      this.setRolePerm()
      this.setBreadCrumbs(this.taskTodoInfo)
      await this.setTaskTodoInfo(this.orderNo)
      this.startInterval()
    },
    async setRolePerm () {
      if (this.userInfo?.userPermLevel !== 0) {
        this.userPermUpperRole = await this.userInfo?.userPermUpperRoleList?.map(item => item.roleUpper)
      }
    },

    async getITSM () {
      try {
        const response = await API.work.getItsm()
        this.isITSM = response.length > 0
      } catch (error) {
        console.error('@@ getITSM : ', error)
      }
    },
    checkRolePerm (data) {
      let result = false
      if (this.userInfo?.userPermLevel === 0) {
        result = true
      } else {
        const permitRole = data.roleIdx

        for (const item of this.userPermUpperRole) {
          if (item === permitRole) {
            result = true
            break
          }
        }
      }

      return result
    },
    async startInterval () {
      this.interval = setInterval(() => {
        this.intervalFunction()
        // this.setTaskTodoInfo(this.orderNo, true)
      }, 30000)
      // }, 1000) // 🌸 디버깅용
    },
    setIntervalFun () {
      this.setTaskTodoInfo(this.orderNo)
    },
    async intervalFunction () {
      // console.log('@@ intervalFunction')
      const refList = ['taskCompute', 'taskMarket', 'taskDatabase', 'taskStorage', 'taskNetworkL4', 'taskNetworkL7', 'taskSecurity']
      let workResult = null
      let response = await API.workMngTask.getTaskTodo(this.orderNo)
      // 자동/수동인지 확인
      const todoType = response?.todoType // [AUTO/MANUAL]
      this.isAuto = todoType === 'AUTO' && response.taskDataStatus !== 'ERROR'
      this.roleDataList = response.roleDataList

      response = response.roles?.filter(item => item.taskList)
      const hasRolePerm = this.checkRolePerm(this.tabStep) // 권한이 있는경우
      const nowStep = this.tabStep.roleIdx === this.currentStep // 현재 플로우 인지

      await response.forEach(role => {
        role.taskList.forEach(item => {
          item.resourceList.forEach(res => {
            for (let j = 0; j < refList.length; j++) {
              const ref = this.$refs[refList[j]]

              // 각 자원에 목록이 있는지 확인 (Compute/MP/DB ... )
              if (!ref || !ref[0] || !ref[0].tableData) continue

              // 해당 자원의 테이블들을 순회합니다
              for (const i in ref[0].tableData) {
                const tableData = ref[0].tableData[i]

                if (tableData.meta.orderDataIdx === res.orderDataIdx) {
                  workResult = { ...res.taskSendRes }
                  workResult.dataStatus = res?.proceedStatus
                  tableData.workResult = workResult

                  const disableStatus = ['DONE', 'WAIT', 'PROCEED']

                  // [성공, 작업 대기, 진행중] 인 경우
                  // [isAuto] 인 경우 :: 작업완료, 작업실행, 변경 모두 disabled 시킵니다
                  if (workResult?.isSuccess || disableStatus.includes(workResult.dataStatus) || this.isAuto) {
                    // 체크박스를 disabled 합니다
                    tableData.checked = false
                    tableData.disable = true

                  // [실패, 상태 없음] 인 경우
                  } else {
                    // [상태 없음]
                    // [상태 없음] (삭제자원)
                    if ((!workResult.dataStatus && tableData.meta.cancelDate)) {
                      tableData.checked = false
                      tableData.disable = true

                      // 권한 있으면서 && (작업 완료 상태가 아닌) 현재 플로우 이며 && 워크플로우에서 수정 가능한 자원의 경우만
                      if (hasRolePerm && nowStep && item.workFlowTaskExecutePerm === false) tableData.disable = false

                    // [실패]
                    } else {
                      // [실패]는 모두 checkable 하도록 설정?
                      // tableData.disable = false

                      // [자동] 인데 [실패] 인 경우만 체크박스 checkable 설정 (자동인데 나머지인 경우는 모두 disabled)
                      if (todoType === 'AUTO' && tableData.workResult.dataStatus !== 'ERROR') {
                        tableData.disable = true
                      }
                    }
                  }
                }

                // 내부 자원들이 [변경중] 일 때 체크박스 모두 disabled
                if (ref[0].isEditing) {
                  tableData.disable = true
                }
              }
            }
          })
        })
      })
    },
    /**
     * 할 일 데이터를 세팅합니다.
     * @param {String} 주문번호
     */
    async setTaskTodoInfo (params) {
      try {
        const response = await API.workMngTask.getTaskTodo(params)
        console.log('@@ setTaskTodoInfo : ', response)
        if (!response) {
          this.$router.replace({ name: 'not-found-status', params: { code: 500 } })
          return
        }

        // 한일인 경우 페이지 뒤로가기
        if (/DONE/gi.test(response.proceedStatus)) {
          this.$alert('해당 주문이 존재하지 않습니다. <br> 목록으로 이동합니다.', {
            dangerouslyUseHTMLString: true,
            callback: () => this.$router.back()
          })
          return
        }

        this.orderInfo = {
          orderDataIdx: response.orderIdx,
          orderNo: response.orderNo,
          orderType: response.orderType,
          userId: response.userId,
          userName: response.userName
        }
        // 주문 정보 항목
        this.orderType = response.orderType
        this.taskTodoInfo = {
          orderType: response.orderType,
          ownerCompanyName: response.ownerCompanyName,
          projectName: response.projectName,
          deparment: response.groupName,
          chargeDate: '-',
          finishTime: response.finishTime,
          proceedStatus: response.proceedStatus,
          taskDataStatus: response.taskDataStatus, // 작업 상태
          companyName: response.companyName,
          groupName: response.groupName,
          userName: response.userName,
          approvalCreateTime: response.approvalCreateTime,
          serviceDate: response.serviceDate
        }
        // console.log('@@ taskTodoInfo : ', this.taskTodoInfo)
        // let step = 0
        // if (this.userInfo?.userPermLevel === 0) {
        //   step = response.currentStep
        // } else {
        //   console.log(this.userPermUpperRole)
        //   step = this.userPermUpperRole.find(role => role === response.currentStep)
        //   if (!step) step = this.userPermUpperRole[0]
        // }
        // this.currentStep = step

        this.currentStep = response.currentStep
        this.lastStep = response.lastStep
        this.taskMemoList = {
          orderNo: response.orderNo,
          data: response.orderMemoList?.filter(memo => !memo.isDeleted)
        }
        this.workFlowJson = response.roles?.filter(item => item.taskList)
        if (this.workFlowJson?.length) this.setTabStep()

        // 자동/수동인지 확인
        this.isAuto = response.todoType === 'AUTO' && response.taskDataStatus !== 'ERROR'

        for (const item in this.workFlowJson) {
          let count = 0
          if (!this.workFlowJson[item].taskList) continue
          this.workFlowJson[item].taskList.forEach(data => {
            // workflow 기반하여 편집 가능한 경우 editable
            data.editable = !!data.workFlowTaskExecutePerm
            data.resourceList = data.resourceList.map(item => {
              // console.log('@@ item : ', item)
              const result = { ...item.orderData }

              // [해당 주문이 자동/수동]인지에 대한 정보를 각각의 row 에 추가
              result.autoStatus = {
                todoType: response.todoType,
                taskDataStatus: response.taskDataStatus
              }

              result.meta = {}
              result.meta = {
                orderDataIdx: item.orderDataIdx,
                orderNo: item.orderNo,
                proceedStatus: item.proceedStatus,
                orderType: item.orderType,
                workType: item.workType,
                deleteDate: item.deleteDate,
                cancelDate: item.cancelDate,
                userId: item.userId,
                userName: item.userName
              }
              // console.log('@@ result.meta : ', result.meta)
              result.workResult = {}
              if (item.taskSendRes) {
                result.workResult = { ...item.taskSendRes }
              }
              result.workResult.dataStatus = item.proceedStatus
              // console.log('@@ result.workResult : ', result.workResult)

              // [작업 상태] 가 [성공] 이거나 || [완료]인 경우
              if (result.workResult?.isSuccess || item.proceedStatus === 'DONE') {
                result.checked = false
                result.disable = true

              // [작업 상태] 가 [진행중, 실패, 없는 경우]
              } else {
                // [작업 상태]가 없고 && 삭제취소날짜(cancelDate) 가 있는 경우
                if (!result.workResult.dataStatus && result.meta.cancelDate) {
                  result.checked = false
                  result.disable = true
                } else {
                  result.disable = false
                }
              }

              return result
            })
            data.allSuccess = null
            let result = true
            for (const index in data.resourceList) {
              if (!data.resourceList[index].workResult || !data.resourceList[index].workResult?.isSuccess) {
                result = false
                break
              }
            }
            data.allSuccess = result
            count = count + data.resourceCount
          })
          this.workFlowJson[item].count = count
        }

        const dataExam = this.workFlowJson.filter(item => item.count)
        if (dataExam.length <= 0) return
        dataExam.forEach(e => {
          if (this.userInfo?.userPermLevel === 0) {
            e.isWriteRole = true
          } else if (this.userInfo.userPermUpperRoleList) {
            for (let i = 0; i < this.userInfo.userPermUpperRoleList.length; i++) {
            // console.log(this.userInfo.userPermUpperRoleList[i].roleUpper)
              if (e.roleIdx === this.userInfo.userPermUpperRoleList[i].roleUpper) {
                e.isWriteRole = true
              // this.isOrderMemoRoel = true
              }
            }
          }
        })
        this.dataExam = dataExam
        // console.log('dataExam', this.dataExam)
        this.odrDataCount = response.odrDataCount
        this.roleDataList = response.roleDataList
        // setTabStep() > changeStep()에서 세팅해주기 때문에 필요 없어보임.
        // this.setAfterChecklist(this.currentStep)
        this.loading = false
        this.intervalFunction()
        this.setModBreadCrumbs(this.taskTodoInfo)
      } catch (error) {
        console.error(error)
        this.loading = false
      }
    },
    async getTaskResult () {
      try {
        return await API.workMngTask.getTaskResult(this.orderNo)
      } catch (error) {
        console.error(error)
      }
    },
    initTable () {
      this.computeGridData = []
      this.databaseGridData = []
      this.storageGridData = []
      this.l4GridData = []
      this.l7GridData = []
      this.securityGridData = []
      this.marketplaceGridData = []
    },
    /**
     * 데이터를 저장할 때
     */
    async saveUpdatedData (data) {
      try {
        const taskDataList = data.map(item => {
          const taskData = { ...item.meta }
          taskData.userId = this.userInfo?.userId
          taskData.userName = this.userInfo?.userName
          taskData.userPosition = this.userInfo?.userPosition
          taskData.groupIdx = this.userInfo?.userGroup
          taskData.groupName = this.userInfo?.userGroupName
          taskData.orderData = item
          return taskData
        })

        const payload = {
          userId: this.userInfo?.userId,
          userName: this.userInfo?.userName,
          userPosition: this.userInfo?.userPosition,
          groupIdx: this.userInfo?.userGroup,
          groupName: this.userInfo?.userGroupName,
          taskDataList
        }

        await API.task.insertTaskData(payload)
        this.$alert(this.$t('common.ALERT.BASE.049'), { // 저장되었습니다.
          callback: () => {
            // 전체 데이터를 다시 가져옵니다.
            return this.setTaskTodoInfo(this.orderNo)
          }
        })
      } catch (error) {
        console.error(error)
        // 작업을 변경하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.errorSave'), {
          dangerouslyUseHTMLString: true,
          callback: () => this.setTaskTodoInfo(this.orderNo)
        })
      }
    },
    /**
     * memo 를 저장합니다.
     */
    async sendMemo (memo, isUser) {
      const user = this.userInfo
      const orderNo = this.orderNo
      const memoData = {
        companyIdx: user.userCompany,
        companyName: user.userCompanyName,
        groupIdx: user.userGroup,
        groupName: user.userGroupName,
        memo,
        orderNo,
        userId: user.userId,
        userName: user.userName,
        userPosition: user.userPosition
      }

      // 사용자 화면 노출여부 결정
      if (isUser) memoData.isUser = true

      try {
        const insert = await API.task.insertMemo(memoData)

        if (insert) {
          // 마지막이 아닌 경우만
          if (this.currentStep !== this.lastStep) this.setTaskTodoInfo(this.orderNo)
          this.isFailMsg = false
        }
      } catch (error) {
        console.error('@@@ insertMemo Error', error)
      }
    },

    /**
     * 작업완료 버튼 클릭 시 실행.
     */
    setRoleDone (param) {
      if (this.orderInfo.orderType !== 'CHANGE') return this.checkNormalValidation()
      else this.checkChangeValidation()
    },

    /**
     * [신규 자원] / [삭제 자원] 일때는 해당 Validation 사용
     */
    checkNormalValidation () {
      // 고도화 TODO : 확인사항 확인 >> 확인사항 update가 없는 경우 alert
      if (Object.keys(this.roleDataList).length <= 0) return false
      else {
        const isProceeding = this.roleDataList[this.currentStep].some(item => item.proceedStatus === 'PROCEED')
        const isWaiting = this.roleDataList[this.currentStep].some(item => item.proceedStatus === 'WAIT')
        const isError = this.roleDataList[this.currentStep].some(item => item.proceedStatus === 'ERROR')

        // 넘어가도 되는지 테스트 (작업 실행한적이 있는지 확인)
        const canIGo = this.roleDataList[this.currentStep].every(item => {
          // 실행한 적이 있고 삭제취소날짜(cancelDate)가 없거나 or 실행한적이 없고 삭제취소날짜가 있거나 => 둘 다 작업완료 넘어가도 됨.
          return (item.proceedStatus && !item.cancelDate) || (!item.proceedStatus && item.cancelDate)
        })

        if (isProceeding) {
          // '진행중인 작업이 있습니다.'
          return this.$alert(this.$t('common.ALERT.CONF.006'))
        }
        // 실행대기중 이거나 or 넘어가도 되는지 테스트 통과 못했거나
        if (isWaiting || !canIGo) {
          // '잔여 작업이 있습니다.'
          return this.$alert(this.$t('common.ALERT.CONF.004'))
        }

        if (isError && !this.isFailMsg) {
          // '실패한 작업이 있습니다. <br> 계속 진행하시겠습니까?
          this.$confirm(this.$t('common.ALERT.CONF.001'), '알림', {
            dangerouslyUseHTMLString: true,
            confirmButtonText: this.$t('common.TERMS.yes'),
            cancelButtonText: this.$t('common.TERMS.no')
          }).then(() => {
            this.failModal = true
          }).catch(() => false)
          return false
        }

        // 해당 작업을 완료 처리 하시겠습니까?
        return this.$confirm(this.$t('common.CONFIRM.CONF.007'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(async () => this.confirmTask())
      }
    },

    /**
     * [자원 변경] 건일 경우, 신세계용인지/외부용인지 판별하여 Validation 을 처리합니다.
     * 자원변경은 [작업실행] 이라는 개념이 없어서 validation 처리는 그냥 무시하면 됨
     */
    checkChangeValidation () {
      // [신세계]일 경우 ? [변경] 건의 Compute 는 작업상태 있어야 작업 완료 가능
      // 그 외의 경우 ? [변경] 건의 Compute/Storage 만 작업상태 상관 없이 작업완료 기능
      // (기타 나머지 자원들은 아직 변경이라는 개념이 개발이 안된 상태라서 그냥 모두 true로 처리 - 추후에 개발되면 변경될 수 있음)

      const confirm = () => {
        return this.$confirm(this.$t('common.CONFIRM.CONF.007'), '알림', { // 해당 작업을 완료 처리 하시겠습니까?
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        })
          .then(async () => this.confirmTask())
          .catch(() => false)
      }

      if (this.isITSM === true) {
        let compute
        this.roleDataList[this.currentStep].forEach((role, idx) => {
          if (role.workType === 'COMPUTE') {
            compute = this.roleDataList[this.currentStep].splice(idx, 1)
            return false
          }
        })

        // [변경] 건에 compute 자원이 있는경우 Compute 항목만 검사
        if (compute !== undefined) {
          const isProceeding = compute.some(item => item.proceedStatus === 'PROCEED') // 진행중인 경우
          const isWaiting = compute.some(item => item.proceedStatus === 'WAIT') // 실행대기중인 경우
          const isError = compute.some(item => item.proceedStatus === 'ERROR') // 실패건인 경우

          // 넘어가도 되는지 테스트 (작업 실행한적이 있는지 확인)
          const canIGo = compute.every(item => {
          // 실행한 적이 있고 삭제취소날짜(cancelDate)가 없거나 or 실행한적이 없고 삭제취소날짜가 있거나 => 둘 다 작업완료 넘어가도 됨.
            return (item.proceedStatus && !item.cancelDate) || (!item.proceedStatus && item.cancelDate)
          })

          if (isProceeding) { return this.$alert(this.$t('common.ALERT.CONF.006')) } // '진행중인 작업이 있습니다.'
          if (isWaiting || !canIGo) { return this.$alert(this.$t('common.ALERT.CONF.004')) } // '잔여 작업이 있습니다.'

          if (isError && !this.isFailMsg) {
            // '실패한 작업이 있습니다. <br> 계속 진행하시겠습니까?
            this.$confirm(this.$t('common.ALERT.CONF.001'), '알림', {
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('common.TERMS.yes'),
              cancelButtonText: this.$t('common.TERMS.no')
            }).then(() => {
              this.failModal = true
            }).catch(() => false)
            return false
          }

          return confirm()
        }

        // Storage, DB, MP 등 기타 자원은 ByPass
        return confirm()
      }
      // /. 신세계 버전의 경우

      // 기타 다른 버전의 [변경]인 경우 (Compute / Storage 만 자원에 상관없이 모두 ByPass)
      // DB, MP 등 기타 자원은 변경 기능이 없어서 그냥 일단 모두 ByPass 처리
      return confirm()
    },

    /**
     * 할 일을 완료 함.
     */
    async confirmTask () {
      try {
        this.isLoading = true

        const { userId, userName, userPosition, userGroup, userGroupName } = this.userInfo
        const payload = {
          orderNo: this.orderNo,
          roleIdx: this.tabStep.roleIdx,
          roleName: this.tabStep.roleName,
          lastRole: this.lastStep,
          orderType: this.taskTodoInfo?.orderType,
          userId,
          userName,
          userPosition,
          groupIdx: userGroup,
          groupName: userGroupName
        }

        const response = await API.workMngTask.updateTodoStatus(payload)
        if (response) {
          if (this.lastStep === this.currentStep) {
            // 작업이 완료되었습니다. <br> 한 일로 이동하시겠습니까? <br> 취소 시 할 일 목록으로 이동합니다.
            this.$confirm(this.$t('task.TODO.DETAIL.finishedComplete'), '', {
              dangerouslyUseHTMLString: true,
              confirmButtonText: this.$t('common.BTN.confirm'),
              cancelButtonText: this.$t('common.BTN.cancel')
            }).then(() => {
              // 한 일로 라우트
              return this.$router.push({ name: 'task-done' })
            }).catch(() => {
              // 할 일 리스트로 라우트
              return this.$router.push({ name: 'task-todo' })
            })
          } else {
            await this.setTaskTodoInfo(this.orderNo)
          }
        }

        this.isLoading = false
        return true
      } catch (error) {
        console.error(error)
        this.isLoading = false
        // 작업을 완료하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.errorComplete'))
        return false
      }
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
      const isUser = true
      if (taskDone) return this.sendMemo(this.failReason, isUser)
    },
    settingBroadCrumbStats (data) {
      let taskStatus = this.$t('task.STATE.unde') // 미정
      let taskColor = 'wait'
      let state

      if (data?.finishTime) {
        const today = Dayjs(new Date())
        const date = Dayjs(new Date(data.finishTime))
        const interval = this.$options.filters.interval(today, date)

        const taskDataStatus = data.taskDataStatus
        if (taskDataStatus) {
          const type = {
            WAIT: () => { return interval > 0 ? 'DELAY' : 'WAIT' }, // WAIT: 상태 X - 지연/대기 설정
            ERROR: () => 'FAIL', // ERROR: 작업에 실패가 1개라도 있음
            PROCEED: () => 'PROCEED' // PROCEED: 처리중 :: 작업에 작업대기/작업중/성공 있음
          }

          state = type[taskDataStatus]()
        } else {
          // null 일경우 내부에 오류가 있음
          state = 'ERROR'
        }

        taskStatus = `D${interval < 0 ? '' : '+'}${interval} ${this.status[state].ko}`
        taskColor = this.status[state].color
      }

      return { taskStatus, taskColor }
    },
    setBreadCrumbs (data) {
      const obj = this.settingBroadCrumbStats(data)
      // breadcrubs 설정
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.orderNo,
        path: '',
        statusKo: obj.taskStatus,
        status: obj.taskColor
      })
    },
    setModBreadCrumbs (data) {
      const obj = this.settingBroadCrumbStats(data)
      // breadcrubs 설정
      this.$store.commit('common/MOD_LAST_PARAMETERS', {
        label: this.orderNo,
        path: '',
        statusKo: obj.taskStatus,
        status: obj.taskColor
      })
    },
    /**
     * 워크플로우 스탭 클릭 시 실행.
     */
    changeStep (step) {
      this.tabStep = {
        roleName: step.roleName,
        roleIdx: step.roleIdx,
        isWrite: step.isWriteRole ? step.isWriteRole : false
      }
      this.intervalFunction()
      this.setAfterChecklist(this.tabStep.roleIdx)
    },
    /**
     * 워크플로우 스탭의 탭 데이터 세팅.
     */
    setTabStep () {
      const roleList = []
      if (this.userInfo?.userPermLevel === 0) {
        console.debug('@@ 최고관리자 계정')
        for (const workFlow of this.workFlowJson) {
          roleList.push(workFlow)
        }
      } else {
        console.debug('@@ 업무관리자 계정')
        for (const workFlow of this.workFlowJson) {
          for (const role of this.userPermUpperRole) {
            if (workFlow.roleIdx === role) roleList.push(workFlow)
          }
        }
      }
      let tabRole = roleList?.length > 0 ? roleList[0] : null
      const currentRole = roleList.filter(item => item.roleIdx === this.currentStep)
      if (currentRole.length > 0) tabRole = currentRole[0]
      if (tabRole) {
        this.changeStep(tabRole)
      } else {
        this.loading = false
      }
    },
    isEmpty () {
      if (!this.odrDataCount) return true
    },
    moveTo () {
      const memoOffset = document.querySelector('#memo-section').offsetTop
      window.scrollTo({
        top: memoOffset,
        behavior: 'smooth'
      })
    },
    /**
     * 확인사항 데이터 세팅.
     */
    setAfterChecklist (roleIdx) {
      const taskRoleList = this.workFlowJson.filter(item => item.roleIdx === roleIdx)
      let currentTaskroleInfo
      if (taskRoleList.length) currentTaskroleInfo = taskRoleList[0]
      else return
      this.checkList = []
      // console.log('@@ currentTaskroleInfo : ', currentTaskroleInfo)
      if (currentTaskroleInfo.afterCheckList?.length) {
        this.checkList = [...currentTaskroleInfo.afterCheckList] // 체크리스트 세팅
      }
      // console.log('@체크리스트~~', this.checkList)
    },
    /**
     * 확인사항 수정 후 저장 시 실행.
     */
    async updateTaskTodoChkList (chkParam, roleInfo) {
      const userInfo = {
        companyIdx: this.userInfo?.userCompany,
        companyName: this.userInfo?.userCompanyName,
        groupIdx: this.userInfo?.userGroup,
        groupName: this.userInfo?.userGroupName,
        orderNo: this.orderNo,
        roleIdx: this.currentStep,
        userId: this.userInfo?.userId,
        userName: this.userInfo?.userName,
        userPosition: this.userInfo?.userPosition
      }
      const payload = {
        ...userInfo,
        afterCheckList: [...chkParam]
      }
      const res = await API.workMngTask.updateTaskTodoChkList(payload)
      if (res) {
        this.$alert(this.$t('common.ALERT.CONF.009'))
      } else { this.$alert(this.$t('common.ALERT.CONF.010')) }
    }

  },
  data () {
    return {
      isITSM: false, // ITSM 등록 여부 확인
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
        { field: 'work', name: '업무내용', isActive: true, keyPath: 'common.TERMS.business' },
        // { field: 'confirm', name: '확인 사항' },
        { field: 'order', name: '주문 정보', keyPath: 'common.TERMS.orderInfo' }
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
      failReason: ''
    }
  }
}
</script>
<style lang="scss" scoped>
.todo-detail {
  .workflow-helper-wrap {
    // margin: $gap * 3 0 $gap;
    height: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    .helpers {
      display: flex;
      align-items: center;
      > .memo-icon {
        position: relative;
        display: inline-block;
        margin-right: 15px;
        width: 22px;
        height: 21px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../../../../assets/images/icon-bubble@3x.png');
        > .-alarm {
          position: absolute;
          top: -8px;
          right: -8px;
          display: inline-block;
          width: 20px;
          height: 20px;
          font-size: 12px;
          line-height: 20px;
          text-align: center;
          border-radius: 50%;
          background-color: $main-red;
        }
      }
      .conferece-checklist {
        margin-left: $gap;
      }
    }
    > .download-buttons {
      display: flex;
      justify-content: flex-end;
      font-size: 14px;
      color: $color-lightgrey;
      > span {
        margin-left: 30px;
      }
    }
  }
  .total-information {
    margin: $gap 0 $gap * 2;
    border-top: 2px solid $main-black;
    border-bottom: 1px solid $main-black;
    padding: $gap $gap-m;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: $color-lightgrey;
    position: relative;
    > strong {
      height: 13px;
      line-height: 13px;
      font-size: 20px;
    }
    > .total-count {
      height: 24px;
      font-family: 'Roboto';
      line-height: 24px;
      font-size: 16px;

      > span {
        color: #f6bb00;
        font-weight: bold;
        font-size: 24px;
      }
    }
  }
  .empty-data {
    line-height: 50px;
    text-align: center;
  }
  .resource-area {
    margin-bottom: 40px;
  }
  #memo-section {
    margin-top: $gap-m * 2;
    padding: $gap-m * 2;
    background-color: $ticket-back-color;
    border-radius: 20px;
    > .sub-title {
      margin-bottom: 0;
      line-height: normal;
    }
  }
  .has-border {
    border-top: 1px solid $border-color;
    margin-top: 40px;
    padding-top: $gap
  }
}
</style>
