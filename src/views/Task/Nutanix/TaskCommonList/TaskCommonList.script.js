
import { mapState } from 'vuex'
import TaskViewTypeComponent from '@/components/TaskViewTypeComponent/TaskViewTypeComponent'
import NewCommonTicketList from '../CommonTicketList/NewCommonTicketList.vue'
import TaskDetailCommon from '../TaskDetailCommon'
import AWSProjectModal from '../../AWS/AWSProjectModal'
import TaskCSPCommon from '../TaskCSPCommon.mixins'

import API, { CmpStatusTag, ResourceFilterComponent } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import TaskFilters from '../TaskFilters'
import { roleMixin } from '@/utils/work/role.js'

export default {
  name: 'TaskCommonList',
  components: {
    'task-view-type-component': TaskViewTypeComponent,
    'aws-project-modal': AWSProjectModal,
    'new-common-ticket-list': NewCommonTicketList,
    CmpStatusTag,
    ResourceFilterComponent
  },
  mixins: [TaskFilters, TaskDetailCommon, TaskCSPCommon, roleMixin],
  provide () {
    return {
      pageName: this.$route.name
    }
  },
  watch: {
    rawData (data) {
      if (data.length) {
        this.taskData = [...data.filter(this.filterByDate)]
        this.getAllProcessType()
      }
    },
    taskData (data) {
      this.$forceUpdate()
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      csp: state => state.cloud.cloud.toUpperCase(),
      cloudType: state => state.cloud.cloudType.toUpperCase(),
      userPermRole: state => state.auth.user.userPermRoleList.map(x => x.roleUpper)

    }),
    selectedCloudType () {
      return this.$store.state.cloud.cloudType.toUpperCase()
    },
    filteringOptions () {
      const setArray = new Set()
      this.rawData.forEach(x => setArray.add(x.workState))
      const result = [...setArray]
      return {
        relCorp: [
          { groupIdx: undefined, groupName: this.$v('전체') },
          ...this.groupList
        ],
        workState: [
          { value: undefined, label: this.$v('전체') },
          ...result?.map(x => {
            return {
              label: x,
              value: x
            }
          })
        ],
        orderTypeKor: [
          { value: undefined, label: this.$v('전체') },
          { value: '신규', label: this.$v('신규') },
          { value: '변경', label: this.$v('변경') },
          { value: '삭제', label: this.$v('삭제') },
          { value: '긴급', label: this.$v('긴급') }
        ]
      }
    },
    uniqueStates () {
      const setArray = new Set()
      this.rawData.forEach(x => setArray.add(x.workState))
      const result = [...setArray]
      return result?.map(x => {
        return {
          label: x,
          value: x
        }
      })
    }
  },
  async created () {
    await this.getGroupManageTree()
    this.init()
  },
  methods: {
    displayRoles (roles) {
      const result = []
      for (const role of roles) {
        result.push({
          roleName: role.roleName,
          serviceCount: role.workItemRsps.length
        })
      }
      return result
    },
    checkIfConnectedToServer (connection, roleIdx) {
      if (connection && connection.length) {
        // ['N230310080550027-1', 'N230310080550027-2', 'N230310080550027-3']
        // 2가 존재하면 서버 및 네트워크
        // 3이 존재하면 서버 및 보안
        const extractedNums = connection.map(str => Number(str.split('-')[1]))
        if (extractedNums.includes(roleIdx)) return true
      }
      return false
    },
    sortByRoleIdx (roles) {
      return roles?.sort((a, b) => a.roleIdx - b.roleIdx)
    },

    getWorkStateByRole (roles) {
      const isDonePage = this.$route.name === 'task-done'
      if (isDonePage) return this.$v('완료') // 한일 페이지 기준 서비스 상태 상관없이 완료 노출  *취소가 포함된 경우의 한일 완료 상태값 추가 예정
      //  역할(오름차순) 기준 사젼협의 상태(작업필요 및 결재대기) 먼저 노출
      const hasRequiredWorkInReview = roles.some(role => ['REVIEW', 'CANCELED_AT_REVIEW', 'APPROVAL1_REJECTED'].includes(role.workState))
      const hasPendingApprovalInReview = roles.some(role => ['APPROVAL1'].includes(role.workState))
      if (hasRequiredWorkInReview) return this.$v('작업 필요')
      if (hasPendingApprovalInReview) return this.$v('결재 대기')

      // 역할(오름차순) 기준 할일 상태(작업필요, 결재대기, 작업 중) 먼저 노출
      // "작업중"은 서비스 레밸 상태이지만 노출
      const hasRequiredWorkInTodo = roles.some(role => ['TODO', 'TODO_FINISHED', 'CANCELED_AT_TODO', 'APPROVAL2_REJECTED'].includes(role.workState))
      const hasPendingApprovalInTodo = roles.some(role => ['APPROVAL2'].includes(role.workState))
      const hasRunningWorkInTodo = roles.some(role => {
        role.workItemRsps.some(service => ['WORKING'].includes(service.workItemState))
      })

      if (hasRunningWorkInTodo) return this.$v('작업중')
      if (hasRequiredWorkInTodo) return this.$v('작업 필요')
      if (hasPendingApprovalInTodo) return this.$v('결재 대기')
      return this.$v('완료')
    },
    getRoleCount (roles, roleIdx) {
      const role = roles?.find(x => x.roleIdx === roleIdx)
      return role?.workItemRsps?.length || 0
    },
    getTotalAmount (roles) {
      let count = 0
      roles.forEach(x => {
        count += x.workItemRsps.length
      })
      return count
    },
    getState (roles) {
      const isProcessing = roles.some(r => r.workState === 'REVIEW')
      const REVIEW = this.states.REVIEW
      const APPROVAL1 = this.states.APPROVAL1
      if (isProcessing) return REVIEW
      else return APPROVAL1
    },
    /**
     * 티켓/목록 클릭시 동작
     * @param {Object} item 티켓 정보
     * @return $router.push 상세 페이지로 이동
     */
    selectItem ({ cloudType, ...item }) {
      const routeName = this.$route.name

      // 🌸🌸🌸🌸🌸 AWS 상세, alert 추가 필요
      const params = {
        'task-conference': { // 사전협의 상세 이동
          PRIVATE: { name: 'conference-detail', params: { id: item.orderNo } },
          PUBLIC: { name: 'conference-aws-detail', params: { id: item.orderNo } }
        },
        'task-todo': { // 할일 상세 이동
          PRIVATE: { name: 'todo-detail', params: { id: item.orderNo } },
          PUBLIC: { name: 'todo-aws-detail', params: { id: item.orderNo } }
        },
        'task-done': { // 한일 상세 이동
          PRIVATE: { name: 'done-detail', params: { id: item.orderNo } },
          PUBLIC: { name: 'done-aws-detail', params: { id: item.orderNo } }
        }
      }[routeName][cloudType]
      // console.log(params)

      return this.$router.push(params)
    },
    /**
     * [사전협의 / 할일 / 한일] 모두 목록이 동일하기 때문에,
     * 하나의 컴포넌트에서 다른 목록 호출
     * @param {String} name 각 현재 페이지의 router 이름
     */
    async getTaskListData (name) {
      try {
        const apiName = {
          'task-conference': 'getWorkReviewList', // 사전협의
          'task-todo': 'getWorkTodoList', // 할일
          'task-done': 'getWorkDoneList' // 한일
        }[name]

        const response = await API.work_v3[apiName](this.userPermRole)
        return response
      } catch (error) {
        console.error('@@ TaskCommonList.script > getTaskListData', error)
        return []
      }
    },
    filterByCloudType (x) {
      return x.cloudType === this.cloudType
    },
    filterByCsp (x) {
      return x.csp === this.csp
    },
    transform (x) {
      const convertDate = this.$options.filters.date
      const today = Dayjs()
      const date = Dayjs(new Date(x.expectDate))
      const interval = this.$options.filters.interval(today, date)

      return {
        ...x,
        companyIdx: x.ordererCompany.idx,
        groupIdx: x.ordererGroup.idx,
        projectIdx: x.projectIdx,
        expectedDay: convertDate(x.expectDate, 'YYYY.MM.DD'),
        orderCreateTime: convertDate(x.orderCreateTime, 'YYYY.MM.DD'),
        isDelayed: interval > 0,
        delayedTime: `D${interval < 0 ? '' : '+'}${interval} ${interval < 0 ? '대기' : '지연'}`,
        taskStatus: `D${interval < 0 ? '' : '+'}${interval}`,
        companyName: x.ordererCompany.name,
        groupName: x.ordererGroup.name,
        orderer: x.orderer.name,
        isUrgent: x.orderTypeKor === 'URGENT',
        orderTypeKor: this.orderType[x.orderType],
        workState: this.getWorkStateByRole(x.workRsps),
        amount: this.getTotalAmount(x.workRsps),
        workRsps: this.sortByRoleIdx(x.workRsps)
          .map(r => {
            return {
              ...r,
              isConnected: this.checkIfConnectedToServer(x.connection, r.roleIdx),
              workItemRsps: r.workItemRsps
                .filter(x => this.checkServiceAuth(x.service, this.READ_PERMISSION))
            }
          })
          .filter(x => {
            return x.workItemRsps.length
          })
      }
    },
    async init () {
      this.loading.task = true
      const name = this.$route.name

      const response = await this.getTaskListData(name)

      this.rawData = response
        .filter(this.filterByCloudType)
        .filter(this.filterByCsp)
        .map(this.transform)
        .filter(x => {
          return x.workRsps.length
        })

      this.loading.task = false
    }
  },
  data () {
    // const now = Dayjs().format('YYYY-MM-DD 00:00:00')
    const currTime = Dayjs()
    return {
      selectedOrderType: '',
      selectedDate: {
        start: currTime.subtract(6, 'month').format('YYYY-MM-DD'),
        end: currTime.add(6, 'month').format('YYYY-MM-DD')
      },
      roleList: [],
      roleIdxList: [],
      // setToday (time) {
      //   const today = new Date().toDateString()
      //   return time.getTime() > new Date(today)
      // },
      // startDate: new Date(Dayjs(now).add(-7, 'day')),
      // endDate: new Date(Dayjs(now).add(30, 'day')),
      // createDateOptStart: {
      //   disabledDate (time) {
      //     const today = new Date(Dayjs(now).add(30, 'day'))
      //     return time.getTime() > new Date(today)
      //   }
      // },
      // createDateOptEnd: {
      //   disabledDate (time) {
      //     const today = new Date(Dayjs(now).add(-7, 'day'))
      //     return time.getTime() < today
      //   }
      // },
      // userRole: 1,
      orderType: {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제'),
        URGENT: this.$v('긴급')
      },
      states: {
        REVIEW: this.$v('작업 필요'),
        CANCELED: this.$v('작업 필요'), // 모든 item 이 canceled
        APPROVAL1: this.$v('결재 대기'), // 사전협의 결재 요청상태
        APPROVAL1_REJECTED: this.$v('작업 필요'), // 사전협의 결재 반려상태
        TODO: this.$v('작업 필요'),
        TODO_FINISHED: this.$v('작업 필요'),
        APPROVAL2: this.$v('결재 대기'),
        APPROVAL2_REJECTED: 'APPROVAL2_REJECTED'

      },
      totalResultCnt: 0,
      loading: {
        filter: false,
        task: false,
        requestTask: false
      },
      groupList: [],
      selectedFilter: {},
      rawData: [],
      taskData: [],
      tableColumns: [
        { binding: 'orderTypeKor', header: this.$v('구분'), filtable: false, customHtml: true },
        { binding: 'approvalTitle', header: this.$v('주문 요청 제목'), filtable: false, width: 350, align: 'left', customHtml: true },
        { binding: 'orderer', header: this.$v('주문자'), filtable: false },
        { binding: 'orderCreateTime', header: this.$v('주문일'), filtable: false, width: 100 },
        { binding: 'companyName', header: this.$v('관계사'), filtable: false, width: 120 },
        { binding: 'groupName', header: this.$v('조직'), filtable: false, width: 140 },
        { binding: 'projectName', header: this.$v('프로젝트명'), filtable: false, width: 220 },
        // { binding: 'orderer', header: this.$v('주문자'), filtable: false },
        { binding: 'expectedDay', header: this.$v('완료 희망일'), filtable: false, width: 180, customHtml: true },
        { binding: 'workState', header: this.$v('처리 상태'), filtable: false, customHtml: true, width: 200 },
        { binding: 'amount', header: this.$v('주문수량'), filtable: false, customHtml: true }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 0, endIdx: 4, header: this.$v('주문') }
        ],
        rowSpan: ['orderTypeKor', 'companyName', 'groupName', 'projectName', 'expectedDay', 'workState', 'isExpress', 'amount', 'file']
      },
      columnDataMap: {
        state: [
          { value: 'REQUEST', caption: this.$t('task.STATE.request') },
          { value: 'WAIT', caption: this.$t('task.STATE.wait') },
          { value: 'PROCEED', caption: this.$t('task.STATE.progress') },
          { value: 'DELAY', caption: this.$t('task.STATE.delay') },
          { value: 'DONE', caption: this.$t('task.STATE.complete') },
          { value: 'REJECT', caption: this.$t('task.STATE.reject') },
          { value: 'ERROR', caption: this.$t('task.STATE.error') },
          { value: 'confirm', caption: this.$t('task.STATE.confirm') },
          { value: 'undefined', caption: this.$t('task.STATE.unde') }
        ]
      },
      state: [
        { value: 'REQUEST', caption: this.$t('task.STATE.request') },
        { value: 'WAIT', caption: this.$t('task.STATE.wait') },
        { value: 'PROCEED', caption: this.$t('task.STATE.progress') },
        { value: 'DELAY', caption: this.$t('task.STATE.delay') },
        { value: 'DONE', caption: this.$t('task.STATE.complete') },
        { value: 'REJECT', caption: this.$t('task.STATE.reject') },
        { value: 'ERROR', caption: this.$t('task.STATE.error') },
        { value: 'confirm', caption: this.$t('task.STATE.confirm') },
        { value: 'undefined', caption: this.$t('task.STATE.unde') }
      ]
    }
  }
}
