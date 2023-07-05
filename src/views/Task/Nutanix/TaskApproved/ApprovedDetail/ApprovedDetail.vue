<!--
  * 파일명 : ApprovedDetail.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-12-20
  * License By Shinsegae I&C
  * 2020-12-20 Merge branch 'dev' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/markupfix
 -->

<template>
  <div class="approved-detail">
    <div class="button-area -left">
      <approved-detail-origin
        class="approval-view"
        :button="$v('주문결재문서')"
        :data="clientApprovalDetailRsp"
        :approvers="approvers"
        is-review-mode
      />
    </div>

    <approved-detail-template
      :data="data"
      :order-list="orderList"
      :approvers="approvers"
      :set-approval-role="isApprovalRole"
      @update="execute"
    />

    <div class="button-area -center">
      <button
        class="button"
        size="is-large"
        @click="e => {
          $router.push({ name: 'task-approved' })
        }"
      >
        {{ $v('목록') }}
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import API, { ApprovalDraftUtil } from '@sd-fe/cmp-core'
import ApprovedDetailOrigin from './ApprovedDetailOrigin'
import ApprovedDetailTemplate from './ApprovedDetailTemplate'

export default {
  name: 'ApprovedDetail',
  mixins: [ApprovalDraftUtil.approvalUtil],
  props: {
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  provide () {
    return {
      $field_V3: () => 'DONE',
      $orderType: () => this.data?.clientApprovalDetailRsp?.order?.orderType
    }
  },
  components: {
    'approved-detail-origin': ApprovedDetailOrigin,
    'approved-detail-template': ApprovedDetailTemplate
  },
  created () {
    this.init()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  methods: {
    clickHandler (row) {
      this.tabName = row.key
    },
    approvalUserSetting (approvalUserList) {
      // [결재 / 합의] 할당된 계정 리스트 설정
      if (approvalUserList && approvalUserList.length) {
        const empty = { userPosition: '-', userName: '-' }
        this.approvers = approvalUserList.map(usr => {
          if (usr.type === 'S' || usr.type === 'M') return usr
          else return empty
        })
      }
    },
    gridDataSetting (gridData) {
      const compute = []
      const market = []
      const database = []
      const storage = []
      const l4 = []
      const l7 = []
      const sequrity = []
      const ec2 = []
      const efs = []
      const sg = []
      const tg = []
      const nlb = []

      let orderType = null
      if (gridData && gridData.length > 0) {
        gridData.forEach(p => {
          orderType = p.orderType
          p.orderData.createTime = p.createTime
          if (p.workType === 'STORAGE') storage.push(p.orderData)
          else if (p.workType === 'COMPUTE') compute.push(p.orderData)
          else if (p.workType === 'SECURITY') sequrity.push(p)
          else if (p.workType === 'NETWORK_L4') l4.push(p.orderData)
          else if (p.workType === 'NETWORK_L7') l7.push(p.orderData)
          else if (p.workType === 'MARKET') market.push(p.orderData)
          else if (p.workType === 'DATABASE') database.push(p.orderData)
          else if (p.workType === 'EC2') {
            ec2.push({
              ...p.orderData,
              orderType: p.orderType,
              workResult: {
                dataStatus: p.proceedStatus
              }
            })
          } else if (p.workType === 'EFS') {
            efs.push({
              ...p.orderData,
              orderType: p.orderType,
              workResult: {
                dataStatus: p.proceedStatus
              }
            })
          } else if (p.workType === 'SG') {
            sg.push({
              ...p.orderData,
              orderType: p.orderType,
              workResult: {
                dataStatus: p.proceedStatus
              }
            })
          } else if (p.workType === 'TARGET_GROUP') {
            tg.push({
              ...p.orderData,
              orderType: p.orderType,
              workResult: {
                dataStatus: p.proceedStatus
              }
            })
          } else if (p.workType === 'NLB_L4') {
            nlb.push({
              ...p.orderData,
              orderType: p.orderType,
              workResult: {
                dataStatus: p.proceedStatus
              }
            })
          }
        })
      }
      this.publicTabs = []
      this.dataExam = []
      if (compute.length > 0) {
        this.computeGridData = compute
        this.dataExam.push({ name: '서버', key: 'COMPUTE', useState: orderType })
      }

      if (l4.length > 0 || l7.length > 0 || sequrity.length > 0) {
        this.l4GridData = l4
        this.l7GridData = l7
        this.securityGridData = sequrity
        this.dataExam.push({ name: '네트워크', key: 'NETWORK', useState: orderType })
      }

      if (storage.length > 0) {
        this.storageGridData = storage
        this.dataExam.push({ name: '스토리지', key: 'STORAGE', useState: orderType })
      }
      if (database.length > 0) {
        this.databaseGridData = database
        this.dataExam.push({ name: '데이터베이스', key: 'DATABASE', useState: orderType })
      }
      if (market.length > 0) {
        this.marketplaceGridData = market
        this.dataExam.push({ name: '마켓플레이스', key: 'MARKET', useState: orderType })
      }

      if (ec2.length > 0) {
        this.ec2GridData = ec2
        this.publicTabs.push({ name: 'EC2', key: 'EC2', field: 'EC2' })
      }

      if (efs.length > 0) {
        this.efsGridData = efs
        this.publicTabs.push({ name: 'EFS', key: 'EFS', field: 'EFS' })
      }

      if (sg.length > 0) {
        this.sgGridData = sg
        this.publicTabs.push({ name: '보안그룹', key: 'SG', field: 'SG' })
      }

      if (tg.length > 0) {
        this.tgGridData = tg
        this.publicTabs.push({ name: 'TG', key: 'TG', field: 'TG' })
      }

      if (nlb.length > 0) {
        this.nlbGridData = nlb
        this.publicTabs.push({ name: 'NLB', key: 'NLB', field: 'NLB' })
      }

      this.tabName = this.publicTabs?.[0]?.key
      this.marketplaceGridData = market
    },
    async init () {
      try {
        this.isApproval = true

        const approvalNo = this.$route.params.approvalNo || this.$route.params.id
        const userId = this.user?.userId
        this.approvalNo = approvalNo

        // 현재 유저가 결재 승인 권리가 있는지 확인
        const taskUser = await this.checkApprovalUser({ approvalNo, userId })
        const { approvedTime, allocationDate } = taskUser

        // 정보가 없으면 빠꾸
        if (taskUser === null || this.approvalNo === undefined) this.$router.go(-1)

        // 결재 상세 확인
        const response = await API.work_v3.getWorkApprovalDetail(approvalNo)
        const { approverRsps, approvalState } = response
        this.data = response
        this.clientApprovalDetailRsp = response.clientApprovalDetailRsp // [주문결재문서 조회] 데이터 세팅

        if (response === null) this.$router.go(-1)

        // (결재권한이 있는 경우 && [결재대기함, 결재진행함] 인 경우 && 결재 승인이 되지 않은 경우) 에만 승인 가능함
        const approvable = approvalState === 'WAITING' || approvalState === 'PENDING'
        const approvalble2 = approvedTime === null // approvedTime :: 결재 승인이 안된 경우 null

        // 조건이 맞다면 [결재 승인] 권한 부여
        if (allocationDate && approvable && approvalble2) this.isApprovalRole = true

        // [결재 / 합의] 할당된 계정 리스트 설정
        if (approverRsps.length > 0) this.approvers = this.setApprovers(approverRsps)

        // 자원 정보 세팅
        this.orderList = [response?.workByItem]
      } catch (error) {
        this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        console.error(error)
      } finally {
        this.isApproval = false
      }
    },

    /**
     * 해당 결재에 [결재 승인] 할 권한이 있는지 확인
     * @param {Object} params
     * @return {Object|null}
     */
    async checkApprovalUser (params) {
      try {
        // 권한이 없으면 null
        const taskUser = await API.work_v3.getApprovalUser(params)

        return taskUser
      } catch (error) {
        console.error('@@ checkApprovalUser', error)

        return {}
      }
    },
    // async getTask (taskNo) {
    //   return API.work.getTaskAdmin({ approvalNo: taskNo })
    // },
    /**
     * [결재 승인/반려] 누를때
     */
    openConfirmModal (values) {
      this.approvalProcessModal = values
    },
    closeModal () {
      this.reason = ''
      this.approveProcess = null
      this.approvalProcessModal = {
        view: false,
        title: null,
        width: ''
      }
    },
    /**
     * [승인/반려] 실행시 동작
     */
    async execute (payload) {
      await this.updateTask(payload)
      this.closeModal()

      // 결재가 완료되었습니다.
      return this.$alert(this.$v('결재가 완료되었습니다.'))
    },
    /**
     * [승인/반려] API 실행
     * @param {String} type DONE(승인)|REJECT(반려)
     * @param {String} note 비고 작성
     */
    async updateTask ({ type, note }) {
      try {
        this.loading = true

        const { userId: id, userName: name, userPosition: position } = this.user

        const payload = {
          approvalKind: 'PLAN', // PLAN, REPORT, AA_REPORT
          approver: { id, name, position },
          note
        }

        if (type === 'DONE') await API.work_v3.approveApprovalReviewAdmin(this.approvalNo, payload)
        else await API.work_v3.rejectApprovalReviewAdmin(this.approvalNo, payload)

        this.$router.go(-1)
      } catch (error) {
        this.$alert(error, '', { confirmButtonText: this.$v('확인') })
        this.loading = false
      }
    },
    async updateTask_V2 () {
      try {
        const hours = new Date()
        hours.setHours(hours.getHours() - 9)

        this.isApproval = true
        const payload = {
          status: 'DONE',
          approvalTime: this.$options.filters.timestamp(hours),
          note: this.note
        }

        await API.work.updateTask(this.approvalNo, this.$store.state?.auth?.user?.userId, payload)
      } catch (error) {
        this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.isApproval = false
      }
    }
  },
  data () {
    return {
      orderType: '',
      orderList: [],
      reason: '',
      tabName: undefined,
      note: '',
      isApproval: true,
      isApprovalRole: false,
      taskNo: null,
      approvers: [],
      agreementUserList: [],
      tabs: [],
      data: {},
      memoList: [],
      clientApprovalDetailRsp: {},
      approvalProcessModal: {
        view: false,
        title: null,
        width: ''
      },
      infoTitle: '',
      infoEndDate: '',
      infoDesc: '',
      approveState: [
        { position: '기안', name: '박종민', state: '승인', date: '06/18 13:01' },
        { position: '팀장', name: '현윤섭', state: '승인', date: '06/18 13:01' }
      ],
      fileUrl: null,
      dataExam: [], // 자원 테이블 데이터
      computeGridData: [],
      databaseGridData: [],
      storageGridData: [],
      marketplaceGridData: [],
      l4GridData: [],
      l7GridData: [],
      securityGridData: [],
      publicTabs: [],
      ec2GridData: [],
      efsGridData: [],
      sgGridData: [],
      tgGridData: [],
      nlbGridData: []

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
