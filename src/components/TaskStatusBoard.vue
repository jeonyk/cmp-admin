<template>
  <div
    class="component task-status-board"
    v-loading="isLoading"
  >
    <!-- <pre>
    {{ taskData[0] }}
  </pre> -->
    <template>
      <resource-filter-component
        ref="filterComponent"
        @search="newFilter"
        :cloud-type="cloudType.toLowerCase()"
        only-active-project
        @reset="() => resetFilters()"
      >
        <div class="filtering-list">
          <span class="filter-name">{{ $v('분류') }}</span>
          <div class="filter-options">
            <el-select
              v-model="selectedOrderType"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
            >
              <!-- @change="filterHandler(), resetCurrPageNum()" -->
              <el-option
                v-for="item in [
                  { value: undefined, label: this.$v('전체') },
                  { value: '신규', label: this.$v('신규') },
                  { value: '변경', label: this.$v('변경') },
                  { value: '삭제', label: this.$v('삭제') },
                  { value: '긴급', label: this.$v('긴급') }
                ]"
                :key="item.groupIdx"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <!-- 완료 희망일 -->
        <div class="filter-form">
          <span class="filter-name">{{ $v('완료희망일') }}</span>
          <div class="filter-date">
            <el-date-picker
              v-model="selectedDate.start"
              type="date"
              :clearable="false"
            />
            <span class="date-line">~</span>
            <el-date-picker
              v-model="selectedDate.end"
              type="date"
              :clearable="false"
            />
          </div>
        </div>
      </resource-filter-component>
    </template>
    <div style="display:flex; align-items:center; margin-bottom:40px;">
      <h3>
        {{ $v('업무 프로세스') }}
      </h3>
      <el-input
        v-model="selectedFilter.title"
        style="width:200px; margin-left:25px;"
        :placeholder="$v('주문번호를 입력해주세요.')"
        @input="filterHandler()"
      />
      <i class="el-icon-search" />
    </div>
    <article v-loading="isLoading">
      <div
        class="board"
        :class="x.isExtended ? 'is-extended' : ''"
        :key="idx"
        v-for="(x, idx) in getItemsByPage"
        style="margin-bottom:20px;"
      >
        <div
          v-if="x.isExtendable"
          class="toggle-bar"
        >
          <span>
            <i
              class="mdi"
              :class="x.isExtended ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              @click="toggle(x)"
            />
          </span>
        </div>
        <task-card
          :order-no="x.orderNo"
          :title="x.project.name"
          :type="x.orderTypeKor"
          :is-urgent="x.orderType === 'URGENT'"
          content-label="주문일 / 완료희망일"
          :company-name="x.company.name"
          :group-name="x.group.name"
          :created-time="x.orderCreatedTime"
          :expected-time="x.expectedDate"
          :is-done="x.isDone"
        />

        <div class="task">
          <section class="background-effect">
            <template v-if="x.orderType !== 'URGENT'">
              <div
                v-for="(step, idx) in backgroundSteps"
                :key="step.label+idx"
                :class="step.class"
              >
                {{ step.label }}
              </div>
            </template>
            <template v-else>
              <div
                v-for="step in urgentBackgroundSteps"
                :key="step.label"
                :class="step.class"
              >
                {{ step.label }}
              </div>
            </template>
          </section>
          <section
            class="task__section"
            :key="idx"
            v-for="(role, idx) in x.workInfoList"
            @click="selectItem(role, x.orderNo)"
            style="cursor:pointer;"
          >
            <div class="task__side">
              <!-- <section> -->
              <div style="position:relative;">
                <p>{{ role.roleName }}</p>
                <div
                  v-if="hasCanceledItems(role.canceledItemsAtReivew, role.canceledItemsAtTodo)"
                  style="position:absolute; top:0px; right:-15px;"
                >
                  <el-tooltip
                    effect="light"
                    placement="top"
                    :disabled="!hasCanceledItems(role.canceledItemsAtReivew, role.canceledItemsAtTodo)"
                  >
                    <div
                      v-if="(role.canceledItemsAtReivew && role.canceledItemsAtReivew.length)"
                      slot="content"
                    >
                      <ul>
                        <li
                          v-if="role.canceledItemsAtReivew && role.canceledItemsAtReivew.length"
                          style="text-align:center; color:#CF494D;"
                        >
                          {{ $v('사전협의 주문취소') }}
                        </li>
                        <li
                          v-for="(service,idx) in role.canceledItemsAtReivew"
                          :key="idx"
                        >
                          {{ service.name }} ({{ service.date }})
                        </li>
                        <!-- 할일 취소 -->
                        <li
                          v-if="role.canceledItemsAtTodo && role.canceledItemsAtTodo.length"
                          style="text-align:center; color:#CF494D;"
                        >
                          {{ $v('할일 주문취소') }}
                        </li>
                        <li
                          v-for="(service,idx) in role.canceledItemsAtTodo"
                          :key="idx"
                        >
                          {{ service.name }} ({{ service.date }})
                        </li>
                      </ul>
                    </div>
                    <triangle-warning-icon />
                  </el-tooltip>
                </div>
              </div>
              <p style="color: #999999; fon-size:12px;">
                {{ role.workItems.length }}EA
              </p>
              <!-- </section> -->
            </div>
            <task-steps
              :is-canceled="role.isCanceled"
              :step-label="x.workState"
              :gauge="role.gauge"
              :data="role.stepList"
              :canceled-items-at-review="role.canceledItemsAtReivew"
              :canceled-items-at-todo="role.canceledItemsAtTodo"
              :is-ready="role.isReady"
              :role-name="role.roleName"
            />
          </section>
        </div>
      </div>

      <div
        v-if="taskData && taskData.length > 10"
        class="pagination-wrap"
      >
        <el-pagination
          :current-page="currentPage"
          @current-change="(num) => {
            currentPage = num
          }"
          :total="taskData.length"

          layout="prev, pager, next"
        />
      </div>
    </article>
  </div>
