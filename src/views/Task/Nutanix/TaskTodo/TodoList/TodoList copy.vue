<!--
  * 파일명 : TodoList.vue
  * 파일 기능 : 할일에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 이경환 외 4명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 add: 업무 proceedStatus ERROR 추가
 -->

<template>
  <div class="todo-list">
    <filtering-component
      @reset-data="resetData(), resetCurrPageNum()"
      v-loading="loading.filter"
    >
      <div class="filtering-list">
        <span class="filter-name">{{ $t('common.TERMS.ownerRel') }}</span>
        <div class="filter-options">
          <el-select
            v-model="selectedFilter.company"
            :placeholder="$t('common.BTN.select')"
            :popper-append-to-body="false"
            @change="getDepartment(), resetCurrPageNum()"
          >
            <el-option
              v-for="item in filteringOptions.relCorp"
              :key="item.value"
              :label="item.groupName"
              :value="item.groupIdx"
            />
          </el-select>
        </div>
      </div>

      <div class="filtering-list">
        <span class="filter-name">{{ $t('task.PRIOR.process') }}</span>
        <div class="filter-options">
          <el-select
            v-model="selectedFilter.process"
            :placeholder="$t('common.BTN.select')"
            :popper-append-to-body="false"
            @change="filterAction(selectedFilter), resetCurrPageNum()"
          >
            <el-option
              v-for="item in filteringOptions.proceedState"
              :key="item.value"
              :value="item.value"
              :label="item.label || item.value"
            />
          </el-select>
        </div>
      </div>
    </filtering-component>
    <!-- /. 필터 -->

    <section
      class="todo-list-contents"
      v-loading="loading.detail"
    >
      <task-view-type-component @changeView="changeListType" />

      <template v-if="viewList === 'ticket'">
        <new-common-ticket-list
          is-conf
          :data="taskData"
          :process="false"
          @select-item="selectItem"
        />
        <common-ticket-list
          v-if="false"
          :data="taskData"
          @select-item="selectItem"
        />
      </template>
      <!-- /. 티켓으로 보기 -->

      <template v-else>
        <total-count :total-count="totalResultCnt" />

        <cmp-grid
          :init-custom-action="initGrid"
          :item-source="taskData"
          :columns="tableColumns"
          selectable
          @selectedRow="rowGroup => selectItem(rowGroup.dataItem)"
          :column-data-map="columnDataMap"
          @total-count="cnt => totalResultCnt = cnt"
          @changingPage="gridChangePage"
          page-keeping
        >
          <template #applyDate="props">
            {{ props.row.applyDate | date('YYYY.MM.DD HH:mm:ss', true) }}
          </template>
          <template #processDate="props">
            {{ props.row.processDate }}<br>
            <span v-if="props.row.serviceDate">({{ $t('common.GRID.serviceStart') }} : {{ props.row.serviceDate | date }})</span>
          </template>
          <template #name="props">
            {{ props.row.company }} {{ props.row.part }} {{ props.row.name }}
          </template>

          <template #orderType="props">
            <span v-if="props.row.orderType==='NEW'">{{ $t('common.TERMS.new') }}</span>
            <span v-else-if="props.row.orderType==='CHANGE'">{{ $t('common.BTN.change') }}</span>
            <span v-else-if="props.row.orderType==='DELETE'">{{ $t('common.BTN.delete') }}</span>
            ({{ props.row.sourceLength }} EA)
          </template>

          <template #state="props">
            <span :class="[`is-${status[props.row.state].color}`, '-status']">
              {{ props.row.taskStatus }}
            </span>
          </template>
        </cmp-grid>
      </template>
    <!-- /. 목록으로 보기 -->
    </section>

    <aws-project-todo-modal
      field="todo"
      :active="publicProjectModal.view"
      :data="publicProjectModal.item"
      @close="activePublicProject({}, false)"
      @call="init()"
    />
  </div>
</template>
<script>
import { mapState } from 'vuex'
import TaskViewTypeComponent from '@/components/TaskViewTypeComponent/TaskViewTypeComponent'
import CommonTicketList from '../../CommonTicketList/CommonTicketList'
import NewCommonTicketList from '../../CommonTicketList/NewCommonTicketList.vue'
import TaskDetailCommon from '../../TaskDetailCommon'
import Dayjs from 'dayjs'
import TaskFilters from '../../TaskFilters'
import AWSProjectTodoModal from '../../../AWS/AWSProjectTodoModal'
import API from '@sd-fe/cmp-core'

