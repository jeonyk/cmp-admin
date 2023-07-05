<!--
  * 파일명 : ConferenceDetail.vue
  * 파일 기능 : [사전협의 > 상세] 페이지 입니다. 결재 내역을 한번에 볼 수 있으며, 주문내역 각각을 승인 / 반려 / 변경 할 수 있습니다.
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할 생성/상세 - 담당자 선택 초기 선택 세팅
 -->

<template>
  <div
    class="conference-detail"
    v-loading="loading"
    :element-loading-text="loadingText"
  >
    <h2 class="conference-section-title">
      <span>{{ $t('common.TERMS.orderInfo') }}</span>
      <a
        :class="['mdi', viewApplyInfo ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        style="margin-left: 8px;"
        @click="viewApplyInfo = !viewApplyInfo"
      />
    </h2>
    <transition name="slide">
      <div
        class="conference-body"
        v-if="viewApplyInfo"
      >
        <conf-detail-apply :data="taskData" />
      </div>
    </transition>
    <!-- /. 주문 정보 -->

    <h2
      class="conference-section-title"
      style="margin-top: 50px;"
    >
      {{ $t('task.PRIOR.DETAIL.content') }}
    </h2>
    <div class="conference-body">
      <article class="conf-lists">
        <h6 class="panel-sub-title">
          {{ $t('task.PRIOR.DETAIL.selectOrder') }}
        </h6>
        <conf-source-lists
          :data="orderDataList"
          @selectedOrder="selectTaskTableData"
        />
      </article>
    </div>
    <!-- 사전 협의 내용 -->

    <div class="conference-contents">
      <section class="conferenc-top-wrap">
        <h5 class="conference-title">
          {{ selectedOrderItem ? `[${selectedOrderItem.field}] ${selectedOrderItem.orderNo}` : $t('task.PRIOR.DETAIL.selectOrderP') }}
          {{ selectedOrderItem && selectedOrderItem.serviceDate ? selectedOrderItem.serviceDate : undefined }}
        </h5>
        <div
          class="-right"
          v-if="selectedOrderItem"
        >
          <div
            class="memo-wrap"
            style="margin-left: 10px;"
          >
            <button
              class="button icon-button"
              ref="d-memo"
              type="is-icon"
              @click="detailModal.momoDropdownModal = !detailModal.momoDropdownModal"
            >
              <i class="icon-bubble" />
              <span>{{ $t('task.PRIOR.DETAIL.memoList') }}</span>
            </button>

            <cmp-drop-down
              :active.sync="detailModal.momoDropdownModal"
              @close="detailModal.momoDropdownModal = false"
              class="memo-panel"
              custom-id="d-memo"
              transition-style="fade"
              right="0"
              :title="$t('task.TODO.DETAIL.note')"
              inner-close-btn
            >
              <task-memo
                :data="memoLists"
                size="mini"
                @change-memo="afterMemoUpdated"
              />
            </cmp-drop-down>
          </div>
        </div>
      </section>
      <!-- /. 주문번호 선택 영역 -->

      <section
        class="empty-zone"
        v-if="!selectedOrderItem"
      >
        <span>{{ $t('task.PRIOR.DETAIL.selectOrderP') }}</span>
      </section>
      <!-- /. 주문번호 선택 영역 - 비었을 때 -->

      <template v-else>
        <article class="conf-process">
          <div
            class="empty-zone"
            v-if="!orderTabs.length"
          >
            {{ $t('task.PRIOR.DETAIL.emptyOrder') }}
          </div>
          <g-foldable
            ref="confList"
            v-for="item in orderTabs"
            :key="item.roleIdx"
            :title="item.name"
            :use-state="item.orderType"
            :overlapped-mem="item.updateTime | date"
          >
            <template #header-suffix>
              <conference-checklist
                v-if="item.beforeCheckList && item.beforeCheckList.length"
                :data="item.beforeCheckList"
                style="margin-left: 20px;"
                right="-90px"
                @save="updateTaskPreChkList(...arguments, item)"
              />
            </template>
            <!-- 확인사항 -->

            <template #contents>
              <!-- ☘️ 권한 {{ item.name }} : {{ item.hasPerm }} -->
              <section
                class="resource-area"
                v-for="resource in item.resourceList"
                :key="resource.id"
              >
                <!-- 🌸  디버깅용입니다!! 지우지 마세요! -->
                <!-- 🌸 워크플로우 기반으로 편집될 수 있는가? :: {{ resource.editable }} <br><br> -->

                <!-- """권한 : {{ item.hasPerm }}, [{{ resource.name }}] 의워크플로우 편집 가능 : {{ resource.editable }}, 승인 처리 여부 : {{ item.isApproval }}"""" -->
                <template v-if="resource.name === 'compute' || resource.name === 'ova'">
                  <task-compute
                    :data="resource.data"
                    :order-data="resource"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateComputeData"
                  />
                </template>

                <!-- <template v-if="resource.name === 'market'">
                  <task-marketplace
                    :data="resource.data"
                    :order-data="resource"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateMarketplaceData"
                  />
                </template> -->

                <!-- <template v-if="resource.name === 'database'">
                  <task-database
                    :data="resource.data"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateDatabaseData"
                  />
                </template> -->

                <template v-if="resource.name === 'storage'">
                  <task-storage
                    :data="resource.data"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateStorageData"
                  />
                </template>

                <!-- <template v-if="resource.name === 'network_l4'">
                  <task-l4
                    :data="resource.data"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateL4Data"
                  />
                </template> -->
                <!-- <template v-if="resource.name === 'network_l7'">
                  <task-l7
                    :data="resource.data"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateL7Data"
                  />
                </template> -->
                <!--
                <template v-if="resource.name === 'security'">
                  <task-security
                    :data.sync="resource.data"
                    field="conference"
                    :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateSecurityData"
                    :order-info.sync="orderInfo"
                  />
                </template> -->
              </section>

              <!-- 🌸  디버깅용입니다!! 지우지 마세요! -->
              <!-- <br><br>🌸 권한 : {{ item.hasPerm }}, 내부 자원중에 편집 가능한 자원이 있는지 : {{ item.workEditable }}, 승인 처리 여부: {{ item.isApproval }}
              <br><br>🔶 모든 자원을 기반으로 승인버튼 노출 가능? {{ !item.isApproval && item.hasPerm && item.workEditable }} -->
              <div
                class="button-area"
                style="margin-top: 20px;"
                v-if="!item.isApproval && item.hasPerm && item.workEditable && !item.isRejected"
              >
                <button
                  class="button"
                  size="is-large"
                  type="is-primary"
                  @click="approveButtonAction(item)"
                >
                  <!-- 승인 -->
                  {{ $t('common.BTN.TASK.ack') }}
                </button>
              </div>
            </template>
          </g-foldable>
        </article>
      </template>
    </div>

    <div
      class="big-button-area -bottom"
      v-if="selectedOrderItem && showRejection"
    >
      <button
        class="button"
        size="is-large"
        @click="rejectButtonAction"
      >
        <!-- 주문 반려 -->
        {{ $t('common.BTN.TASK.orderReject') }}
      </button>
    </div>

    <!-- 모달 -->
    <el-dialog
      class="none-header approve-modal"
      :title="`${approveStep.currentStep} ${$t('task.PRIOR.try')}`"
      :visible.sync="approveStep.visible"
      width="330px"
      top="35vh"
    >
      <div v-if="approveStep.currentStep === '실패'">
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
      </div>

      <div v-if="approveStep.currentStep === '반려'">
        <p
          class="action-message"
          v-html="$t('task.PRIOR.DETAIL.message')"
        />

        <div>
          <el-input
            type="textarea"
            :autosize="{ minRows: 4, maxRows: 4 }"
            :placeholder="$t('common.PLACEHOLDER.enterReject')"
            resize="none"
            v-model="rejectReason"
          />
        </div>
      </div>

      <div class="modal-button-area">
        <button
          class="button -modal-button"
          @click="closeModal"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          type="is-primary"
          @click="approvalReject"
        >
          <!-- 확인 -->
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
    <!-- 반려처리 모달 -->

    <!-- 조직도 모달 -->
    <approval-modal
      v-if="blsmModal"
      :active.sync="blsmModal"
      @close="blsmModal = false"
      :resource-list="resourceList"
      @confirm="setTask"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Dayjs from 'dayjs'