</template>

<script>
import TaskCard from '@/components/Card/Card.vue'
import TaskSteps from '@/components/Steps/Steps.vue'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'
import { mapState } from 'vuex'
import TaskFilters from '@/views/Task/Nutanix/TaskFilters'
import { roleMixin } from '@/utils/work/role.js'
import TriangleWarningIcon from './Icons/TriangleWarningIcon.vue'

export default {
  mixins: [TaskFilters, roleMixin],
  components: {
    TaskSteps,
    TaskCard,
    TriangleWarningIcon
  },
  watch: {
    //  : {
    //   deep: true,
    //   async handler (newVal) {
    //     await this.getData(newVal.start, newVal.end)
    //     this.newFilter()
    //   }
    // }

  },
  async mounted () {
    await this.getGroupManageTree()
    this.getData(this.selectedDate.start, this.selectedDate.end)
  },
  computed: {
    ...mapState({
      cloudType: state => state.cloud.cloudType.toUpperCase(),
      csp: state => state.cloud.cloud.toUpperCase(),
      userPermRole: state => state.auth.user.userPermRoleList.map(x => x.roleUpper)
    }),
    filteringOptions () {
      return {
        relCorp: [
          { groupIdx: undefined, groupName: this.$v('전체') },
          ...this.groupList
        ],
        isUrgent: [
          { value: undefined, label: this.$v('전체') },
          { value: false, label: this.$v('일반') },
          { value: true, label: this.$v('긴급') }
        ]
      }
    },
    getItemsByPage () {
      const firstIndex = (this.currentPage - 1) * this.pageSize
      const lastIndex = firstIndex + this.pageSize
      return this.taskData.slice(firstIndex, lastIndex)
    }
  },
  methods: {
    async selectItem (role, orderNo) {
      const state = role.workState
      let pageName
      const reviewStates = ['REVIEW', 'CANCELED_AT_REVIEW', 'APPROVAL1']
      const todoStates = ['TODO', 'CANCELED_AT_TODO', 'APPROVAL2', 'TODO_FINISHED']
      const doneStates = ['DONE']
      if (reviewStates.includes(state)) {
        pageName = 'REVIEW'
      }
      if (todoStates.includes(state)) {
        pageName = 'TODO'
      }
      if (doneStates.includes(state)) {
        pageName = 'DONE'
      }
      console.log('#pageName', pageName)

      const params = {
        REVIEW: { // 사전협의 상세 이동
          PRIVATE: { name: 'conference-detail', params: { id: orderNo } },
          PUBLIC: { name: 'conference-aws-detail', params: { id: orderNo } }
        },
        TODO: { // 할일 상세 이동
          PRIVATE: { name: 'todo-detail', params: { id: orderNo } },
          PUBLIC: { name: 'todo-aws-detail', params: { id: orderNo } }
        },
        DONE: { // 한일 상세 이동
          PRIVATE: { name: 'done-detail', params: { id: orderNo } },
          PUBLIC: { name: 'done-aws-detail', params: { id: orderNo } }
        }
      }[pageName][this.cloudType]

      return this.$router.push(params)
    },
    isGaugeBigger (workState, targetGauge) {
      return this.gaugeValue[workState] > targetGauge
    },
    isGaugeEqual (workState, targetGauge) {
      return this.gaugeValue[workState] === targetGauge
    },
    checkGauge () {},
    setTooltipMessage (stepLevel, targetGauge, role, connectionList, roles) {
      // workId 기반 의존 자원을 찾아라

      const { workState, workItems, createdTime } = role
      const stepKor = {
        1: this.$v('사전협의'),
        2: this.$v('사전협의 결재'),
        3: this.$v('할일'),
        4: this.$v('할일 결재'),
        5: this.$v('수행 완료')
      }[stepLevel]
      const stepCreatedTime = dayjs(createdTime).format('YYYY-MM-DD')
      const gaugeValue = this.gaugeValue[workState]
      const canGo = this.checkInsufficientService(workItems, connectionList)
      const message = `${stepKor} ${stepCreatedTime}`

      if (gaugeValue !== targetGauge) {
        return ''
      }
      if (stepLevel === 1 && !canGo) {
        const { workId } = role
        const foundWorkId = this.findWorkIdInConnectionPairList(workId, connectionList)
        const foundRole = roles.find(x => x.workId === foundWorkId)
        console.log('#foundRole', foundRole)
        const roleName = foundRole?.roleName || ''
        return this.$v(`${roleName} 연관 자원 작업이 먼저 완료되어야 진행 가능합니다.`)
      }
      return this.$v(message)
    },
    checkInsufficientService (services, connectionList) {
      if (connectionList.lenght === 0) return true
      const hasService = services.some(service => service.workItemState === 'INSUFFICIENT')
      // workItemState === INSUFFICIENT 를 확인
      // 1. 서비스 중 하나라도 있으면 true 존재할 경우 checkInsufficientService() 의 결과값은 false
      // 1. 서비스 중 다 없으면 false 존재할 경우 checkInsufficientService() 의 결과값은 true
      return !hasService
    },
    findWorkIdInConnectionPairList (workId, connectionPairList) {
      for (let i = 0; i < connectionPairList.length; i++) {
        const pair = connectionPairList[i]
        // if (pair.left === workId || pair.right === workId) {
        if (pair.right === workId) {
          return pair.left
        }
      }
      return false
    },
    // checkConnectionPair (role, connectionList, roles) {
    //   if (connectionList.length === 0) return
    //   const workId = role.workId
    //   if (this.findWorkIdInConnectionPairList(workId, connectionList)) {
    //     const dependingWorkId = this.findWorkIdInConnectionPairList(workId, connectionList)
    //     const found = roles.find(x => x.workId === dependingWorkId)
    //     if (found && found.workState !== 'DONE') {
    //       return false
    //     }
    //   } else {
    //     return true
    //   }
    // },
    toggle (x) {
      x.isExtended = !x.isExtended
    },
    hasCanceledItems (fromReviews, fromTodos) { // 취소된 자원이 있으면 disabled
      if (fromReviews && fromReviews.length) return true
      if (fromTodos && fromTodos.length) return true
      return false
    },
    checkIfDoneState (roles) {
      return roles.every(role => role.workState === 'DONE')
    },
    getCanceledItems (roleItems, states) {
      const result = []
      roleItems.forEach(item => {
        if (states.includes(item.workItemState)) {
          const { data, service, updatedTime } = item
          const resourceName = {
            COMPUTE: data.computeName, // NX
            STORAGE: data.storageName, // NX
            DATABASE: data.databaseName, // NX
            NETWORK_L4: data.vrserverName, // NX *** L4 사용자 입력 자원명 속성 확인 필요
            NETWORK_L7: data.csVrserverName, // NX *** L4 사용자 입력 자원명 속성 확인 필요
            SECURITY: data.securityGroupName,
            EC2: data.instanceName, // AWS
            EFS: data.fileSystemName, // AWS
            TARGET_GROUP: data.targetGroupName, // AWS
            NLB_L4: data.elbName, // AWS
            SG: data.groupName, // AWS

            [service]: service
          }[service] ?? service
          result.push({
            name: resourceName,
            date: dayjs(updatedTime).format('YYYY-MM-DD')
          })
        }
      })

      return result
    },
    findCanceledStep (roleItems, roleState) {
      // 1. 사전협의 할일 둘 중 최소된 상태의 step 단계를 찾아 게이지를 채웁니다(할일 취소가 존재할 경우 할일에 맞춰서 게이지 상승)
      const conditions = {
        CANCELED_AT_TODO: ['CANCELED_AT_TODO', 'CANCELLING'],
        CANCELED_AT_REVIEW: ['CANCELED_AT_REVIEW', 'CANCELLING'],
        REVIEW: ['CANCELED_AT_REVIEW', 'CANCELLING'],
        TODO: ['CANCELED_AT_TODO', 'CANCELLING']
      }[roleState]

      const text = {
        CANCELED_AT_TODO: 'TODO',
        CANCELED_AT_REVIEW: 'REVIEW',
        REVIEW: 'REVIEW',
        TODO: 'TODO'
      }[roleState]

      const hasCancelItem = roleItems.some(item => conditions.includes(item.workItem))
      if (hasCancelItem) return text

      // const hasTodoStep = roleItems.some(item => ['CANCELED_AT_TODO', 'CANCELLING'].includes(item.workItem))
      // const hasReviewStep = roleItems.some(item => ['CANCELED_AT_REVIEW', 'CANCELLING'].includes(item.workItem))
      // if (hasTodoStep) return 'TODO'
      // if (hasReviewStep) return 'REVIEW'
    },
    async getData (start, end) {
      this.isLoading = true
      try {
        const response = await API.work_v3.workStautsBoardList({
          csp: this.csp,
          to: dayjs().add(24, 'month').format('YYYY-MM-DD'),
          from: dayjs().subtract(24, 'month').format('YYYY-MM-DD'),
          roleIdxs: this.userPermRole
        })
        let data = response.filter(this.filterByDate).map(x => {
          return {
            ...x,
            companyIdx: x.company.idx,
            groupIdx: x.group.idx,
            projectIdx: x.project.idx,
            orderTypeKor: this.orderType[x.orderType],
            isDone: this.checkIfDoneState(x.workInfoList),
            ordererCompany: {
              idx: x.company.idx
            },
            isUrgent: x.orderType === 'URGENT',
            orderCreatedTime: dayjs(x.orderCreatedTime).format('YYYY-MM-DD'),
            workInfoList: x.workInfoList.sort((a, b) => a.roleIdx - b.roleIdx)
              .map((role, idx) => {
                // const roleCreatedTime = dayjs(role.createdTime).format('YYYY-MM-DD')
                const canceledItems = {}
                role.workItems.forEach(workItem => {
                  workItem.data = JSON.parse(workItem.itemData) // 원본 데이터 확인용
                })

                const { connectionPairList } = x
                const { workState, workItems } = role

                let stepList = [
                  {
                    workState: workState,
                    isReady: this.checkInsufficientService(workItems, connectionPairList),
                    isDone: false,
                    label: 'preview',
                    step: 1,
                    isPending: this.isGaugeEqual(workState, 0),
                    isColored: !!this.checkInsufficientService(workItems, connectionPairList), // 연관 자원 확인
                    tooltip: this.setTooltipMessage(1, 0, role, connectionPairList, x.workInfoList)
                  },
                  {
                    isDone: false,
                    label: 'preview-approval',
                    step: 2,
                    isPending: this.isGaugeEqual(workState, 25),
                    isColored: this.isGaugeBigger(workState, 0),
                    tooltip: this.setTooltipMessage(2, 25, role, connectionPairList)
                  },
                  {
                    isDone: false,
                    label: 'todo',
                    step: 3,
                    isPending: this.isGaugeEqual(workState, 50),
                    isColored: this.isGaugeBigger(workState, 25),
                    tooltip: this.setTooltipMessage(3, 50, role, connectionPairList)
                  },
                  {
                    isDone: false,
                    label: 'todo-approval',
                    step: 4,
                    isPending: this.isGaugeEqual(workState, 75),
                    isColored: this.isGaugeBigger(workState, 50),
                    tooltip: this.setTooltipMessage(4, 75, role, connectionPairList)
                  },
                  {
                    isDone: false,
                    label: 'todo-approval',
                    step: 5,
                    isPending: false,
                    isColored: this.isGaugeBigger(workState, 75),
                    tooltip: this.setTooltipMessage(5, 100, role, connectionPairList)
                  }
                ]

                if (x.orderType === 'URGENT') {
                  stepList = stepList.filter(step => step.step !== 2 && step.step !== 4)
                }
                const isRoleCanceled = ['CANCELED_AT_REVIEW', 'CANCELED_AT_TODO'].includes(workState)
                let isReviewAllCancled = false // 역할 상태가 REVIEW 임에도 모든 자원이 CANCELLING 으로 취소 상태로 여겨짐..
                let isTodoAllCanceled = false
                if (workState === 'REVIEW' && workItems.length === this.getCanceledItems(workItems, ['CANCELED_AT_REVIEW', 'CANCELLING']).length) {
                  isReviewAllCancled = true
                }

                if (workState === 'TODO' && workItems.length === this.getCanceledItems(workItems, ['CANCELED_AT_TODO', 'CANCELLING']).length) {
                  isTodoAllCanceled = true
                }
                return {
                  ...role,
                  gauge: (isRoleCanceled || isReviewAllCancled || isTodoAllCanceled) ? this.gaugeValue[this.findCanceledStep(workItems, workState)] : this.gaugeValue[workState],
                  isCanceled: isRoleCanceled || isReviewAllCancled || isTodoAllCanceled,
                  canceledItemsAtReivew: ['CANCELED_AT_REVIEW', 'REVIEW'].includes(workState) ? this.getCanceledItems(workItems, ['CANCELED_AT_REVIEW', 'CANCELLING']) : [],
                  canceledItemsAtTodo: ['CANCELED_AT_TODO', 'TODO'].includes(workState) ? this.getCanceledItems(workItems, ['CANCELED_AT_TODO', 'CANCELLING']) : [],
                  stepInfo: canceledItems,
                  stepList: stepList,
                  roleName: role.roleName,
                  isReady: this.checkInsufficientService(workItems, connectionPairList),
                  workItems: workItems
                    .filter(x => this.checkServiceAuth(x.service, this.READ_PERMISSION))
                }
              })
              .filter(x => {
                return x.workItems.length
              })
          }
        })
          .sort((x, y) => new Date(y.orderCreatedTime) - new Date(x.orderCreatedTime))
        data = data.map(x => {
          return {
            ...x,
            isExtended: false,
            isExtendable: x?.workInfoList.length > 3
          }
        })

        data = data.filter(x => x.workInfoList.length)

        this.rawData = data
        this.taskData = data
      } catch (err) {
        console.error(err)
      } finally {
        this.isLoading = false
      }
    }
  },
  data () {
    const currTime = dayjs()
    return {
      pageSize: 10,
      currentPage: 1,
      orderType: {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제'),
        URGENT: this.$v('긴급')
      },
      loading: {
        filter: false
      },
      groupList: [],
      rawData: [],
      selectedOrderType: '',
      selectedFilter: {
        title: ''
      },
      selectedDate: {
        start: currTime.subtract(6, 'month').format('YYYY-MM-DD'),
        end: currTime.add(6, 'month').format('YYYY-MM-DD')
      },
      // '사전협의', '결재', '할일', '결재', '한일'
      backgroundSteps: [
        {
          label: '사전협의',
          class: 'review'
        },
        {
          label: '결재',
          class: 'review-approval'
        },
        {
          label: '할일',
          class: 'todo'
        },
        {
          label: '결재',
          class: 'todo-approval'
        },
        {
          label: '한일',
          class: 'done'
        }
      ],
      // ['사전협의', '할일', '한일']
      urgentBackgroundSteps: [
        {
          label: '사전협의',
          class: 'review'
        },
        {
          label: '할일',
          class: 'todo'
        },
        {
          label: '한일',
          class: 'done'
        }
      ],
      gaugeValue: {
        INSUFFICIENT: 0,
        REVIEW: 0,
        // CANCELED: 0,
        CANCELED_AT_REVIEW: 0,
        CANCELED_AT_TODO: 50,
        APPROVAL1: 25, // 결재중
        APPROVAL1_REJECTED: 25, // 결재 반려
        TODO: 50,
        TODO_FINISHED: 50,
        APPROVAL2: 75,
        APPROVAL2_REJECTED: 75,
        DONE: 100
      },
      roleState: {
        INSUFFICIENT: 0,
        REVIEW: 0,
        CANCELED: 0,
        APPROVAL1: 25, // 결재중
        APPROVAL1_REJECTED: 25, // 결재 반려
        TODO: 50,
        TODO_FINISHED: 50,
        APPROVAL2: 75,
        APPROVAL2_REJECTED: 75,
        DONE: 100
      },
      flag: false,
      taskData: [],
      isLoading: false
    }
  }
}
</script>