export default {
  name: 'TodoList',
  components: {
    'task-view-type-component': TaskViewTypeComponent,
    'common-ticket-list': CommonTicketList,
    'aws-project-todo-modal': AWSProjectTodoModal,
    'new-common-ticket-list': NewCommonTicketList
  },
  mixins: [TaskFilters, TaskDetailCommon],
  computed: {
    ...mapState({
      user: state => state.auth.user,
      moduleType: state => state.cloud.cloud
    }),
    selectedCloudType () {
      return this.$store.state.cloud.cloudType.toUpperCase()
    }
  },
  watch: {
    rawData (data) {
      if (data.length) {
        this.taskData = [...data]
        // this.getAllProcessType()
      }
    }
  },
  created () {
    this.init_V3()
    // this.init()
    this.getGroupManageTree()
  },
  methods: {
    getWorkState (roles) {
      console.log('#getWorkState', roles)
      const role = roles?.find(x => x.roleIdx === this.userRole)

      if (role) return role.workState
      return 'rando '
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
     * 티켓 또는 로우 선택시 발생 이벤트
     */
    selectItem (rowData) {
      const { workType } = rowData
      if (workType === 'AWS_PROJECT') return this.activePublicProject(rowData, true)
      // if (workType === 'EC2' || workType === 'EFS') return this.routeTo({ name: 'todo-aws-detail', params: rowData })
      // if (workType) return this.$alert(workType)
      if (['EC2', 'EFS', 'SG', 'TARGET_GROUP', 'NLB_L4'].includes(workType)) return this.routeTo({ name: 'todo-aws-detail', params: rowData })
      rowData.field = rowData.progressStep
      this.routeTo({ name: 'todo-detail', params: rowData })
    },
    routeTo (to) {
      this.$router.push(to)
    },
    async init_V3 () {
      try {
        if (!this.user) return

        this.loading.detail = true
        // const roleUpperList = this.user?.userPermUpperRoleList?.map(item => item.roleUpper)?.join(',')
        // const response = await API.work_v3.getWorkTodoList({ roleUpper: roleUpperList })
        const response = await API.work_v3.getWorkTodoList()
        const convertDate = this.$options.filters.date

        this.rawData = response.map(x => {
          const today = Dayjs(new Date(x.orderCreateTime))
          const date = Dayjs(new Date(x.expectDate))
          const interval = this.$options.filters.interval(today, date)

          return {
            ...x,
            expectedDay: convertDate(x.expectDate, 'YYYY.MM.DD'),
            orderCreateTime: convertDate(x.orderCreateTime, 'YYYY.MM.DD'),
            isDelayed: interval < 0,
            delayedTime: `D${interval < 0 ? '' : '+'}${interval} ${interval < 0 ? '지연' : '처리중'}`,
            taskStatus: `D${interval < 0 ? '' : '+'}${interval}`,
            companyName: x.ordererCompany.name,
            groupName: x.ordererGroup.name,
            orderer: x.orderer.name,
            isExpress: false,
            orderType: this.orderType[x.orderType],
            workState: this.getWorkState(x.workRsps),
            amount: this.getTotalAmount(x.workRsps),
            serverCount: this.getRoleCount(x.workRsps, 1),
            networkCount: this.getRoleCount(x.workRsps, 2),

            securityCount: this.getRoleCount(x.workRsps, 3)
          }
        }).filter(x => {
          const role = this.hasAllRoles ? x : x.workRsps && x.workRsps.find(x => x.roleIdx === this.userRole)
          return role
        })

        this.rawData = response
        this.taskData = [...this.rawData, ...this.rawData]
        console.log(response)
      } catch (error) {
        console.error('@@ TodoList > init_V3', error)
      } finally {
        this.loading.detail = false
      }
    },

    async init () {
      if (!this.user) return
      this.loading.detail = true
      const roleUpperList = this.user?.userPermUpperRoleList?.map(item => item.roleUpper)?.join(',')
      const response = await API.work_v3.getWorkTodoList({ roleUpper: roleUpperList })
      // const response = await API.work.getTaskTodoList({ roleUpper: roleUpperList })

      console.log(response)
      if (response) {
        const rawData = response.map(resp => {
          let taskStatus = this.$t('task.STATE.unde') // 미정
          let state = 'WAIT'

          if (resp.finishTime) {
            const today = Dayjs(new Date())
            const date = Dayjs(new Date(resp.finishTime))
            const interval = this.$options.filters.interval(today, date)

            const taskDataStatus = resp.taskDataStatus
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
          } else {
            // 할일 > AWS 프로젝트 생성의 경우, 완료 희망일이 없음
            taskStatus = '-'
            state = undefined
          }

          const dateConverter = (date, format = 'YYYY.MM.DD HH:mm:ss') => {
            return this.$options.filters.date(date, format)
          }

          return {
            id: resp.orderNo,
            title: resp.ownerCompanyName, // + ` (${resp.ownerCompanyIdx})`, // 소유관계사 인덱스 확인용
            company: resp.companyName,
            companyIdx: resp.companyIdx,
            part: resp.groupName,
            name: resp.userName,
            userName: resp.userName,
            projectName: resp.projectName,
            applyDate: dateConverter(resp.approvalCreateTime),
            processDate: dateConverter(resp.finishTime) || '-',
            ownerCompanyIdx: resp.ownerCompanyIdx,
            sourceLength: resp.odrDataCount,
            progressStep: resp.taskTodoRoleList, // 업무 진행상태
            state,
            taskStatus,
            type: '자원',
            project: [{ label: resp.projectName }],
            orderType: resp.orderType,
            roleIdxes: resp.roleIdxes,
            workFlowIdx: resp.workFlowIdx,
            serviceDate: resp.serviceDate ? resp.serviceDate : undefined,
            cloudType: resp.cloudType,
            moduleType: resp.moduleType || 'PRIVATE',
            workType: resp.taskTodoRoleList?.[0]?.taskDataList?.[0]?.workType
          }
        })

        this.rawData = [...rawData]
        this.filterCloudType()
        this.loading.detail = false
      }
    },
    filterCloudType () {
      if (this.selectedCloudType === 'PUBLIC') {
        this.rawData = this.rawData.filter(data => data.cloudType === 'PUBLIC')
      } else {
        this.rawData = this.rawData.filter(data => data.cloudType !== 'PUBLIC')
      }

      // console.log('#rawData', this.rawData)
    }
  },
  data () {
    return {
      grid: null,
      totalResultCnt: 0,
      loading: {
        filter: false,
        detail: false
      },
      orderType: {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제')
      },
      grouptree: [],
      filteringOptions: {
        relCorp: [],
        department: [],
        proceedState: []
      },
      selectedFilter: {},
      rawData: [],
      taskData: [],
      tableColumns: [
        { header: '주문번호', binding: 'id', width: 200, keyPath: 'common.TERMS.orderNumber' },
        { header: '소유 관계사', binding: 'title', width: 200, keyPath: 'common.TERMS.ownerRel' },
        { header: '요청자', binding: 'userName', width: 250, customHtml: true, keyPath: 'task.TODO.requester' },
        { header: '프로젝트', binding: 'projectName', keyPath: 'common.TERMS.project' },
        { header: '신청일자', binding: 'applyDate', width: 200, customHtml: true, dataType: 'Date', keyPath: 'common.TERMS.ad' },
        { header: '완료 희망일', binding: 'processDate', width: 250, customHtml: true, dataType: 'Date', keyPath: 'task.PRIOR.GRID.endDate' },
        { header: '자원', binding: 'orderType', width: 100, customHtml: true, keyPath: 'main.DASHBOARD.res' },
        { header: '상태', binding: 'state', width: 100, customHtml: true, keyPath: 'common.GRID.state' }
      ],
      columnDataMap: {
        orderType: [
          { value: 'NEW', caption: this.$t('common.TERMS.new') },
          { value: 'CHANGE', caption: this.$t('common.TERMS.change') },
          { value: 'DELETE', caption: this.$t('common.TERMS.delete') }
        ],
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
}
</script>
<style lang="scss" scoped>
.todo-list {
  .-status {
    display: inline-block;
    min-width: 50px;
    padding: 0 $gap-s;
    height: 22px;
    font-size: 13px;
    line-height: 22px;
    border-radius: 11px;
  }
}
</style>
