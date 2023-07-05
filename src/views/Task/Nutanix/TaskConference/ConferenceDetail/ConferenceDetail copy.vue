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
      <span>{{ $v('주문 정보') }}</span>
      <a
        :class="['mdi', fold ? 'mdi-chevron-up' : 'mdi-chevron-down']"
        style="margin-left: 8px;"
        @click="fold = !fold"
      />
      <approved-detail-origin
        class="approval-view"
        :button="$v('결재 문서 조회')"
        :data="clientApprovalDetailRsp"
      />
    </h2>
    <transition name="slide">
      <div
        class="conference-body"
        v-if="fold"
      >
        <conf-detail-apply :data="taskData" />
      </div>
    </transition>
    <!-- /. 주문 정보 -->

    <section>
      <h2
        class="conference-section-title"
        style="margin-top: 50px;"
      >
        {{ $t('task.PRIOR.DETAIL.content') }}
      </h2>

      <article class="body-content">
        <el-tooltip
          effect="light"
          popper-class="shade-popper"
        >
          <span class="guide">
            {{ $v('사용방법') }}
            <i class="mdi mdi-information-outline" />
          </span>
          <div slot="content">
            {{ $v('시간당 예상 비용은 실제 청구되는<br>금액과 다를 수 있습니다.') }}
          </div>
        </el-tooltip>

        <g-tab
          :data="tabs"
        >
          <template #name="{ row }">
            {{ row.name }}
            <span class="view-count">{{ row.count }}</span>
          </template>

          <template
            v-for="tab in tabs"
            :slot="tab.field"
          >
            <div
              class="conference-contents"
              :key="tab.field"
            >
              <!-- :use-state="item.orderType" -->
              <!-- :overlapped-mem="item.updateTime | date" -->
              <g-foldable
                ref="confList"
                v-for="(item, key) in roleData[tab.field]"
                :key="key"
                :title="setCount(key, item.length)"
                :use-state="taskData.orderType"
              >
                <template #contents>
                  <!-- {{ item }}
                  {{ key }} -->
                  <!-- :order-data="resource"
                :order-type="item.orderType"
                :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                @update="updateComputeData" -->
                  <task-compute
                    v-if="key === 'COMPUTE'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                  />

                  <!-- :order-type="item.orderType"
                  :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                  @update="updateStorageData" -->
                  <task-storage
                    v-if="key === 'STORAGE'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                  />

                  <!-- :order-type="item.orderType"
                  :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                  @update="updateSecurityData"
                  :order-info.sync="orderInfo" -->
                  <task-security
                    v-if="key === 'SECURITY'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                  />

                  <!-- :order-type="item.orderType"
                  :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                  @update="updateL4Data" -->
                  <task-l4
                    v-if="key === 'NETWORK_L4'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                  />

                  <!-- :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateL7Data" -->
                  <task-l7

                    v-if="key === 'NETWORK_L7'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                  />

                  <!-- :order-type="item.orderType"
                  :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                  :order-data="resource"
                  @update="updateMarketplaceData" -->
                  <task-marketplace
                    v-if="key === 'MARKET'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                  />

                  <!-- :order-type="item.orderType"
                    :editable="resource.editable && !item.isApproval && item.hasPerm && !item.isRejected && item.orderType !== 'delete'"
                    @update="updateDatabaseData" -->
                  <task-database
                    v-if="key === 'DATABASE'"
                    :data="item"
                    field="conference"
                    @cancel-order="rows => cancelOrder(rows, tab)"
                    @update-source="data => updateSource(data, tab)"
                  />
                  <!-- /. 자원 목록 -->
                </template>
              </g-foldable>

              <div class="button-area">
                <button
                  class="button"
                  size="is-large"
                  v-if="setButtons(tab.setting, 'writeDoc')"
                  @click="reportOrder(true, tab)"
                >
                  <!-- @click="docRegistred(tab) ? updateReportOrder(tab) : reportOrder(true, tab)" -->
                  {{ docRegistred(tab) ? $v('보고서 수정') : $v('보고서 작성') }}
                </button>
                <button
                  class="button"
                  size="is-large"
                  type="is-primary"
                  :disabled="!docRegistred(tab)"
                  v-if="setButtons(tab.setting, 'approval')"
                  @click="applyApproval(tab)"
                >
                  {{ $v('결재 신청') }}
                </button>
                <button
                  class="button"
                  size="is-large"
                  type="is-primary"
                  v-if="setButtons(tab.setting, 'toTodo')"
                  @click="completeWorkReveiw(tab)"
                >
                  {{ $v('할 일로 이동') }}
                </button>
              </div>
            </div>
          </template>
        </g-tab>
      </article>
    </section>
    <!-- /. -->

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

    <task-floating-memo :order-no="$route.params.id" />
    <!-- /. 메모 -->

    <cancel-order
      :data="cancelOrderActive.data"
      :active="cancelOrderActive.view"
      @confirm="setDetailData_V3"
      @close="cancelOrderActive = { view: false, data: null }"
    />
    <!-- /. [주문취소] 모달 -->

    <document-order
      :data="reportOrderActive.data"
      :active="reportOrderActive.view"
      @close="reportOrder(false, {})"
    />
    <!-- /. [보고서 작성/변경] 모달 -->
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Dayjs from 'dayjs'
import VueCookies from 'vue-cookies'

