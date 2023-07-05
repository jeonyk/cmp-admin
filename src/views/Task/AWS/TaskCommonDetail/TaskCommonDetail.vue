<template>
  <div
    class="conference-aws-detail"
    v-loading="isLoading"
  >
    <dashboard-panel
      class="order-list"
      :title="$v('주문 정보')"
      foldable
      foldable-type="ICON"
    >
      <approved-detail-origin
        v-if="type !== 'DONE'"
        class="approval-view"
        :button="$v('결재 문서 조회')"
        :data="clientApprovalDetailRsp"
        :approvers="cApprovers"
        :is-review-mode="true"
      />
      <conf-detail-apply :data="taskData" />

      <uploaded-documents
        :data="orderList"
      />
    </dashboard-panel>
    <div style="height:50px;" />
    <aws-task-tabs
      ref="awsResources"
      :data="orderList"
      :tabs="tabs"
      :resources="resources"
      :task-type="taskType"
      @click="clickTab"
      @cancel="openInsertModal"
      @set="openDateModal"
      @update="updateInstanceTable"
      @restore="restoreService"
      @excute="excuteResource"
      @set-success="setSuccess"
      @report-order="reportOrder"
      @apply-approval="applyApproval"
      @complete-work-review="completeWorkReveiw"
      @complete-work-todo="completeWorkReveiw"
      @complete-work-cancel="completeWorkReveiw"
    />

    <ec2-res-create
      v-if="viewEc2Modal"
      :active.sync="viewEc2Modal"
      @close="viewEc2Modal = false"
      @update-order="updateOrder"
      :is-edit="selectedEc2Res && selectedEc2Res.orderType === 'CHANGE'"
      basket-edit
      :basket-data="selectedEc2Res"
      :project-idx="selectedEc2Res.orderData.projectIdx"
    />

    <!-- :is-edit="selectedEfsRes && selectedEfsRes.orderType === 'CHANGE'" -->
    <!-- @update-order="updateOrder" -->
    <efs-res-create
      v-if="viewEfsModal"
      :active.sync="viewEfsModal"
      @close="viewEfsModal = false"
      @update-order="updateOrder"
      basket-edit
      :is-edit="selectedEfsRes && selectedEfsRes.orderType === 'CHANGE'"
      :basket-data="selectedEfs"
      :project-idx="selectedEfs ? selectedEfs.orderData.projectIdx : 0"
    />
    <elb-target-group-create
      v-if="viewTargetGroupModal && selectedTargetGroup"
      :active.sync="viewTargetGroupModal"
      @close="viewTargetGroupModal = false"
      @update-order="updateOrder"
      basket-edit
      :is-edit="selectedEfsRes && selectedEfsRes.orderType === 'CHANGE'"
      :basket-data="selectedTargetGroup"
      :project-idx="selectedTargetGroup ? selectedTargetGroup.orderData.projectIdx : 0"
    />

    <elb-load-balancer-create
      v-if="viewNlbModal && selectedNlb"
      :active.sync="viewNlbModal"
      @close="viewNlbModal = false"
      @update-order="updateOrder"
      basket-edit
      :is-edit="selectedNlb && selectedNlb.orderType === 'CHANGE'"
      :basket-data="selectedNlb"
      :project-idx="selectedNlb ? selectedNlb.orderData.projectIdx : 0"
    />

    <security-group-create
      v-if="viewSgModal && selectedSg"
      :active.sync="viewSgModal"
      @close="viewSgModal = false"
      @update-order="updateOrder"
      basket-edit
      :is-edit="selectedSg && selectedSg.orderType === 'CHANGE'"
      :basket-data="selectedSg"
      :project-idx="selectedSg ? selectedSg.orderData.projectIdx : 0"
    />
    <transit-gateway-create
      v-if="viewTgwModal && selectedTgw"
      :active.sync="viewTgwModal"
      @close="viewTgwModal = false"
      @update-order="updateOrder"
      basket-edit
      :is-edit="selectedTgw && selectedTgw.orderType === 'CHANGE'"
      :basket-data="selectedTgw"
      :project-idx="selectedTgw ? selectedTgw.orderData.projectIdx : 0"
    />
    <!-- basket-edit -->
    <!-- elb-target-group-create -->

    <approval-confirm-modal
      ref="insertModal"
      :active="applyAwsResources.view"
      :state="applyAwsResources.state"
      @close="applyAwsResources.view = false"
      @save="rejectOrder"
    />

    <document-order
      :data="reportOrderActive.data"
      :active="reportOrderActive.view"
      @close="reportOrder(false, {})"
    />

    <task-floating-memo :order-no="$route.params.id" />

    <!-- <date-time-form
      :is-visible="isVisible"
      @close="isVisible = false"
      @save="setTime"
    /> -->

    <schedule-order
      :data="scheduleOrderActive.data"
      :active="scheduleOrderActive.view"
      @close="scheduleOrderActive = { view: false, data: null }"
      @confirm="init"
    />
    <!-- @confirm="setDetailData_V3" -->
  </div>