import VueCookies from 'vue-cookies'

import GFoldable from '@/components/common/g-foldable/g-foldable'
import CMPDropDown from '@/components/common/g-drop-down/cmp-drop-down'
import TaskMemo from '../../TaskMemo/TaskMemo'
import ConferenceCheckList from '@/components/ConferenceCheckList/ConferenceCheckList'
import ApprovalMemberModal from '@/components/Modal/ApprovalMemberModal/ApprovalMemberModal'
import ConfDetailApply from './ConfDetailApply'
import ConfSourceLists from './ConfSourceLists'

import TaskCompute from '../../TaskResource/TaskCompute/TaskCompute'
// import TaskMarketplace from '../../TaskResource/TaskMarketplace/TaskMarketplace'
// import TaskDatabase from '../../TaskResource/TaskDatabase/TaskDatabase'
import TaskStorage from '../../TaskResource/TaskStorage/TaskStorage'
// import TaskL4 from '../../TaskResource/TaskNetwork/TaskL4/TaskL4'
// import TaskL7 from '../../TaskResource/TaskNetwork/TaskL7/TaskL7'
// import TaskSecurity from '../../TaskResource/TaskSecurity/TaskSecurity'
import TaskDetailCommon from '../../TaskDetailCommon'

import API from '@/components/Apis/'

