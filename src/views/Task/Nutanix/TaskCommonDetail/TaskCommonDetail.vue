<!--
  * 파일명 : TaskCommonDetail.vue
  * 파일 기능 : [사전협의 > 상세] 페이지 입니다. 결재 내역을 한번에 볼 수 있으며, 주문내역 각각을 승인 / 반려 / 변경 할 수 있습니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할 생성/상세 - 담당자 선택 초기 선택 세팅
 -->

<template>
  <div
    class="task-common-detail"
    v-loading="loading"
  >
    <section class="task-common-header">
      <h2 class="task-common-title">
        <span>{{ $v('주문 정보') }}</span>
        <a
          :class="['mdi', fold ? 'mdi-chevron-up' : 'mdi-chevron-down']"
          style="margin-left: 8px;"
          @click="fold = !fold"
        />
      </h2>

      <div class="top-right-content flex-wrap -flex-end">
        <pdf-download
          v-if="type !== 'CONFERENCE'"
          file-name="todo"
          :grids="$refs"
        />
        <approved-detail-origin
          v-if="type !== 'DONE'"
          class="approval-view"
          :button="$v('결재 문서 조회')"
          :data="clientApprovalDetailRsp"
          :is-review-mode="true"
        />
      </div>

      <conf-detail-apply
        v-if="fold"
        :data="taskData"
      />
      <!-- /. 주문 정보 -->

      <uploaded-documents :data="orderList" />
    </section>

    <section class="task-common-body">
      <h2 class="task-common-title">
        <span>{{ contents.name }}</span>

        <el-tooltip
          effect="light"
          popper-class="guid-content"
          v-if="contents.guide"
        >
          <span class="guide">
            <i class="mdi mdi-information-outline" />
          </span>
          <div
            slot="content"
            class="guide-content"
          >
            <strong>{{ $v('사용 방법 안내') }}</strong>
            <p v-html="$v(contents.guide)" />
          </div>
        </el-tooltip>
      </h2>
      <!-- /. 사전협의/할일/한일 내용, 안내문구 -->

      <article class="body-content">
        <task-resource
          :data="orderList"
          @role-data="$event => roleData = $event"
          @update-source="updateSource"
          @update-resource-info="updateResource"
          @cancel-order="cancelOrder"
          @restore-order="restoreOrder"
          @schedule-order="scheduleOrder"
          @execute-order="executeOrder"
          @delete-order="executeOrder"
          @handmake-order="handmakeOrder"
          @execute-resolve="executeResolve"
          @report-order="reportOrder"
          @apply-approval="applyApproval"
          @complete-work-review="completeWorkReveiw"
          @complete-work-todo="completeWorkReveiw"
          @complete-work-cancel="completeWorkReveiw"
        />
      </article>
    </section>
    <!-- /. -->

    <task-floating-memo :order-no="$route.params.id" />
    <!-- /. 메모 -->

    <cancel-order
      :data="cancelOrderActive.data"
      :active="cancelOrderActive.view"
      @confirm="setDetailData_V3"
      @close="cancelOrderActive = { view: false, data: null }"
    />
    <!-- /. [주문취소] 모달 -->

    <schedule-order
      :data="scheduleOrderActive.data"
      :active="scheduleOrderActive.view"
      @confirm="setDetailData_V3"
      @close="scheduleOrderActive = { view: false, data: null }"
    />
    <!-- /. [예약설정] 모달 -->

    <document-order
      :data="reportOrderActive.data"
      :active="reportOrderActive.view"
      @close="reportOrder(false, {})"
    />
    <!-- /. [보고서 작성/변경] 모달 -->
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { cloneDeep } from 'lodash'
import Dayjs from 'dayjs'
import VueCookies from 'vue-cookies'

import TaskFloatingMemo from '@/components/TaskFloatingMemo/TaskFloatingMemo'
import CancelOrder from '@/components/CancelOrder/CancelOrder'
import ScheduleOrder from '@/components/ScheduleOrder/ScheduleOrder'
import DocumentOrder from '@/components/DocumentDetail/DocumentOrder/DocumentOrder'
import UploadedDocuments from '@/components/UploadedDocuments/UploadedDocuments'
import ApprovedDetailOrigin from '../TaskApproved/ApprovedDetail/ApprovedDetailOrigin'
import ConfDetailApply from './ConfDetailApply'

import TaskResource from '../TaskResource/TaskResource'

import TaskDetailCommon from '../TaskDetailCommon'

import API from '@sd-fe/cmp-core'