</template>

<script>
import API, { EC2ResCreate, EFSResCreate, DashboardPanel, ELBTargetGroupResCreate, ELBLoadBalancerResCreate, VPCSecurityGroupCreate, TransitGatewayCreate } from '@sd-fe/cmp-core'
// import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'
import ConfDetailApply from '@/views/Task/Nutanix/TaskCommonDetail/ConfDetailApply.vue'
import ConfirmModal from '@/components/Modal/Common/ConfirmModal.vue'
import TaskDetailCommon from '@/views/Task/Nutanix/TaskDetailCommon'
import TaskFloatingMemo from '@/components/TaskFloatingMemo/TaskFloatingMemo'
import DocumentOrder from '@/components/DocumentDetail/DocumentOrder/DocumentOrder'
// import DateTimeForm from '@/components/Form/DateTimeForm.vue'
// import ApprovedDetailOrigin from '../TaskApproved/ApprovedDetail/ApprovedDetailOrigin'
import ApprovedDetailOrigin from '../../Nutanix/TaskApproved/ApprovedDetail/ApprovedDetailOrigin.vue'
import AwsTaskTabs from '@/components/TaskTabs/AwsTaskTabs.vue'
// import TaskCommonButtons from '@/components/TaskCommonButtons/TaskCommonButtons'
import ScheduleOrder from '@/components/ScheduleOrder/ScheduleOrder'
import UploadedDocuments from '@/components/UploadedDocuments/UploadedDocuments'
export default {
  name: 'TaskCommonDetail',
  components: {
    AwsTaskTabs,
    'approval-confirm-modal': ConfirmModal,
    DashboardPanel,
    ConfDetailApply,
    'ec2-res-create': EC2ResCreate,
    'efs-res-create': EFSResCreate,
    'elb-target-group-create': ELBTargetGroupResCreate,
    'elb-load-balancer-create': ELBLoadBalancerResCreate,
    'security-group-create': VPCSecurityGroupCreate,
    'task-floating-memo': TaskFloatingMemo,
    'transit-gateway-create': TransitGatewayCreate,
    DocumentOrder,
    // DateTimeForm,
    ApprovedDetailOrigin,
    // TaskCommonButtons,
    ScheduleOrder,
    'uploaded-documents': UploadedDocuments
  },
  mixins: [TaskDetailCommon],
  props: {
    taskType: {
      type: String,
      default: 'CONFERENCE'
    }
  },
  watch: {
    viewEc2Modal (visible) {
      if (visible) {
        this.isVpcLoading = true

        API.aws.getVpc({ projectIdx: this.selectedEc2Res.orderData.projectIdx })
          .then(({ data: vpcs }) => {
            if (vpcs.length) {
            }
          })
          .catch((e) => {
            this.$alert('해당 프로젝트에 선택할 수 있는 VPC가 존재하지 않습니다.')
            this.viewEc2Modal = false
          })
          .finally(() => {
            this.isVpcLoading = false
          })
      }
    }
  },
  provide () {
    return {
      $field_V3: () => this.type,
      $orderType: () => this.taskData.orderType
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.auth.user,
      packageType: (state) => state.auth.packageType,
      cloudType: (state) => state.cloud.cloudType
    }),
    type: (root) => (root.$route.name.replace(/(-detail|-aws)/g, '').toUpperCase()),
    selectedTab () {
      return this.tabs.find(r => r.roleIdx === this.selected.roleIdx)
    },
    selectedRole () {
      return this.roles?.find(r => r.roleIdx === Number(this.selected?.roleIdx))
    },
    selectedServices () {
      if (!this.roles) return []
      return this.roles?.find(r => r.roleIdx === this.selected.roleIdx)?.workItemRsps.filter(x => x.service === this.selected.name)
    },
    // selectedService () {
    //   return this.roles?.find(r => r.roleIdx === this.selected.roleIdx)?.workItemRsps.filter(x => x.service === this.selected.name)
    // },

    cApprovers () {
      return this.clientApprovalDetailRsp.approvers?.map(x => {
        return {
          ...x,
          ...x.approver
        }
      })
    },
    userPayload () {
      const { userId, userName, userPosition } = this.user
      return {
        id: userId,
        name: userName,
        position: userPosition
      }
    },
    completeApi () {
      return {
        CONFERENCE: 'completeWorkReveiw',
        TODO: 'completeWorkTodo'
      }[this.taskType] ?? ''
    },
    cancelApi () {
      return {
        CONFERENCE: 'workItemCancel',
        TODO: 'cancelWorkTodo'
      }[this.taskType] ?? ''
    },
    restoreApi () {
      return {
        CONFERENCE: 'workItemRestore',
        TODO: 'restoreWorkTodo'
      }[this.taskType]
    },
    msgForCompleteStep () {
      return {
        CONFERENCE: '할일로 이동하시겠니까?',
        TODO: '한일로 이동하시겠니까?'
      }[this.taskType] ?? ''
    },
    msgForAterCompleteStep () {
      return {
        CONFERENCE: '업무가 할 일로 이동되었습니다.',
        TODO: '업무가 한 일로 이동되었습니다.'
      }[this.taskType] ?? ''
    },
    routeToList () {
      return {
        CONFERENCE: 'task-conference',
        TODO: 'task-todo',
        DONE: 'task-done'
      }[this.taskType] ?? ''
    }
  },
  created () {
    this.init()
  },
  destroyed () {
    clearTimeout(this.time)
  },
  methods: {
    /**
     * [할 일로 이동] 버튼 클릭시 확인창
     * @param {Object} tab
     * @param {String} $event toTodo(할일로 이동)|toDone(한일로 이동)
     */
    completeWorkReveiw ({ workId }, $event) {
      const type = {
        toTodo: { // 사전협의 > [할일로 이동]
          confirm: this.$v('할일 단계로 이동 시 이전 단계 작업을 수행 할 수 없습니다. <br> 그래도 이동하시겠습니까?'),
          alert: this.$v('업무가 할일로 이동되었습니다.'),
          apiName: 'completeWorkReveiw'
        },
        toDone: { // 할일 > [한일로 이동]
          confirm: this.$v('한일 단계로 이동 시 이전 단계 작업을 수행 할 수 없습니다. <br> 그래도 이동하시겠습니까?'),
          alert: this.$v('업무가 한일로 이동되었습니다.'),
          apiName: 'completeWorkTodo'
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
     * 할일 이동 API 동작
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

        this.$alert(alert, { callback: this.$router.push({ name: this.routeToList }) })
      } catch (error) {
        if (error.response?.data) {
          const { response: { data: { message, code } } } = error
          if (code === 'ODR0000' && message === 'Some of item is not finished') {
            this.$alert('잔여 작업이 남아있습니다.')
          } else {
            this.$alert('에러가 발생했습니다.')
          }
        }
        console.error('@@ ConferenceDetail > setComplete', error)
      }
    },
    goNextStep ({ workId }) {
      this.$confirm(this.msgForCompleteStep).then(() => this.completeCurrentStep(workId)).catch(() => false)
    },
    async completeCurrentStep (workId) {
      try {
        await API.work_v3[this.completeApi](workId, this.userPayload)
        this.$alert(this.msgForAterCompleteStep).then(() => {
          this.$router.push({ name: this.routeToList })
        }).catch(() => false)
      } catch (err) {
        console.log(err)
      }
    },
    countArrays (obj) {
      let count = 0
      for (const key in obj) {
        if (Array.isArray(obj[key])) {
          count += obj[key].length
        }
      }
      return count
    },
    async  setSuccess ({ data, row }, { workId }) { // 성공처리 및 실패처리 설정 data.resolve 값에 따라
      // console.log('#setSuccess', data, second)
      const { srcIdx } = row

      try {
        const params = {
          workId,
          itemIdx: srcIdx,
          payload: {
            resolve: data.resolve,
            resolved: true
          }
        }

        await API.work_v3.executeFailResolve(params)

        this.$alert(this.$v('요청하신 상태 처리를 완료하였습니다.'), { callback: this.init })
      } catch (err) {
        if (err.response && err.response.data) {
          const { code, message } = err.response.data
          if (code === 'ODR0000' && message === 'Not in Fail status') {
            this.$alert('실패 상태인 경우에만 성공처리가 가능합니다 ')
          }
          console.log(err)
        }
      }
    },
    async excuteResource (service, setting, status) { // 작업실행
      const params = {
        srcIdx: service.srcIdx,
        workId: setting.workId
        // ...service,
        // ...setting
      }
      console.log('#작업실행')
      console.log('#PARAMS', params)
      console.log('#PARAMS', service.src, service.idx)

      const { workId, srcIdx } = params

      const body = {
        // groupIdx: this.user.userGroup,  // Below Error
        // groupName: this.user.userGroupName, // [Backend-Issue] AWS SG(보안그룹) 자원 생성 groupName 값 중복으로 임시 제거
        id: this.user.userId,
        name: this.user.userName
      }
      try {
        if (status === 'DELETE_STANDBY') {
          const res = await API.work_v3.executeDeleteRunTodo({ workId, itemIdxs: srcIdx, payload: body })
          this.updateResources()
          if (res?.fail) { // 200으로 성공이지만 fail 메시지 반환
            this.$alert(res.fail)
          }
        } else {
          const res = await API.work_v3.executeRunTodo({ workId, itemIdxs: srcIdx, payload: body })
          this.updateResources()
          if (res?.fail) { // 200으로 성공이지만 fail 메시지 반환
            this.$alert(res.fail)
          }
        }
      } catch (error) {
        if (error?.response?.data) {
          const msg = error.response.data.message
          this.$alert(msg)
        }
      }
    },
    async restoreService (service, setting) {
      const params = {
        ...service,
        ...setting
      }
      const { workId, srcIdx } = params

      const payload = {
        workId,
        payload: {
          itemIdxs: [srcIdx]
        }
      }

      this.$confirm('주문을 복원하시겠습니까?').then(async () => {
        try {
          await API.work_v3[this.restoreApi](payload)
          this.$alert('자원복원을 성공했습니다.').then(() => this.init())
        } catch (error) {
          console.log('#ERROR 주문 복원', error)
          // {"code":"ODR0000","message":"item is not cancel state"}
          if (error?.response?.data?.message === 'item is not cancel state') return this.$alert('자원이 취소된 상태에서만 복원이 가능합니다.')
          return this.$alert('에러가 발생했습니다.')
        }
      }).catch(() => false)
    },
    openDateModal (payload, setting) {
      const params = {
        ...payload,
        ...setting
      }
      console.log(payload)
      const { workId, autoScheduleAt, srcIdx } = params

      this.selectedServiceInfo = params
      this.scheduleOrderActive = {
        view: true,
        data: {
          rows: [srcIdx],
          view: true,
          workId: workId,
          type: this.$route.name.split('-')[0].toUpperCase(),
          autoScheduleAt: autoScheduleAt || ''
        }
      }
    },
    async setTime ({ time, isChecked }) {
      const { workId, idx } = this.selectedServiceInfo
      const payload = {
        workId: workId,
        itemIdx: idx,
        payload: {
          scheduledAt: time,
          useAutoSchedule: isChecked
        }
      }

      console.log('#payload', payload)
      try {
        const response = await API.work_v3.createReviewReservation(payload)
        console.log('#response', response)
        if (response?.status === 200) {
          this.$alert(this.$v('예약 설정 정보를 저장했습니다.'))
          // this.isVisible = false
        }
      } catch (error) {
        if (error?.response?.data) {
          const { response: { data: { message } } } = error
          console.log('#message', message)

          if (message === 'Unable to update item when APPROVAL1 state') {
            this.$alert('결재대기 상태에서 자동 예약 설정을 할 수 없습니다.')
          } else {
            this.$alert('에러가 발생했습니다.')
          }
        } else {
          this.$alert('에러가 발생했습니다.')
        }
      }
    },
    reportOrder (view, tab) {
      const payload = {
        orderNo: this.orderNo,
        roleIdx: tab.roleIdx,
        cloudType: this.cloudType.toUpperCase(),
        orderType: this.orderType,
        setting: {
          ...tab.setting
          // approvalDocument: Object|undefined ❌ (삭제 예정 -> BE 데이터 형식이 잘못만들어져서 변경될 예정)
          // planDocument: Object|undefined (등록된 작업계획서 - 사전협의)
          // reportDocument: Object|undefined (등록된 완료보고서 - 할일)
        }
      }

      const orderNo = this.$route.params.id
      this.reportOrderActive = {
        view,
        data: { ...payload, orderNo }
      }
    },
    applyApproval (role) {
      const { orderType, finishTime: expectDate } = this.taskData
      const step = this.$route.name.split('-')[0]

      const { workId, roleIdx: idx } = role
      const orderNo = workId.split('-')[0]
      const roleIdx = Number(idx)

      return this.$router.push({
        name: 'task-apply-approval',
        params: {
          step,
          orderNo
        },
        query: {
          orderType,
          roleIdx,
          useDoc: this.selectedRole.useDoc,
          workState: this.selectedRole.workState,
          expectDate
        }
      })
    },
    setOrderInfo ({
      orderNo,
      ordererCompany: { name: companyName },
      ordererGroup: { name: groupName },
      projectName,
      orderType,
      orderReqNote,
      createTime,
      orderer: { name: ordererName },
      expectDate,
      memos
    }) {
      this.orderType = orderType
      this.orderNo = orderNo

      this.taskData = {
        companyName: companyName,
        groupName: groupName,
        projectName,
        orderType: orderType,
        orderTypeLabel: this.orderTypeLabel[orderType],
        name: orderReqNote,
        createTime,
        userName: ordererName,
        finishTime: expectDate
      }
    },
    async init () {
      console.log('#init')
      await this.getTaskPreDetail(this.$route.params.id)
    },
    clickTab (tab, idx) {
      console.log('#clickTab', tab, idx)
      // this.$alert(typeof Number(tab.roleIdx))
      this.selected = tab
      // this.selected?.idx = idx
    },
    async getTaskPreDetail (id) {
      try {
        // this.isLoading = true
        const apiName = {
          CONFERENCE: 'getWorkReviewDetail',
          TODO: 'getWorkTodoDetail',
          DONE: 'getWorkDoneDetail'
        }[this.taskType]

        const response = await API.work_v3[apiName](id)
        console.log('#업무 상세 정보입니다 ******')
        console.log('#response', response)
        const { workRsps, clientApprovalDetailRsp } = response
        this.orderList = workRsps
        this.rawData = response
        this.roles = workRsps
        this.clientApprovalDetailRsp = clientApprovalDetailRsp
        this.setOrderInfo(response)

        if (this.type === 'TODO') {
          this.timeout()
        }
        return response
      } catch (error) {
        this.$alert('티켓 정보를 찾을 수 없습니다.').then(() => {
          this.$router.push({ name: this.routeToList })
        })
      } finally {
        this.isLoading = false
      }
    },
    async updateResources () {
      console.log('#updateResources')
      const apiName = {
        CONFERENCE: 'getWorkReviewDetail',
        TODO: 'getWorkTodoDetail',
        DONE: 'getWorkDoneDetail'
      }[this.taskType]
      const response = await API.work_v3[apiName](this.$route.params.id)
      console.log(1231231238989)
      console.log(response)
      console.log(this.$refs.awsResources)
      if (this.$refs.awsResources) this.$refs.awsResources.setResources(response.workRsps)
      this.timeout()
    },
    timeout () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }
      this.time = setTimeout(() => this.updateResources(this.$route.params.id), 10000)
      // this.time = setTimeout(() => this.init(), 3000)
    },
    async updateOrder (orderData) {
      const params = {
        workId: this.selectedServiceInfo.workId,
        itemIdx: this.selectedServiceInfo.itemIdx,
        payload: { resourceSpec: JSON.stringify(orderData) }
      }

      console.log('update-order')
      console.log(orderData)
      console.log('params', params)

      try {
        await API.work_v3.updateResource(params)
        this.$alert('변경에 성공했습니다.').catch(() => false).finally(() => {
          const selectedModal = this.serviceModalName[this.selectedServiceInfo.service]
          this[selectedModal] = false
          this.init()
        })
      } catch (err) {
        console.error(err)
      }
    },
    /**
     * 주문 반려
     * @param {object} option option.reason: 반려사요
     */
    async rejectOrder (option) {
      const { workId, srcIdx } = this.selectedServiceInfo
      const payload = {
        workId: workId,
        payload: {
          itemIdxs: [srcIdx],
          reason: option.note
        }
      }

      try {
        // await API.work_v3.workItemCancel(payload)
        await API.work_v3[this.cancelApi](payload)
        // 뉴타닉스 프로세스 주문 두건이어도 하나 반려하면 목록으로 나감
        this.$alert(this.$v('주문취소를 성공했습니다.')).then(() => {
          this.applyAwsResources.view = false
          this.init()
        }
        )
        // thi.s 주문취소창 = false
      } catch (error) {
        console.log('#ERROR : 주문 취소', error)
        if (error?.response?.data) {
          const { response: { data: { message } } } = error
          console.log('#message', message)
          if (message === 'Unable to cancel workreview in APPROVAL1 state') {
            this.$alert('결재대기 상태에서 취소할 수 없습니다.')
          } else if (message === 'Unable to cancel item when CANCELED_AT_REVIEW state') {
            this.$alert('이미 취소 신청한 자원입니다')
          } else {
            this.$alert('에러가 발생했습니다.')
          }
        } else {
          this.$alert('에러가 발생했습니다.')
        }
      }
    },
    updateInstanceTable (body, setting) {
      console.log('#updateInstanceTable')
      console.log(body)
      console.log(setting)

      const { srcIdx: idx } = body
      // const selectedService = this.roles.find(r => r.workItemRsps.find(x => x.workId === setting.workId))
      const selectedService = this.roles.find(x => x.roleIdx === Number(this.selected.roleIdx)).workItemRsps.find(x => x.idx === idx)
      console.log('#$#$$#$#$$#$')
      console.log(this.roles)
      console.log(selectedService)

      const payload = {
        workId: setting.workId,
        itemIdx: idx,
        orderDataIdx: 349,
        roleIdx: Number(this.selected.roleIdx),
        roleName: this.selected.name,
        userId: this.user.userId,
        userName: this.user.userName,
        orderData: JSON.parse(selectedService?.workItemSpec?.actualJson),
        orderType: selectedService.resourceType
      }
      setTimeout(() => {
        const { service } = selectedService
        if (service) {
          const selectedService = this.selectedService[service]
          const selectedModal = this.serviceModalName[service]

          this.selectedServiceInfo = {
            itemIdx: idx,
            service,
            workId: setting.workId
          }
          this[selectedService] = payload // 변경할 서비스
          this[selectedModal] = true // 모달 오픈
        }
      }, 0)
    },
    openInsertModal (service, setting) {
      this.selectedServiceInfo = {
        ...service,
        ...setting
      }
      const state = 'reject'
      if (state === 'reject') {
        this.applyAwsResources = {
          view: true,
          state: state
        }
        this.$refs.insertModal.note = ''
      }
    }

  },
  data () {
    return {
      orderList: [],
      scheduleOrderActive: { view: false, data: null }, // [예약설정] 모달 On/OFF
      selectedService: {
        EC2: 'selectedEc2Res',
        EFS: 'selectedEfs',
        TARGET_GROUP: 'selectedTargetGroup',
        NLB_L4: 'selectedNlb',
        SG: 'selectedSg',
        TRANSIT_GATEWAY: 'selectedTgw'
      },
      serviceModalName: {
        EC2: 'viewEc2Modal',
        EFS: 'viewEfsModal',
        TARGET_GROUP: 'viewTargetGroupModal',
        NLB_L4: 'viewNlbModal',
        SG: 'viewSgModal',
        TRANSIT_GATEWAY: 'viewTgwModal'
      },
      time: undefined,
      clientApprovalDetailRsp: {},
      selectedServiceInfo: {},
      resources: {},
      reportOrderActive: { view: false, data: null }, // 보고서 작성 모달 On/Off
      selectedServiceIdx: 0,
      orderTypeLabel: { NEW: this.$v('신규'), CHANGE: this.$v('변경'), DELETE: this.$v('삭제'), URGENT: this.$v('긴급') },
      orderType: 'NEW',
      roles: [],
      rawData: {},
      isVpcLoading: false,
      selected: {},
      clonedSelectedOrderItem: {},
      tabs: [],
      viewEc2Modal: false,
      viewEfsModal: false,
      viewTargetGroupModal: false,
      viewNlbModal: false,
      viewSgModal: false,
      viewTgwModal: false,
      selectedEc2Res: {},
      selectedEfsRes: {},
      selectedEfs: {},
      selectedTargetGroup: {},
      selectedNlb: {},
      selectedSg: {},
      selectedTgw: {},
      isLoading: false,
      applyAwsResources: {
        view: false,
        state: undefined
      },
      orderNo: undefined,
      approvalNo: undefined,
      taskData: {}

    }
  }
}
</script>

<style lang="scss" scoped>
.panel-sub-title {
  font-size: 16px;
  font-weight: normal;
  margin: $gap 0;
}

.approval-view {
  position: absolute;
  // top: -5px; right: 0;
  top:-50px;
  right:0px;
  font-size: 14px;
}
</style>

<style lang="scss">
.conference-aws-detail {
  .dashboard-panel {
    &.order-list {
      .panel-title {
        font-size:18px !important;
        font-weight:700 !important;
      }
      .panel-body {
        border-top: none !important;
        padding:0px !important;
      }
    }
  }
}

.conference-section-title {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 18px;
}

.security-tag {
  color: #3e57c9;
  border: 1px solid #3e57c9;
  padding: 5px 10px;
  font-size: 16px;
  border-radius: 5px;
}

.action-message {
  margin-bottom: $gap-m;
  line-height: 2;
  text-align: center;
}

</style>