<style lang="scss" scoped>
.component {
  &::v-deep {
    .el-input__inner {
      border: none;
      border-bottom:1px solid #3D435E;
    }
  }
}

.board {
  position: relative;
  width: 1600px;
  max-height: 292px;
  min-height:292px;
  padding: 40px;
  box-sizing: border-box;
  background-color: #070a20;
  display: flex;
  gap: 110px;
  overflow:hidden;
  border-radius: 6px;
  transition: all 2s;

  &.is-extended {
    max-height:none;
    height:auto;
    transition: all 1s ease;
  }

  .toggle-bar {
    position:absolute;
    left:0px;
    bottom:0px;
    display:flex;
    justify-content: center;
    align-items: center;
    width:100%;
    height:30px;
    background :#252946;
    z-index:1;
    span {
      cursor:pointer;
      color:#9596A0;
      &:hover {
        color:#fff;
      }
    }
  }
}

h5 {
  width: 80px;
}

.task {
  width:100%;
  height: 100%;
  display:flex;
  flex-direction: column;
  justify-content: center;
  gap:35px;
  position: relative;
  padding-bottom:60px;
  min-height:150px;

  &__section { // 역할 기준 하나
    position:inherit;
    height:30px;
    top:40px;
    width:85%;
    left:50%;
    transform:translateX(-50%);
  }

  &__side {

    text-align: right;
    width:auto;
    width:60px;
    position:absolute;
    left:-175px;
  }
}