export default {
  name: 'ConferenceDetail',
  components: {
    'g-foldable': GFoldable,
    'cmp-drop-down': CMPDropDown,

    'conf-detail-apply': ConfDetailApply,
    'conf-source-lists': ConfSourceLists,

    'task-compute': TaskCompute,
    // 'task-marketplace': TaskMarketplace,
    // 'task-database': TaskDatabase,
    'task-storage': TaskStorage,
    // 'task-l4': TaskL4,
    // 'task-l7': TaskL7,
    // 'task-security': TaskSecurity,

    'task-memo': TaskMemo,
    'conference-checklist': ConferenceCheckList,
    'approval-modal': ApprovalMemberModal
  },
  mixins: [TaskDetailCommon],
  watch: {
    selectedOrderItem (item) {
      this.setOrderTabs()
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  created () {
    this.initialize()
    // this.getApprovalStatus() // ❌
  },
  methods: {
    async getApprovalStatus () {
      const data = await API.admin.settings.getApprovalSetting()
      this.approvalStatus = data.useYn
      // this.approvalStatus = false // 결재 미사용 테스트 코드 false 일 경우
    },
    /**
     * 화면 처음 진입시 설정해줍니다.
     */
    async initialize () {
      await this.setDetailData()
      if (this.$route.params.id) this.setBreadCrumbs(this.taskData)
    },
    /**
     * 기본 데이터를 세팅해줍니다.
     */
    async setDetailData () {
      this.selectedOrderItem = null
      this.orderTabsOrigin = []
      this.orderTabs = JSON.parse(JSON.stringify(this.orderTabsOrigin))
      const response = await this.getTaskPreDetail()

      // console.log(response, ' ---- 🐣 ConferenceDetail DATA')
      if (response) {
        this.taskData = response
        this.orderDataList = [...response.orders]
      }
    },
    /**
     * 업무 데이터를 가져옵니다.
     */
    async getTaskPreDetail () {
      try {
        this.loading = true
        const response = await API.task.getTaskPreDetail(this.$route.params.id)

        if (!response || response.status) {
          return this.$router.replace({ name: 'not-found-status', params: { code: response.status } })
        }
        return response
      } catch (error) {
        console.error('@@@ getTaskPreDetail Error : ', error)
        const message = {
          ODR1004: '해당 티켓이 존재하지 않습니다.'
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
      const crumb = VueCookies.get('CMPLang') === 'en' ? '' : this.$t('common.TERMS.payNumber')
      this.$store.commit('common/ADD_PARAMETERS', {
        label: `${crumb} ${this.$route.params.id}`,
        path: '',
        statusKo: taskStatus,
        status: this.status[state].color
      })
    },
    /**
     * 데이터 가공 / 주문번호 내부 데이터가 없을 경우 해당 tab을 삭제합니다 (중요! 메인 기능)
     */
    setOrderTabs (orderTabsOrigin = this.orderTabsOrigin) {
      const copyTabs = JSON.parse(JSON.stringify(orderTabsOrigin))
      const tabsHasData = copyTabs.filter(tab => tab.orderDataList)
      this.showRejection = false

      this.orderTabs = tabsHasData.map(data => {
        // 권한 설정 - 변경 권한이있을 경우 true : 없을 경우 false
        let hasPerm = false
        if (this.user.userPermLevel === 0) hasPerm = true
        else {
          const hasPermLen = this.user.userPermUpperRoleList?.filter(perm => perm.roleUpperName === data.roleName).length
          hasPerm = Boolean(hasPermLen)
        }

        // 승인 여부 확인
        const isApproval = !(data.isApproval === undefined || data.isApproval === false)

        // 편집 가능여부 설정
        const editValidator = data.taskList.map(list => {
          const type = list.workType === 'OVA' ? 'COMPUTE' : list.workType
          return { type: type.toLowerCase(), editable: list.workFlowTaskExecutePerm }
        })

        // ['COMPUTE', 'NETWORK_L7'....] 중복없는 그리드 리스트 제작
        const workTypesTemp = new Set(data.orderDataList.map(list => {
          const type = list.workType === 'OVA' ? 'COMPUTE' : list.workType
          return type
        }))
        // const workTypesTemp = new Set(data.orderDataList.map(list => list.workType))

        // 업무 탭 내부 데이터 가공
        const workTypes = Array.from(workTypesTemp).map(type => {
          // 각 grid 데이터 입력
          // ## [OVA] ova 자원  compute와 동일하게 처리..
          const filteredTypeGridData = data.orderDataList.filter(list => {
            if (list.workType === 'OVA' && type === 'COMPUTE') return list
            else if (list.workType === type) return list
          })
          const gridData = filteredTypeGridData.map(list => list.orderData)
          const orderDataIdx = filteredTypeGridData.map(list => list.orderDataIdx)[0]

          // 워크플로우 내 on 으로 활성화되어있을 경우(변경 가능할 경우)
          let taskGridData = {}
          editValidator.forEach(work => {
            const customType = type === 'OVA' ? 'COMPUTE' : type
            if (work.type.toLowerCase() === customType.toLowerCase()) {
              taskGridData = {
                name: type.toLowerCase(),
                orderDataIdx,
                data: gridData,
                editable: customType.toLowerCase() === work.type ? work.editable : false, // 워크플로우 기반 편집 가능 여부
                rawInfo: JSON.parse(JSON.stringify(data)) // [변경/저장] 버튼 클릭시 데이터를 그대로 보내기 위한 틀(?)
              }
            }
          })

          return taskGridData
        })

        // 편집 가능 여부
        const workEditable = workTypes.some(work => work.editable)

        // 사전 확인사항
        return {
          roleName: data.roleName,
          roleIdx: data.roleIdx,
          name: data.roleName,
          hasPerm,
          workEditable,
          orderType: data.orderType,
          resourceList: workTypes,
          beforeCheckList: data.beforeCheckList,
          isRejected: this.orderInfo.proceedStatus === 'REJECT',
          isApproval // 승인 버튼 노출 여부 (승인여부)
        }
      })

      // 반려 버튼 설정
      //    -> 최고 관리자일경우 || 특정 워크플로우 권한이 하나라도 있으면 반려버튼을 보여줍니다. (위에서 이미 설정해둠)
      //    -> && (모두 승인이 완료된 경우 || 이미 반려가 된 경우)가 아닌경우에만 보여줍니다.
      const rejectPerm = this.orderTabs.some(order => order.hasPerm && order.workEditable)
      const processed = this.orderTabs.every(order => order.isApproval) || this.orderInfo.proceedStatus === 'REJECT'
      this.showRejection = rejectPerm && !processed

      // console.log('%c ------ orderTabs', 'color: #9AE2FF')
      // console.log(this.orderTabs, this.showRejection)
      // console.log('유저 워크플로우 권한 :: ', this.user.userPermUpperRoleList)
    },
    /**
     * 주문번호 선택시 발생하는 이벤트
     * @param {Object} orderData 주문번호등의 정보를 가집니다.
     */
    selectTaskTableData (orderData) {
      // console.log('%c orderData', 'color: #9D9AFF')
      // console.log(orderData, '-----orderData')

      // 주문번호 선택할 때마다 하단 모든 폴더 닫기
      const confList = this.$refs.confList
      if (confList) {
        for (const list of confList) list.foldState = false
      }

      this.selectedOrderItem = orderData

      const taskSetting = this.orderDataList.filter(order => order.orderInfo.orderNo === orderData.orderNo)[0]
      this.orderTabsOrigin = taskSetting.roles.map(role => {
        role.orderType = taskSetting.orderInfo.orderType.toLowerCase()

        return role
      })

      this.orderInfo = taskSetting.orderInfo

      // 메모 이력 데이터 입력
      this.memoLists = {
        approvalNo: this.$route.params.id,
        orderNo: orderData.orderNo,
        data: taskSetting.orderMemoList?.filter(list => list.orderNo === orderData.orderNo)
      }
    },
    /**
     * [승인] 버튼 클릭시 동작합니다.
     * @param {Object} item 역할 데이터
     */
    async approveButtonAction (item) {
      if (item.orderType === 'delete') {
        // 삭제 자원일 경우 compute vm 이 사용되고있는지 확인합니다.
        const target = item.resourceList.filter(source => source.name === 'compute')
        const hostNames = []
        for (const source of target) {
          for (const data of source.data) hostNames.push(data.hostname)
        }

        const allResp = [] // 전체 요청의 결과를 저장합니다

        for (let i = 0; i < hostNames.length; i++) {
          const hostName = hostNames[i]
          try {
            this.loading = true
            this.loadingText = this.$t('common.ALERT.APPROVAL.017') // 삭제 가능 여부를 확인중입니다. 다소 시간이 소요될 수 있습니다.

            // 결재 플로우 확인
            const response = await API.task.vmWorkingCheck(hostName)
            allResp.push(response)
          } catch (error) {
            console.error(error)
          } finally {
            this.loading = false
            this.loadingText = ''
          }
        }

        const isUsing = await this.setUsingVmsToText(allResp)
        if (!isUsing) return
      }

      return this.proceedApprove(item)
    },
    /**
     * @function
     * @param {Object} item
     * 결재 실행 => 승인 버튼 클릭시 모달 오픈
     */
    proceedApprove (item) {
      this.selectWorkTab = item
      this.resourceList = [this.$store.state?.auth?.user]
      if (this.approvalStatus === false) {
        const listData = []
        this.setTask(listData)
        return
      } // 결재자 정보 입력 후 성공

      // (PLUS 모드일경우) 바로 결재 신청
      if (this.packageType === 'PL') {
        return this.$confirm(this.$t('common.CONFIRM.APPROVAL.003'), { // 해당 내용으로 결재하시겠습니까?
          confirmButtonText: this.$t('common.TERMS.yes'),
          cancelButtonText: this.$t('common.TERMS.no')
        })
          .then(this.approveWithoutMembers)
          .catch(() => false)
      }

      // (STAND, ENTER, BASIC 모드일경우) 조직도 모달 오픈
      this.blsmModal = true
    },
    /**
     * @function - 반려 버튼 클릭시 모달 오픈
     */
    rejectButtonAction () {
      this.approveStep = {
        visible: true,
        currentStep: '반려'
      }
    },
    /**
     * (PLUS 모드일 경우) 결재자를 현재 로그인한 관리자 정보로 설정하고, 결재를 신청
     */
    approveWithoutMembers () {
      const { userCompanyCode, userCompanyName, userGroupCode, userDuty, userGroup, userGroupName, userId, userIdx, userName, userPosition } = this.user
      const userList = [{
        companyCode: userCompanyCode,
        companyName: userCompanyName,
        groupCode: userGroupCode,
        groupName: `${userCompanyName} ${userGroupName}`, // 신세계I&C 데이터센터팀
        index: 0,
        no: 1,
        type: 'S', // 결재 S / 합의 A
        userCompany: userCompanyCode,
        userDuty,
        userGroup,
        userId,
        userIdx,
        userName,
        userPosition
      }]

      return this.setTask(userList)
    },
    async setTask (userList, user = this.user) {
      const orderDataIdxList = this.selectWorkTab.resourceList[0].rawInfo.orderDataList.map(order => order.orderDataIdx)

      const approvalData = {
        approvalNo: this.$route.params.id,
        orderNo: this.selectedOrderItem?.orderNo,
        roleIdx: this.selectWorkTab.roleIdx,
        roleName: this.selectWorkTab.roleName,
        orderDataIdxList: orderDataIdxList,
        userId: user?.userId,
        userName: user?.userName,
        userPosition: user?.userPosition,
        groupIdx: user?.userGroup,
        groupName: user?.userGroupName,
        groupCode: user?.userGroupCode,
        companyIdx: user?.userCompany,
        companyName: user?.userCompanyName,
        companyCode: user?.userCompanyCode,
        approvalUsers: JSON.parse(JSON.stringify(userList))
      }

      // console.log('%c ==== blossom 데이터랑 같이 보낼때 JSON.....', 'color: #D0FF9A')
      // console.log(approvalData)
      // this.$router.push({ name: 'task-conference' })

      return this.requestTask(approvalData)
    },
    async requestTask (task) {
      try {
        this.loading = true
        await API.order.requestTask(task)
        // 결재 신청이 완료되었습니다.
        return this.$alert(this.$t('common.ALERT.APPROVAL.009'), '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
          .then(() => this.checkIsLastOrder())
      } catch (error) {
        if (this.isAlreadyProcessed(error)) return

        const errorType = {
          'Cluster is null': this.$t('common.ALERT.CONF.011'), // 클러스터를 먼저 추가해주세요
          'Host is null': this.$t('common.ALERT.CONF.015'), // Host를 먼저 추가해주세요,
          'Image is null': this.$t('common.ALERT.CONF.016'), // Image를 먼저 추가해주세요,
          'Central is null': this.$t('common.ALERT.CONF.017'), // Central를 먼저 추가해주세요,
          'Network is null': this.$t('common.ALERT.CONF.018'), // 네트워크를 먼저 추가해주세요,
          'DB Parameter is null': this.$t('common.ALERT.CONF.019') // DB Parameter를 먼저 추가해주세요
        }[error.response.data.message]

        this.$alert(errorType || error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return false
      } finally {
        this.loading = false
      }
    },
    /**
     * [승인] 처리 시 마지막 주문인지 확인
     * 마지막 경우일 경우만 목록으로 이동,
     * 아닌 경우는 페이지 머물러서 페이지만 갱신
     */
    checkIsLastOrder () {
      let leftTask = 0
      this.orderTabs.forEach(tab => { if (tab.workEditable && !tab.isApproval) leftTask += 1 })

      // 마지막 주문일 경우에만 route 이동
      if (leftTask > 1) return this.afterUpdatedHandler()
      else return this.$router.push({ name: 'task-conference' })
    },
    /**
     * 서버 > 자원 탭에서 저장 버튼 클릭시 orderList 업데이트
     * @param {Object}
     */
    async updateComputeData (updatedData) {
      this.saveUpdatedData('COMPUTE', updatedData)
    },
    updateMarketplaceData (updatedData) {
      this.saveUpdatedData('MARKET', updatedData)
    },
    updateDatabaseData (updatedData) {
      this.saveUpdatedData('DATABASE', updatedData)
    },
    updateStorageData (updatedData) {
      this.saveUpdatedData('STORAGE', updatedData)
    },
    async updateL4Data (updatedData) {
      this.saveUpdatedData('NETWORK_L4', updatedData)
    },
    updateL7Data (updatedData) {
      this.saveUpdatedData('NETWORK_L7', updatedData)
    },
    updateSecurityData (updatedData) {
      this.saveUpdatedData('SECURITY', updatedData)
    },
    /**
     * @param {String} type NETWORK_L4, COMPUTE ... 등 타입필요
     * @param {Array} data updated된 그리드 필요
     */
    async saveUpdatedData (type, data) {
      // console.log('%c 살려주세요', 'color: #9AE2FF')
      const reqFormat = []
      this.orderTabs.forEach(tab => {
        tab.resourceList.forEach(list => {
          const resourceName = list.name === 'ova' ? 'compute' : list.name // ## [OVA] ova 자원  compute와 동일하게 처리..
          if (list.editable && resourceName === type.toLowerCase()) {
            reqFormat.push(list.rawInfo)
            list.data = [...data] // update 된 데이터를 바로 저장합니다
          }
        })
      })

      let updateData = []
      reqFormat.forEach(info => {
        const getData = info.orderDataList.filter(order => {
          if (order.workType === 'OVA' && type === 'COMPUTE') return order // ## [OVA] ova 자원  compute와 동일하게 처리..
          else if (order.workType === type) return order
        })
        updateData = getData.map((dt, idx) => {
          dt.orderData = data[idx]
          return dt
        })
      })

      const payload = {
        userId: this.user?.userId,
        userName: this.user?.userName,
        userPosition: this.user?.userPosition,
        groupIdx: this.user?.userGroup,
        groupName: this.user?.userGroupName,
        taskDataList: updateData
      }

      try {
        await API.task.insertTaskData(payload)
        this.$alert(this.$t('common.ALERT.BASE.049'), { // 저장되었습니다
          callback: () => {
            // 전체 데이터를 다시 가져옵니다.
            return this.afterUpdatedHandler()
          }
        })
      } catch (error) {
        console.error(error)
        // 작업을 변경하는 도중 문제가 발생하였습니다. <br> 관리자에게 문의해주세요.
        this.$alert(this.$t('task.TODO.DETAIL.errorSave'), {
          dangerouslyUseHTMLString: true,
          callback: () => this.setDetailData()
        })
      }
    },
    /**
     * 사전협의 저장 후 전체 데이터를 다시 세팅합니다.
     */
    async afterUpdatedHandler () {
      const response = await this.getTaskPreDetail()

      // console.log(response, ' ---- ✅ 🐣 ConferenceDetail DATA')
      if (response) {
        this.orderDataList = [...response.orders]

        const taskSetting = this.orderDataList.filter(order => order.orderInfo.orderNo === this.selectedOrderItem.orderNo)[0]
        this.orderTabsOrigin = taskSetting.roles.map(role => {
          role.orderType = taskSetting.orderInfo.orderType.toLowerCase()

          return role
        })
        this.setOrderTabs(this.orderTabsOrigin)
      }
    },
    /**
     * @function - 모달을 닫을 때 모든 value를 삭제합니다.
     */
    closeModal () {
      this.approveStep.visible = false
      this.failReason = ''
      this.rejectReason = ''

      // 모달이 사라지기 전 데이터가 먼저 사라지므로 2초 뒤에 모달 내용을 삭제합니다.
      setTimeout(() => { this.approveStep.currentStep = null }, 200)
    },
    async approvalReject () {
      // 정말 반려 처리 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.CONF.006'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        try {
          const payload = {
            approvalNo: this.$route.params.id,
            orderNo: this.selectedOrderItem?.orderNo,
            reason: this.rejectReason,
            userId: this.user.userId,
            userName: this.user.userName,
            userPosition: this.user.userPosition,
            groupIdx: this.user.userGroup,
            groupName: this.user.userGroupName
          }
          const res = await API.task.insertTaskPreReject(payload)
          if (res) {
            this.$alert(this.$t('common.ALERT.PROJECT.035')) // 반려 처리 되었습니다.
            this.$router.push({ name: 'task-list' })
          }
        } catch (error) {
          return this.isAlreadyProcessed(error)
        }
      }).catch(() => false)
    },
    /**
     * 사전협의에서 [변경] 시 메모 insert 할때 사용했음 - @@ Deprecated
     */
    async sendMemo (memo, isAuto = false) {
      console.error('@@ Deprecated : sendMemo()')
      const user = this.user
      const orderNo = this.selectedOrderItem?.orderNo
      const memoData = {
        companyIdx: user.userCompany,
        companyName: user.userCompanyName,
        groupIdx: user.userGroup,
        groupName: user.userGroupName,
        memo,
        orderNo,
        isAuto,
        userId: user.userId,
        userName: user.userName,
        userPosition: user.userPosition
      }

      try {
        const insert = await API.task.insertMemo(memoData)

        if (insert) this.afterMemoUpdated()
      } catch (error) {
        console.error('@@@ insertMemo Error', error)
      }
    },
    // 메모 전송 후 데이터 refetch
    async afterMemoUpdated () {
      const response = await this.getTaskPreDetail()
      const memoListData = response.orders.filter(order => order.orderInfo.orderNo === this.selectedOrderItem?.orderNo)[0]

      const updateData = {
        approvalNo: this.memoLists.approvalNo,
        data: memoListData?.orderMemoList ? memoListData.orderMemoList : [],
        orderNo: this.selectedOrderItem?.orderNo
      }

      this.memoLists = { ...updateData }
      this.$forceUpdate()
    },
    // 체크리스트 업데이트
    async updateTaskPreChkList (chkParam, roleInfo) {
      const userInfo = {
        companyIdx: this.user?.userCompany,
        companyName: this.user?.userCompanyName,
        groupIdx: this.user?.userGroup,
        groupName: this.user?.userGroupName,
        orderNo: this.selectedOrderItem?.orderNo,
        roleIdx: roleInfo?.roleIdx,
        userId: this.user?.userId,
        userName: this.user?.userName,
        userPosition: this.user?.userPosition
      }
      const payload = {
        ...userInfo,
        beforeCheckList: [...chkParam]
      }
      const res = await API.task.updateTaskPreChkList(payload)
      if (res) {
        this.$alert(this.$t('common.ALERT.CONF.009'))
      } else { this.$alert(this.$t('common.ALERT.CONF.010')) }
    }
  },
  data () {
    return {
      approvalStatus: true,
      viewApplyInfo: true,
      selectWorkTab: {},
      loading: false,
      loadingText: '',
      resourceList: [],
      blsmModal: false,
      selectedOrderItem: null,
      taskData: {},
      orderDataList: [],
      memoLists: [],
      approveStep: {
        visible: false,
        currentStep: ''
      },
      detailModal: {
        checkListModal: false,
        momoDropdownModal: false
      },
      failReason: '',
      rejectReason: '',
      orderInfo: null,
      orderTabs: [],
      orderTabsOrigin: [],
      showRejection: false,
      // 자원 테이블 데이터
      computeGridData: [
        { id: 28, marketplaceInfo: 'ssgtest-IWEB 28', hostName: 'ssgtest-eWEB1', osVersion: 'CenTOS 7.6-7', ip: { status: { f: 'SDN', i: '외부' }, auto: true, address: '61.282.12' }, network: 'vlan', vcpu: '7', memory: 12, rootDisk: 50, externalDisk: '210Tb (10EA)', installProgram: [{ idx: 1, label: '설치프로그램1' }], clusterNode: { cluster: '', node: '' }, workResult: true }
      ],
      databaseGridData: [],
      storageGridData: [],
      marketplaceGridData: [],
      l4GridData: [],
      l7GridData: [],
      securityGridData: [],
      // 체크리스트 임시 데이터
      checkListExamData: [
        {
          id: 'itsm',
          title: 'ITSM',
          isCheckList: true,
          type: 'checkbox',
          setList: [
            { title: 'check List' },
            { title: 'check List' },
            { title: 'check List' }
          ]
        },
        {
          id: 'emergency',
          title: '비상 시 행동요령',
          isCheckList: true,
          type: 'checkbox',
          setList: [
            { title: 'check List' },
            { title: 'check List' },
            { title: 'check List' }
          ]
        }
      ],
      isAlreadyProcessed (error) {
        if (error.response.data.message === 'Rest Error : duplicate operation') {
          // 이미 다른 관리자가 승인한 자원입니다. <br> 사전협의 목록으로 돌아갑니다.
          this.$alert(this.$t('common.ALERT.PROJECT.058'), '알림', {
            dangerouslyUseHTMLString: true,
            confirmButtonText: this.$t('common.BTN.confirm'),
            callback: () => this.$router.push({ name: 'task-conference' })
          })
          return true
        } else return false
      }
    }
  }
}
</script>

<style lang="scss">
.conference-detail {
  .conference-section-title {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 18px;
  }
  .conference-body {
    .conf-lists {
      border-top: 1px solid $border-color;
    }
  }
  .panel-sub-title {
    font-size: 16px;
    font-weight: normal;
    margin: $gap 0;
  }

  .slide-enter-active,
  .slide-leave-active {
    transition: all .3s ease;
  }
  .slide-enter, .slide-leave-to {
    transform: translateY(-0px);
    opacity: 0;
  }
}

.conference-contents {
  position: relative;
  .conferenc-top-wrap {
    position: relative;
    display: flex;
    justify-content: space-between;
    margin-top: $gap;
    > .conference-title {
      font-size: 16px;
      font-weight: bold;
      color: $white;
    }
    .icon-button {
      color: $color-lightgrey;
      .icon-bubble {
        display: inline-block;
        margin-right: 5px;
        width: 22px;
        height: 21px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../../../../assets/images/icon-bubble@3x.png');
      }
    }
  }
  > article {
    border-radius: $radius-m;
    box-sizing: border-box;
  }

  .conf-process {
    // padding: $gap 0;
    margin-top: $gap-s;
    flex: 1 1 auto;

    .resource-area {
      & + .resource-area {
        margin-top: $gap-m;
      }
      .process-top-area {
        display: flex;
        align-items: center;
        // margin-bottom: $gap-s;
        > .sub-title {
          margin-bottom: 0;
        }
        > small {
          margin-left: $gap-s;
          font-size: 14px;
          color: #b4b4b4;
        }
      }
    }
  }
  .ip-grid {
    // border: 1px solid pink;
    display: flex;
    height: inherit;
  }
  .ip-info {
    margin-left: $gap-s;
    display: flex;
    align-items: center;
    > div {
      width: 120px;
      margin-right: $gap-s;
    }
    .ip-input {
      margin-right: $gap-s;
    }
  }

  .button-area {
    // margin-top: $gap;
    display: flex;
    justify-content: center;
  }

  .big-button-area {
    &.-bottom {
      margin-top: $gap * 2;
      padding-top: $gap;
      border-top: 1px solid $main-black;
    }
  }

}

.action-message {
  margin-bottom: $gap-m;
  line-height: 2;
  text-align: center;
}
</style>