import GFoldable from '@/components/common/g-foldable/g-foldable'
import TaskFloatingMemo from '@/components/TaskFloatingMemo/TaskFloatingMemo'
import CancelOrder from '@/components/CancelOrder/CancelOrder'
import DocumentOrder from '@/components/DocumentDetail/DocumentOrder/DocumentOrder'
import ApprovalMemberModal from '@/components/Modal/ApprovalMemberModal/ApprovalMemberModal'
import ApprovedDetailOrigin from '../../TaskApproved/ApprovedDetail/ApprovedDetailOrigin'
import ConfDetailApply from './ConfDetailApply'

import TaskCompute from '../../TaskResource/TaskCompute/TaskCompute'
import TaskMarketplace from '../../TaskResource/TaskMarketplace/TaskMarketplace'
import TaskDatabase from '../../TaskResource/TaskDatabase/TaskDatabase'
import TaskStorage from '../../TaskResource/TaskStorage/TaskStorage'
import TaskL4 from '../../TaskResource/TaskNetwork/TaskL4/TaskL4'
import TaskL7 from '../../TaskResource/TaskNetwork/TaskL7/TaskL7'
import TaskSecurity from '../../TaskResource/TaskSecurity/TaskSecurity'
import TaskDetailCommon from '../../TaskDetailCommon'

import API from '@sd-fe/cmp-core'