.background-effect {
  position:absolute;
  top:0px;
  left:0px;
  display:flex;
  width:100%;
  justify-content: space-between;
  height:100%;
> div {
    padding-top:10px;
    box-sizing: border-box;
    text-align: center;
    width: 220px;
    min-height:212px;
    height:100%;
    background: #2A2D44;
    opacity: 0.5;
    border-radius: 15px;
  }

  div:first-child {
    text-indent: -10px;
  }

  div:last-child {
    text-indent:  10px;
  }

  div:nth-child(2n){
    background:transparent;
  }

  .review { text-indent: -150px; }
  .review-approval { text-indent: -15px; }

  .todo { text-indent: -5px; }
  .todo-approval {}
  .done {}
}

// .connected-line {
//   width:97.2%;
//   height:1px;
//   position:absolute;
//   top:-20px;
//   left:13px;
//   border-top: 2px dashed #3E57C9;
//   .left {
//     height:15px;
//     position:absolute;
//     border-left:2px dashed #3E57C9;
//   }

//   .right {
//     height:15px;
//     position:absolute;
//     top:-15px;
//     right:0px;
//     border-left:2px dashed #3E57C9;
//   }
//   &.is-canceled {
//     // background:#FA5657;
//     border-top: 2px dashed #FA5657;
//     .left {
//       border-left:2px dashed #FA5657;
//     }

//     .right {
//       border-left:2px dashed #FA5657;
//     }
//   }

// }

// .vertical-line {
//   top:-35px;
//   left: 14px;
//   position:absolute;
//   width:50px;
//   height:50px;
//   border-left:2px dashed #3E57C9;
//   &.is-canceled {
//     border-left:2px dashed #FA5657;
//   }
// }
</style>