export default {
  name: 'TaskCommonDetail',
  components: {
    'conf-detail-apply': ConfDetailApply,
    'task-resource': TaskResource,
    'task-floating-memo': TaskFloatingMemo,
    'cancel-order': CancelOrder,
    'schedule-order': ScheduleOrder,
    'document-order': DocumentOrder,
    'uploaded-documents': UploadedDocuments,

    'approved-detail-origin': ApprovedDetailOrigin
  },
  mixins: [TaskDetailCommon],
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      cloud: state => state.cloud.cloud.toUpperCase(),
      metadata: state => state.metadata
    }),
    type: (root) => (root.name.replace('-detail', '').toUpperCase()), // 현재 페이지가 [사전협의/할일/한일] 상세중 어딘지 알랴줌
    contents () { // 컨텐츠 명 분리
      return {
        'conference-detail': {
          name: this.$v('사전 협의 내용'),
          guide: '- 자원정보 🡪 자원할당 설정 순으로 변경 또는 등록합니다. (역할 특성에 따라 ‘자원정보’가 없을 수도 있습니다<br>- 자원정보 항목에서 조회 또는 변경을 진행할 수 있습니다.<br>- 할당 정보 재수정 시 등록된 보고서는 초기화 됩니다. '
        },
        'todo-detail': {
          name: this.$v('할 일 내용'),
          guide: '- 모든 서비스는 작업 진행이 완료되어야 합니다.<br>- 설정, 자원정보 항목에서 조회를 할 수 있습니다.<br>- 서비스가 성공인 경우 설치프로그램을 다운로드 해주세요.<br>- 작업상태 ＂성공(별도처리)＂ 상태도 ＂성공＂으로 처리하여 결재 가능합니다.'
        },
        'done-detail': {
          name: this.$v('한 일 내용')
        }
      }[this.name]
    }
  },
  provide () {
    return {
      $field_V3: () => this.type, // CONFERENCE, TODO, DONE, APPROVED, APPLY-APPROVAL
      $orderType: () => this.taskData.orderType // NEW, CHANGE, DELETE, URGENT
    }
  },
  created () {
    this.initialize()
  },
  destroyed () {
    clearTimeout(this.time)
  },
  methods: {
    ...mapActions({
      getAllMetaDataForm: 'metadata/getAllMetaDataForm'
    }),

    /**
     * 화면 처음 진입시 설정해줍니다.
     */
    async initialize () {
      this.name = this.$route.name

      this.getAllMetaDataForm() // [메타데이터] 메타데이터 폼을 조회합니다.
      await this.setDetailData_V3()
      if (this.$route.params.id) this.setBreadCrumbs_V3(this.taskData)
    },

    /**
     * 기본 데이터를 세팅해줍니다. (v3)
     */
    async setDetailData_V3 () {
      try {
        const apiName = {
          'conference-detail': 'getWorkReviewDetail',
          'todo-detail': 'getWorkTodoDetail',
          'done-detail': 'getWorkDoneDetail'
        }[this.name]

        const orderNo = this.$route.params.id
        const response = await API.work_v3[apiName](orderNo)

        console.log(response, ` ---- 🍑 ${this.type} Detail >> DATA`)
        if (!response) return

        // 🟦
        const { clientApprovalDetailRsp, ordererCompany, ordererGroup, projectName, projectIdx, orderType, orderReqNote, createTime, orderer, expectDate, memos } = response
        const orderTypeLabel = { NEW: this.$v('신규'), CHANGE: this.$v('변경'), DELETE: this.$v('삭제'), URGENT: this.$v('긴급') }[orderType]

        // 주문정보
        this.taskData = {
          companyName: ordererCompany.name, // 관계사
          groupName: ordererGroup.name, // 조직명
          projectName, // 프로젝트명
          projectIdx,
          orderType, // 구분
          orderTypeLabel, // 구분 (한국어)
          name: orderReqNote, // 주문요청제목
          createTime, // 주문일
          userName: orderer.name, // 주문자
          finishTime: expectDate // 완료희망일
        }
        // this.orderDataList = [...response.orders]

        // [결재 문서 조회] 데이터 세팅
        this.clientApprovalDetailRsp = clientApprovalDetailRsp

        // roleIdx 기반 정렬
        const workRsps = response.workRsps.sort(({ roleIdx: a }, { roleIdx: b }) => {
          if (a > b) return 1
          else if (a < b) return -1
          else return 0
        })

        // 탭 데이터 설정
        this.orderList = workRsps

        // 메모 설정
        this.memoLists = [...memos]

        // [할일] 에서는 계속 새로고침 (임시🟨)
        if (this.type === 'TODO') this.timeout()
      } catch (error) {
        console.error('@@ TaskCommonDetail > setDetailData_V3', error)
        this.$alert(this.$v('티켓이 존재하지 않습니다. <br> 목록으로 이동합니다.'), {
          dangerouslyUseHTMLString: true,
          callback: () => this.$router.go(-1)
        })
      }
    },

    /**
     * [주문취소] 버튼 클릭시 동작
     */
    cancelOrder (checkedData, tab) {
      const rows = checkedData.map(({ srcIdx }) => srcIdx)
      // console.log(rows, tab)
      this.cancelOrderActive = {
        view: true,
        data: { rows, workId: tab.workId }
      }
    },

    /**
     * [주문복원] 버튼 클릭시 동작
     */
    restoreOrder (checkedData, tab) {
      const itemIdxs = checkedData.map(({ srcIdx }) => srcIdx)

      this.$confirm(this.$v('취소하신 자원을 복원하시겠습니까?'))
        .then(async () => {
          try {
            const apiName = {
              CONFERENCE: 'workItemRestore',
              TODO: 'restoreWorkTodo'
            }[this.type]

            await API.work_v3[apiName]({ workId: tab.workId, payload: { itemIdxs } })
            this.setDetailData_V3()
          } catch (error) {
            console.error('@@ restoreOrder > workItemRestore', error)
          }
        })
        .catch(() => false)
    },

    /**
     * [예약설정] 버튼 클릭시 동작
     */
    scheduleOrder (checkedData, tab) {
      const rows = checkedData.map(({ srcIdx }) => srcIdx)
      const [{ autoScheduleAt }] = checkedData
      // console.log(autoScheduleAt, tab)
      this.scheduleOrderActive = {
        view: true,
        data: { rows, workId: tab.workId, type: this.type, autoScheduleAt }
      }
    },

    /**
     * [작업진행] 버튼 클릭시 동작, 실행
     * @param {Boolean} isDelete [작업진행] 버튼 클릭시 false | [즉시삭제] 버튼 클릭시 true
     */
    executeOrder (checkedData, tab, isDelete = false) {
      const rows = checkedData.map(({ srcIdx }) => srcIdx)

      // [즉시삭제] 자원 일땐 다른 API, 다른 메세지 동작함
      const { apiName, confirm } = isDelete
        ? { apiName: 'executeDeleteRunTodo', confirm: this.$v('삭제대기일이 N일 남은 작업입니다. <br> 지금 바로 자원을 삭제하시겠습니까?') }
        : { apiName: 'executeRunTodo', confirm: this.$v('선택한 자원에 대한 작업을 실행하시겠습니까?') }

      // [작업 진행] / [즉시삭제] 실행
      const executeRunTodo = async ({ rows: itemIdxs, workId }) => {
        const { userId, userName, userGroup, userGroupName } = this.user
        let passed = false

        for (const idx of itemIdxs) {
          try {
            const payload = {
              id: userId,
              name: userName,
              groupIdx: userGroup,
              groupName: userGroupName
            }

            await API.work_v3[apiName]({ workId, itemIdxs: idx, payload })
          } catch (error) {
            this.catchMessage(error)
            console.error('@@ TaskCommonDetail > executeRunTodo', error)

            // 하나 에러나면 다음 API 호출 멈춤
            break
          }
        }

        passed = true
        return passed
        // console.log(itemIdxs, workId)
      }

      // console.log(rows, tab)
      this.$confirm(confirm, '알림', {
        confirmButtonText: this.$v('확인'),
        cancelButtonText: this.$v('취소'),
        dangerouslyUseHTMLString: true
      })
        .then(async () => {
          const run = await executeRunTodo({ rows, workId: tab.workId })
          if (run) this.setDetailData_V3()
        })
        .catch(() => false)
    },

    /**
     * [별도처리] 버튼 클릭시 동작, 실행
     * @param {Boolean} isDelete [작업진행] 버튼 클릭시 false | [즉시삭제] 버튼 클릭시 true
     */
    handmakeOrder (checkedData, tab) {
      const rows = checkedData.map(({ srcIdx }) => srcIdx)

      // [즉시삭제] 자원 일땐 다른 API, 다른 메세지 동작함
      const { apiName, confirm } = { apiName: 'executeHandMake', confirm: this.$v('선택한 자원 별도처리 상태로 변경하시겠습니까?') }

      // [작업 진행] / [즉시삭제] 실행
      const executeRunTodo = async ({ rows: itemIdxs, workId }) => {
        const { userId, userName, userGroup, userGroupName } = this.user
        let passed = false

        for (const idx of itemIdxs) {
          try {
            const payload = {
              id: userId,
              name: userName,
              groupIdx: userGroup,
              groupName: userGroupName
            }

            await API.work_v3[apiName]({ workId, itemIdx: idx, payload })
          } catch (error) {
            this.catchMessage(error)
            console.error('@@ TaskCommonDetail > executeRunTodo', error)

            // 하나 에러나면 다음 API 호출 멈춤
            break
          }
        }

        passed = true
        return passed
        // console.log(itemIdxs, workId)
      }

      // console.log(rows, tab)
      this.$confirm(confirm, '알림', {
        confirmButtonText: this.$v('확인'),
        cancelButtonText: this.$v('취소'),
        dangerouslyUseHTMLString: true
      })
        .then(async () => {
          const run = await executeRunTodo({ rows, workId: tab.workId })
          if (run) this.setDetailData_V3()
        })
        .catch(() => false)
    },

    /**
     * [실패 - 상태처리] 버튼 클릭시 동작, 실행
     * @param {Object} value { data, row }
     * @param {Object} tab
     */
    async executeResolve ({ data: payload, row }, { workId }) {
      try {
        const { srcIdx: itemIdx } = row

        // [상태처리] 실행
        // console.log(workId, itemIdx, payload)
        await API.work_v3.executeFailResolve({ workId, itemIdx, payload })
        this.$alert(this.$v('요청하신 상태 처리를 완료하였습니다.'), { callback: this.setDetailData_V3 })
      } catch (error) {
        this.$alert(this.$v('상태 처리도중 문제가 발생하였습니다.'))
        console.error('@@ TaskCommonDetail > executeResolve', error)
      }
    },

    /**
     * [보고서 작성] 버튼 클릭시 동작 (모달 팝업)
     * @param {Boolean} view
     * @param {Object|null} tab
     */
    reportOrder (view, tab) {
      const orderNo = this.$route.params.id
      this.reportOrderActive = {
        view,
        data: { ...tab, orderNo, cloudType: 'PRIVATE', orderType: this.taskData.orderType }
      }
    },

    // =========================================================
    // ============== [할 일로 이동 / 한 일로 이동] ==================
    // =========================================================

    /**
     * [할 일로 이동 / 한 일로 이동] 버튼 클릭시 확인창
     * @param {Object} tab
     * @param {String} $event toTodo(할일로 이동)|toDone(한일로 이동)
     */
    completeWorkReveiw (tab, $event) {
      // [긴급] 자원은 validation pass (자원할당, 작업상태 모두 => 이미 완료된 작업이므로)
      const isUrgent = this.taskData.orderType === 'URGENT'

      const validator = (isUrgent) ? true : this.completeWorkReveiwValidator(tab, $event)
      if (!validator) return

      const { workId } = tab

      const type = {
        toTodo: { // 사전협의 > [할일로 이동]
          confirm: this.$v('할일 단계로 이동 시 이전 단계 작업을 수행 할 수 없습니다. <br> 그래도 이동하시겠습니까?'),
          alert: this.$v('업무가 할일로 이동되었습니다.'),
          apiName: 'completeWorkReveiw'
        },
        toDone: { // 할일 > [한일로 이동]
          confirm: this.$v('한일 단계로 이동 시 이전 단계 작업을 수행 할 수 없습니다. <br> 그래도 이동하시겠습니까?'),
          alert: this.$v('업무가 한일로 이동되었습니다.'),
          apiName: isUrgent ? 'completeWorkReveiw' : 'completeWorkTodo' // [긴급] 은 사전협의 > [한일로 이동] 이라 API 를 workreview 로 찔러야함
        },
        toDoneCancel: { // 사전협의 / 할일 > [한일로 이동]
          confirm: this.$v('한일 단계로 이동 시 이전 단계 작업을 수행 할 수 없습니다. <br> 그래도 이동하시겠습니까?'),
          alert: this.$v('업무가 한일로 이동되었습니다.'),
          apiName: { CONFERENCE: 'setWorkReviewConfirmCancel', TODO: 'setWorkTodoConfirmCancel' }[this.type]
        }
      }[$event]

      return this.$confirm(
        type.confirm, {
          dangerouslyUseHTMLString: true,
          confirmButtonText: this.$v('이동'),
          cancelButtonText: this.$v('취소')
        })
        .then(() => this.setComplete(workId, type))
        .catch(() => false)
    },

    /**
     * [할 일로 이동 / 한 일로 이동] API 동작
     * @param {String} workId
     * @param {Object} type
     */
    async setComplete (workId, { apiName, alert }) {
      try {
        const { userId, userName, userPosition } = this.user

        const payload = {
          id: userId,
          name: userName,
          position: userPosition
        }

        await API.work_v3[apiName](workId, payload)

        this.$alert(alert, { callback: this.setDetailData_V3 })
      } catch (error) {
        this.catchMessage(error)
        console.error('@@ TaskCommonDetail > setComplete', error)
      }
    },

    /**
     * [할 일로 이동 / 한 일로 이동] 버튼 클릭시 validator 분리 생성
     * @param {String} $event toTodo(할일로 이동)|toDone(한일로 이동)
     */
    completeWorkReveiwValidator (tab, $event) {
      // [변경][삭제] 자원은 [자원할당] validation pass
      const isChange = this.taskData.orderType === 'CHANGE'
      const isDelete = this.taskData.orderType === 'DELETE'

      const sourceValidator = (isChange || isDelete) ? true : this.sourceValidator(tab) // [자원할당] 필수요소 검사
      const metaInfoValidator = (isChange || isDelete) ? true : this.metaInfoValidator(tab) // [운영정보] 필수요소 검사
      // const schedulingValidator = this.schedulingValidator(tab) // [예약설정] 필수요소 검사 (230330 예약설정은 이제 필수가 아님?)
      const workStatusValidator = this.workStatusValidator(tab) // [작업상태] 필수요소 검사

      const validator = [
        { condition: sourceValidator, message: this.$v('자원할당 설정에 미설정 항목이 있습니다.<br>다시 확인 후 진행해주세요.') },
        { condition: metaInfoValidator, message: this.$v('운영정보의 필수값에 미설정 항목이 있습니다.<br>다시 확인 후 진행해주세요.') }
        // { condition: schedulingValidator, message: this.$v('예약설정에 미설정된 자원이 있습니다.<br>다시 확인 후 진행해주세요.') },
      ]

      // toTodo: 사전협의 > [할일로 이동]
      // toDone: 할일 > [한일로 이동]
      // toDoneCancel: 사전협의/할일 > [한일로 이동]
      const pass = /toDone|toDoneCancel/
      if (pass.test($event)) validator.push({ condition: workStatusValidator, message: this.$v('작업상태 중 미처리 항목이 있습니다.<br>다시 확인 후 진행해주세요.') })

      return validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message, { dangerouslyUseHTMLString: true })
        return condition
      })
    },

    // =========================================================
    // ====================== [결재신청] ==========================
    // =========================================================

    /**
     * [결재신청] 버튼 클릭시 페이지 이동
     * @param {Object} tab tab 정보
     * @param {String} $event toTodo(할일로 이동)|toDone(한일로 이동)
     * @return {Boolean}
     */
    applyApproval (tab) {
      const step = this.$route.name.split('-')[0]

      // [결재신청] 페이지로 이동전 validator 설정
      const validator = this.applyApprovalValidator(tab, step)
      if (!validator) return

      const { workId, setting, roleIdx: idx } = tab
      const { orderType, finishTime: expectDate } = this.taskData
      const orderNo = workId.split('-')[0]

      const query = {
        orderType, // 신규/변경/삭제
        roleIdx: Number(idx),
        useDoc: setting.useDoc, // 보고서 사용여부
        workState: setting.workState, // 현재 탭의 상태
        expectDate // 완료희망일
      }

      return this.$router.push({
        name: 'task-apply-approval',
        params: { step, orderNo },
        query
      })
    },

    /**
     * [결재신청] 버튼 클릭시 사용하는 validatior
     * @param { Object } tab tab 정보
     */
    applyApprovalValidator (tab, step) {
      // [긴급][변경][삭제] 자원은 [자원할당] validation pass
      const isUrgent = this.taskData.orderType === 'URGENT'
      const isChange = this.taskData.orderType === 'CHANGE'
      const isDelete = this.taskData.orderType === 'DELETE'

      const sourceValidator = (isUrgent || isChange || isDelete) ? true : this.sourceValidator(tab) // [자원할당] 필수요소 검사
      const metaInfoValidator = (isUrgent || isChange || isDelete) ? true : this.metaInfoValidator(tab) // [운영정보] 필수요소 검사
      // const schedulingValidator = this.schedulingValidator(tab) // [예약설정] 필수요소 검사 (230330 예약설정은 이제 필수가 아님?)
      const workStatusValidator = this.workStatusValidator(tab) // [작업상태] 필수요소 검사
      const approvalDocument = this.approvalDocumentValidator(tab) // [보고서] 필수 요소 검사

      // 조건 설정 시작 => 상세한 validator 조건은 TaskCommonButtons.vue 에서 확인할 수 있음
      const validator = [
        { condition: sourceValidator, message: this.$v('자원할당 설정에 미설정 항목이 있습니다.<br>다시 확인 후 진행해주세요.') },
        { condition: metaInfoValidator, message: this.$v('운영정보의 필수값에 미설정 항목이 있습니다.<br>다시 확인 후 진행해주세요.') },
        // { condition: schedulingValidator, message: this.$v('예약설정에 미설정된 자원이 있습니다.<br>다시 확인 후 진행해주세요.') },
        { condition: approvalDocument, message: this.$v('보고서가 등록되지 않았습니다.<br>다시 확인 후 진행해주세요.') }
      ]

      // toTodo: 사전협의 > [결재신청] > [할일로 이동]
      // toDone: 할일 > [결재신청] > [한일로 이동]
      if (step === 'todo') validator.push({ condition: workStatusValidator, message: this.$v('작업상태 중 미처리 항목이 있습니다.<br>다시 확인 후 진행해주세요.') })

      // console.log(validator)
      return validator.every(({ condition, message }) => {
        if (!condition) this.$alert(message, { dangerouslyUseHTMLString: true })
        return condition
      })
    },

    /**
     * [자원 할당]이 등록되어있는지 확인합니다.
     * @param { String } field 현재 보고있는 탭의 role 정보
     */
    sourceValidator ({ field, ...tab }) {
      // console.log(field, this.roleData[field])

      // 🌸 디버깅용 표기 (디버깅시 주석해제하고 보면 됨)
      // console.clear() // 🌸
      const roleData = cloneDeep(this.roleData[field])
      // console.log(roleData)

      // NTX 현재 보고있는 탭 자원들의 [자원할당] validation 설정 (자원할당이 있는 경우만 확인)
      const mustCheck = /COMPUTE|VM_TEMPLATE|DATABASE|FILE_SERVER|NETWORK_L4|NETWORK_L7|SECURITY|MARKET|VM|VSAN_ISCSI/

      const checkKeys = { // [자원 할당] 의 필수 키 검사
        COMPUTE: ['cluster', 'node', /* 'image', */ 'networkList'],
        VM_TEMPLATE: [''],
        DATABASE: ['cluster', 'dbParam', 'profile'],
        FILE_SERVER: ['cluster', 'fileServer'],
        NETWORK_L4: ['ip', 'vrserverName', 'serviceList'],
        NETWORK_L7: ['ip', 'csVrserverName', 'serviceList'],
        SECURITY: [''],
        MARKET: ['central', 'cluster', 'network'],
        VM: ['esxi', 'deployHostUuid', 'networkList'],
        VSAN_ISCSI: ['spbmProfileUuid', 'tcpPort', 'cluster', 'network']
      }

      let passed = true

      for (const service in roleData) {
        if (!mustCheck.test(service)) continue // [자원할당] 이 없는 서비스들은 그냥 통과

        // console.group(`%c >> 서비스명 :: ${service}`, 'font-weight: bold; color: #8ef280')

        const keys = checkKeys[service] // 자원 타입에 따라 [자원할당] 필수 키 세팅
        const items = roleData[service] // 각 서비스 목록 데이터

        // console.log(keys, items)
        const servicePassed = items.every(({ configJson: item, workItemState }) => { // [자원할당] 내용은 configJson 에 저장되어있음
          const cancel = /CANCEL/.test(workItemState)
          if (cancel) return true // [주문취소] 관련 자원은 확인 생략

          return keys.every(key => {
            // console.log(`    > key: ${key}, value: ${item[key]}`) // 🌸
            // return item[key] || item[key].length > 0 // 자원할당 필수 키가 있는지 || 길이가 있는지 확인
            return item[key]
          })
        })

        // console.log('\n- 서비스 통과 여부 : ', servicePassed)
        // console.log('- 서비스 필수 키 : ', keys)
        // console.log('- 서비스 목록 : ', items)
        // console.groupEnd(🌸)

        passed = servicePassed
        if (!servicePassed) break
      }

      // console.log('%c🔸 [자원할당] 필수 PASS 결과 :: ', 'background-color: #682f69', passed) // 🌸
      return passed
    },

    /**
     * [운영정보]가 등록되어있는지 확인합니다.
     * @param { String } field 현재 보고있는 탭의 role 정보
     */
    metaInfoValidator ({ field, ...tab }) {
      // console.log(field, this.roleData[field])

      // 🌸 디버깅용 표기 (디버깅시 주석해제하고 보면 됨)
      // console.clear() // 🌸
      const roleData = cloneDeep(this.roleData[field])
      // console.log(roleData)

      // NTX 현재 보고있는 탭 자원들의 [운영정보] validation 설정 (운영정보 등록된 경우만 확인)
      const mustCheck = /COMPUTE|VM_TEMPLATE|DATABASE|FILE_SERVER|NETWORK_L4|NETWORK_L7|SECURITY|MARKET|VM|VSAN_ISCSI/

      let passed = true

      // 저장된 메타데이터 정보 불러오기
      const metadata = this.metadata[this.cloud]

      for (const service in roleData) {
        if (!mustCheck.test(service)) continue // [자원할당] 이 없는 서비스들은 그냥 통과

        // console.group(`%c >> 서비스명 :: ${service}`, 'font-weight: bold; color: #8ef280')

        const infos = metadata[service] // 메타데이터 서비스 기반 정보
        const items = roleData[service] // 각 서비스 목록 데이터

        if (!infos || infos.length === 0) break // 등록된 메타데이터가 없는경우는 통과

        const checkKeys = infos.filter(({ required }) => required === true)
        const keys = checkKeys.map(({ key }) => key)

        // console.log(keys, items)
        const servicePassed = items.every(({ metaInfo, workItemState }) => { // [자원할당] 내용은 configJson 에 저장되어있음
          const cancel = /CANCEL/.test(workItemState)
          if (cancel) return true // [주문취소] 관련 자원은 확인 생략

          const data = JSON.parse(metaInfo) // 저장된 메타데이터 정보
          return keys.every(key => {
            // console.log(`    > key: ${key}, value: `, data[key]) // 🌸
            // return data[key] || data[key].length > 0 // 자원할당 필수 키가 있는지 || 길이가 있는지 확인
            return data[key]
          })
        })

        // console.log('\n- 서비스 통과 여부 : ', servicePassed)
        // console.log('- 서비스 필수 키 : ', keys)
        // console.log('- 서비스 목록 : ', items)
        // console.groupEnd(🌸)

        passed = servicePassed
        if (!servicePassed) break
      }

      // console.log('%c🔸 [자원할당] 필수 PASS 결과 :: ', 'background-color: #682f69', passed) // 🌸
      return passed
    },

    /**
     * [예약설정]이 등록되어있는지 확인합니다.
     * @param { String } field 현재 보고있는 탭의 role 정보
     */
    schedulingValidator ({ field, ...tab }) {
      // console.log(field, this.roleData[field])

      // 🌸 디버깅용 표기 (디버깅시 주석해제하고 보면 됨)
      // console.clear(🌸)
      const roleData = cloneDeep(this.roleData[field])

      // NTX 현재 보고있는 탭 자원들의 [예약설정] validation 설정 (모든 자원 필수값)
      let passed = true

      for (const service in roleData) {
        // console.group(`%c >> 서비스명 :: ${service}`, 'font-weight: bold; color: #8ef280')

        const items = roleData[service] // 각 서비스 목록 데이터

        const servicePassed = items.every(({ workSchedule }) => {
          // console.log(`    > key: workSchedule, value: ${workSchedule}`)
          return workSchedule // [예약설정] 이 등록되어있는지 확인
        })

        // console.log('\n- 서비스 통과 여부 : ', servicePassed)
        // console.groupEnd(🌸)

        passed = servicePassed
        if (!servicePassed) break
      }

      // console.log('%c🔸 [자원할당] 필수 PASS 결과 :: ', 'background-color: #682f69', passed) // 🌸
      return passed
    },

    /**
     * [작업상태] 가 있는지 없는지를 확인합니다 (할일에서만 사용됨)
     * @param { String } field 현재 보고있는 탭의 role 정보
     */
    workStatusValidator ({ field, ...tab }) {
      // console.log(field, this.roleData[field])

      // 🌸 디버깅용 표기 (디버깅시 주석해제하고 보면 됨)
      // console.clear(🌸)
      const roleData = cloneDeep(this.roleData[field])

      // NTX 현재 보고있는 탭 자원들의 [예약설정] validation 설정 (모든 자원 필수값)
      let passed = true

      for (const service in roleData) {
        // console.group(`%c >> 서비스명 :: ${service}`, 'font-weight: bold; color: #8ef280')

        const items = roleData[service] // 각 서비스 목록 데이터

        const servicePassed = items.every(({ workItemState }) => {
          // console.log(`    > key: workItemState, value: ${workItemState}`)
          const cancel = /CANCEL/.test(workItemState)
          if (cancel) return true // [주문취소] 관련 자원은 확인 생략

          const state = /SUCCESS|FAIL/.test(workItemState)
          if (!state) return false // [작업상태] 가 있는지 확인 (성공/실패만 작업상태로 인정해줌)

          return workItemState
        })

        // console.log('\n- 서비스 통과 여부 : ', servicePassed)
        // console.groupEnd(🌸)

        passed = servicePassed
        if (!servicePassed) break
      }

      // console.log('%c🔸 [자원할당] 필수 PASS 결과 :: ', 'background-color: #682f69', passed) // 🌸
      return passed
    },

    /**
     * [작업계획서/작업완료보고서]가 등록되어있는지 확인합니다.
     * @param {Object} setting 현재 보고있는 탭의 세팅 정보
     */
    approvalDocumentValidator ({ setting }) {
      const { planDocument, reportDocument, useDoc } = setting
      if (!useDoc) return true // [보고서] 설정이 되어있어야함

      const isUrgent = this.taskData.orderType === 'URGENT' // [긴급] 여부 확인

      // [보고서] 에 대한 validation
      // [보고서 설정] 이 ON 되어있다면 비교 시작
      // 이미 등록된 보고서가 있다면 페이지를 비교해서 true/false 확인
      const approvalDocument = (planDocument || reportDocument)
        ? (
          // [긴급] 일 경우는 [사후결재보고서]
          isUrgent ? !!reportDocument
            : {
              // [일반] 일 경우는 [사전협의 - 작업계획서] vs [할일 - 작업완료보고서]
              CONFERENCE: !!planDocument,
              TODO: !!reportDocument
            }[this.type]
        )
        : false // 등록된 보고서 없으면 false

      return approvalDocument
    },

    /**
     * 업무 데이터를 가져옵니다.
     */
    async getTaskPreDetail () {
      try {
        this.loading = true
        const response = await API.work.getTaskPreDetail(this.$route.params.id)

        if (!response || response.status) {
          return this.$router.replace({ name: 'not-found-status', params: { code: response.status } })
        }
        return response
      } catch (error) {
        console.error('@@@ getTaskPreDetail Error : ', error)
        const message = {
          ODR1004: this.$v('해당 티켓이 존재하지 않습니다.')
        }
        this.$alert(message[error.response.data.code], '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: () => {
            // 티켓 없는경우 목록으로 튕겨내기
            if (error.response.data.code === 'ODR1004') return this.$router.replace({ name: 'task-list' })
            return false
          }
        })
      } finally {
        this.loading = false
      }
    },
    // 빵가루 처리
    setBreadCrumbs (data = this.taskData) {
      let state = 'WAIT'
      const today = Dayjs(new Date())
      const date = Dayjs(new Date(data.finishTime))
      const interval = this.$options.filters.interval(today, date)

      const isApproved = []
      this.orderDataList.forEach(list => {
        for (const role of list.roles) isApproved.push(role.isApproval)
      })
      state = isApproved.some(apprv => apprv) ? 'PROCEED' : state
      if (interval > 0) state = 'DELAY'

      let taskStatus

      // '미정'건 처리
      if (data.finishTime) {
        taskStatus = `D${interval < 0 ? '' : '+'}${interval} ${this.status[state].ko}`
      } else {
        taskStatus = this.status.undefined.ko
      }

      // const taskStatus = `D${interval < 0 ? '' : '+'}${interval} ${this.status[state].ko}`
      const crumb = VueCookies.get('CMPLang') === 'en' ? '' : this.$t('common.TERMS.orderNumber')
      this.$store.commit('common/ADD_PARAMETERS', {
        label: `${crumb} ${this.$route.params.id}`,
        path: '',
        statusKo: taskStatus,
        status: this.status[state].color
      })
    },

    /**
     * 빵가루 처리 (v3)
     * @param {Object} data
     */
    setBreadCrumbs_V3 (data = this.taskData) {
      // const taskStatus = `D${interval < 0 ? '' : '+'}${interval} ${this.status[state].ko}`
      const crumb = VueCookies.get('CMPLang') === 'en' ? '' : this.$t('common.TERMS.orderNumber')
      this.$store.commit('common/ADD_PARAMETERS', {
        label: `${crumb} ${this.$route.params.id}`,
        path: ''
      })
    },

    /**
     * [자원 할당] 정보 저장
     * @param {Object} row row 정보
     * @param {Object} data 저장할 데이터
     * @param {Object} tab tab 정보
     */
    async updateSource ({ row, data }, tab) {
      try {
        const workId = tab.workId
        const itemIdx = row.srcIdx

        const configPayload = {
          configPlan: JSON.stringify({ ...row, ...data })
        }

        // 자원사양 변경 저장
        await API.work_v3.updateSourceConfig({ workId, itemIdx, payload: configPayload })

        return this.$alert(this.$v('저장되었습니다.'), { callback: this.setDetailData_V3 })
      } catch (error) {
        console.error('@@ SetClusterNodeModal > updateSource', error)
        return this.$alert(this.$v('저장에 실패했습니다.'))
      }
    },

    /**
     * [자원정보] 저장 및 상세 새로고침
     * @param {Object} item
     * @param {Object} tab workId
     */
    async updateResource ({ item, manage }, { workId }) {
      try {
        const payload = { resourceSpec: JSON.stringify(item) }
        await API.work_v3.updateResource({ workId, itemIdx: item.srcIdx, payload })

        if (manage) await this.resetSourceConfig({ workId, item })

        return this.$alert(this.$v('저장이 완료되었습니다.'), { callback: this.setDetailData_V3 })
      } catch (error) {
        console.error('@@ TaskCommonDetail > setResourceInfoItem : ', error)
      }
    },

    /**
     * [운영그룹] 변경된 경우, 정상적으로 저장되었다면 저장된 [자원할당] 리셋
     * @param {Object} item
     * @param {Object} tab workId
     */
    async resetSourceConfig ({ workId, item }) {
      try {
        await API.work_v3.resetSourceConfig({ workId, itemIdx: item.srcIdx })
      } catch (error) {
        console.error('@@ TaskCommonDetail > resetSourceConfig : ', error)
      }
    },

    /**
     * [할일] 페이지에서는 계속 화면을 새로고침 해주어야합니다.
     */
    timeout () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(this.setDetailData_V3, 5000)
    }

  },
  data () {
    return {
      fold: true,
      loading: false,
      time: null,
      taskData: {},
      orderDataList: [],
      clientApprovalDetailRsp: {}, // [결재문서조회] 정보
      memoLists: [], // 메모 데이터
      cancelOrderActive: { view: false, data: null }, // [주문취소] 모달 On/Off
      scheduleOrderActive: { view: false, data: null }, // [예약설정] 모달 On/OFF
      reportOrderActive: { view: false, data: null }, // 보고서 작성 모달 On/Off
      roleData: [],
      orderList: []
    }
  }
}
</script>

<style lang="scss" scoped>

.task-common {
  &-detail {
    position: relative;
  }

  &-title {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    position: relative;
    font-size: 18px;

    .approval-view {
      position: absolute;
      top: -5px; right: 0;
      font-size: 14px;
    }

    .guide > i {
      display:block;
      margin-left: $gap-s;
    }
  }

  &-body {
    margin-top: 50px;

    .body-content {
      position: relative;
    }
  }

  &-contents {
    position: relative;
  }
}

.top-right-content {
  position: absolute;
  top: 0; right: 0;
  > * { margin-left: $gap-s; }
}

.guide-content::v-deep {
  line-height: 2;
  font-weight: normal;
}
</style>

<style lang="scss">
.task-resource-grid {
  a.-setting { color: $main-blue; }
}
</style>