export default {
  name: 'ConferenceDetail',
  components: {
    'g-foldable': GFoldable,

    'conf-detail-apply': ConfDetailApply,
    'task-compute': TaskCompute,
    'task-marketplace': TaskMarketplace,
    'task-database': TaskDatabase,
    'task-storage': TaskStorage,
    'task-l4': TaskL4,
    'task-l7': TaskL7,
    'task-security': TaskSecurity,
    'task-floating-memo': TaskFloatingMemo,
    'cancel-order': CancelOrder,
    'document-order': DocumentOrder,
    'approval-modal': ApprovalMemberModal,
    'approved-detail-origin': ApprovedDetailOrigin
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
  },
  methods: {
    /**
     * 화면 처음 진입시 설정해줍니다.
     */
    async initialize () {
      await this.setDetailData_V3()
      if (this.$route.params.id) this.setBreadCrumbs_V3(this.taskData)
    },

    /**
     * 기본 데이터를 세팅해줍니다.
     */
    async setDetailData () {
      this.selectedOrderItem = null
      this.orderTabsOrigin = []
      this.orderTabs = JSON.parse(JSON.stringify(this.orderTabsOrigin))
      const response = await this.getTaskPreDetail()

      if (response) {
        this.taskData = response
        this.orderDataList = [...response.orders]
      }
    },

    /**
     * 기본 데이터를 세팅해줍니다. (v3)
     */
    async setDetailData_V3 () {
      const orderNo = this.$route.params.id
      const response = await API.work_v3.getWorkReviewDetail(orderNo)

      console.log(response, ' ---- 🐣 ConferenceDetail DATA')
      if (response) {
        const { clientApprovalDetailRsp, ordererCompany, ordererGroup, projectName, orderType, orderReqNote, createTime, orderer, expectedDay, memos } = response
        const orderTypeLabel = { NEW: this.$v('신규'), CHANGE: this.$v('변경'), DELETE: this.$v('삭제'), URGENT: this.$v('긴급') }[orderType]

        // 주문정보
        this.taskData = {
          companyName: ordererCompany.name, // 관계사
          groupName: ordererGroup.name, // 조직명
          projectName, // 프로젝트명
          orderType, // 구분
          orderTypeLabel, // 구분 (한국어)
          name: orderReqNote, // 주문요청제목
          createTime, // 주문일
          userName: orderer.name, // 주문자
          finishTime: expectedDay // 완료희망일
        }
        // this.orderDataList = [...response.orders]

        // [결재 문서 조회] 데이터 세팅
        this.clientApprovalDetailRsp = clientApprovalDetailRsp

        // 데이터 세팅 시작
        const setTabs = {}
        const roleSetting = {} // 보고서, 결재설정 정보 분리

        response.workRsps.forEach(({ workState, workItemRsps: source, workId, roleIdx, roleName, useApproval, useDoc, approvalDocument, ...workResps }) => {
          const services = {} // COMPUTE / NEWTORK / STORAGE / DATABASE ... 분류

          for (let i = 0; i < source.length; i++) {
            const { idx: srcIdx, workItemSpec, service } = source[i]
            const { actualJson } = workItemSpec
            // originJson (원본데이터), actualJson (작업대상데이터(변경된 or 변경가능한 데이터))
            // console.log(source[i])

            const data = { ...JSON.parse(actualJson), srcIdx }

            // 자원 foldable 용으로 분류
            if (services[service] === undefined) services[service] = [data]
            else services[service].push(data)
          }

          const key = `${roleIdx}_${roleName}`

          // role 기반으로 데이터 분리 및 저장
          if (setTabs[key]) setTabs[key] = { ...services }
          else setTabs[key] = { ...setTabs[key], ...services }

          // [워크플로우] 결재 on/off 여부, 보고서 설정 데이터 저장
          roleSetting[key] = { useApproval, useDoc, approvalDocument, workState, workId }
        })

        this.tabs = [] // role 기반 분리

        // tab 설정
        for (const key in setTabs) {
          let count = 0
          for (const src in setTabs[key]) count += setTabs[key][src]?.length

          const roleName = key.split('_')[1]
          const roleIdx = key.split('_')[0]

          // console.log(key, roleSetting[key])
          const setting = roleSetting[key]
          const workId = setting.workId

          const tab = { field: key, name: roleName, roleIdx, count, workId, setting }
          this.tabs.push(tab)
        }

        this.roleData = setTabs // 자원 기반 분리

        // 메모 설정
        this.memoLists = [...memos]
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
     * [보고서 작성] 버튼 클릭시 동작 (모달 팝업)
     * @param {Boolean} view
     * @param {Object|null} tab
     */
    reportOrder (view, tab) {
      const orderNo = this.$route.params.id
      this.reportOrderActive = {
        view,
        data: { ...tab, orderNo }
      }
    },
    /**
     * [보고서 수정] 버튼 클릭시 동작 (페이지 이동)
     * @param {Boolean} view
     * @param {Object|null} tab
     */
    // updateReportOrder ({ roleIdx }) {
    //   const orderNo = this.$route.params.id
    //   return this.$router.push(
    //     {
    //       name: 'task-document',
    //       params: { orderNo },
    //       query: { roleIdx }
    //     })
    // },

    /**
     * [할 일로 이동] 버튼 클릭시 확인창
     */
    completeWorkReveiw ({ workId }) {
      return this.$confirm(this.$v('할 일로 이동하시겠습니까?'))
        .then(() => this.setComplete(workId))
        .catch(() => false)
    },

    /**
     * 할일 이동 API 동작
     * @param {String} workId
     */
    async setComplete (workId) {
      try {
        const { userId, userName, userPosition } = this.user

        const payload = {
          id: userId,
          name: userName,
          position: userPosition
        }

        await API.work_v3.completeWorkReveiw(workId, payload)
        this.$alert(this.$v('업무가 할 일로 이동되었습니다.'), { callback: this.setDetailData_V3 })
      } catch (error) {
        console.error('@@ ConferenceDetail > setComplete', error)
      }
    },

    /**
     * [결재신청] 버튼 클릭시 페이지 이동
     */
    applyApproval (tab) {
      const step = this.$route.name.split('-')[0]

      const { workId, roleIdx: idx } = tab
      const orderNo = workId.split('-')[0]
      const roleIdx = Number(idx)

      return this.$router.push({
        name: 'task-apply-approval',
        params: { step, orderNo },
        query: { roleIdx }
      })
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
            const response = await API.work.vmWorkingCheck(hostName)
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
        await API.work.requestTask(task)
        // 결재 신청이 완료되었습니다.
        return this.$alert(this.$t('common.ALERT.APPROVAL.009'), '알림',
          {
            confirmButtonText: this.$t('common.BTN.confirm'),
            callback: this.checkIsLastOrder
          })
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
     * [자원정보] 저장 및 상세 새로고침
     * @param {Object} item
     * @param {Object} tab workId
     */
    async updateSource (item, { workId }) {
      try {
        const payload = { resourceSpec: JSON.stringify(item) }
        await API.work_v3.updateSource({ workId, itemIdx: item.srcIdx, payload })

        this.setDetailData_V3()
      } catch (error) {
        console.error('@@ ConferenceDetail > setResourceInfoItem : ', error)
      }
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
        await API.work.insertTaskData(payload)
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
          const res = await API.work.insertTaskPreReject(payload)
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
        const insert = await API.work.insertMemo(memoData)

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
      const res = await API.work.updateTaskPreChkList(payload)
      if (res) {
        this.$alert(this.$t('common.ALERT.CONF.009'))
      } else { this.$alert(this.$t('common.ALERT.CONF.010')) }
    }
  },
  data () {
    return {
      approvalStatus: true,
      fold: true,
      selectWorkTab: {},
      loading: false,
      loadingText: '',
      resourceList: [],
      blsmModal: false,
      selectedOrderItem: null,
      taskData: {},
      orderDataList: [],
      clientApprovalDetailRsp: {},
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
      },
      approvedDetailOrigin: false,

      // -------
      // -------
      // -------
      // -------
      // -------
      // -------

      cancelOrderActive: { // 주문취소 모달 On/Off
        view: false,
        data: null
      },
      reportOrderActive: { view: false, data: null }, // 보고서 작성 모달 On/Off
      tabs: [],
      roleData: [],
      setCount (key, length) {
        return `${key} (총 ${length}건)`
      },
      /**
       * [보고서] 등록여부 확인
       * (보고서 수정 / 보고서 작성) 텍스트 선택
       * @param {Object} tab 탭 정보
       */
      docRegistred ({ setting }) {
        return !!setting.approvalDocument
      },
      /**
       * 1. 결재사용 OFF (useApproval === false)
       * 2. 결재사용 ON && 보고서 사용 OFF  (useApproval === true) && (useDoc === false)
       * 3. 결재사용 ON && 보고서 사용 ON  (useApproval === true) &&  (useDoc === true)
       * @param {Boolean} useApproval 결재 사용여부
       * @param {Boolean} useDoc 보고서 사용여부
       * @param {String} button 버튼 종류
       */
      setButtons ({ useApproval, useDoc, workState }, button) {
        console.log('useApproval:', useApproval, 'useDoc: ', useDoc, button)

        if (workState === 'TODO') return false // 할일로 이동은 안보임

        return {
          writeDoc: (useApproval === true) && (useDoc), // [보고서 작성]
          approval: (useApproval === true), // [결재 신청]
          toTodo: (useApproval === false) // [할 일로 이동]
        }[button]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.conference-detail {
  .conference-section-title {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    font-size: 18px;
    position: relative;

    .approval-view {
      position: absolute;
      top: -5px; right: 0;
      font-size: 14px;
    }
  }

  .body-content {
    position: relative;

    .guide {
      position: absolute;
      top: $gap-s; right: 0;
      display: flex;
      width: 100px;
      align-items: center;
      justify-content: center;

      > i {
        display:block;
        margin-left: $gap-s;
      }
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

.view-count {
  display: inline-block;
  font-size: 12px;
  margin-left: $gap-s;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  color: $white;
  border-radius: 50%;
  background-color: $main-red;
}
</style>

<style lang="scss">
.conference-detail {
  a.-editable {
    color: $main-blue;
    display: inline-block;
    border-bottom: 1px solid $main-blue;
  }
}
</style>
