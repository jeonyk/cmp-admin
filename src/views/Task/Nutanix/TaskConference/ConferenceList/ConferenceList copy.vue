<!--
  * 파일명 : ConferenceList.vue
  * 파일 기능 : 사전협의에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 Update: 사전협의 목록보기 / 티켓보기 페이징 처리 완료
 -->

<template>
  <div class="task-conference-list">
    <article class="task-todo-list">
      <!-- Filter: 관계사 -->
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
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.relCorp"
                :key="item.groupIdx"
                :label="item.groupName"
                :value="item.groupIdx"
              />
            </el-select>
          </div>
        </div>

        <!-- Filter : 처리 상태  -->
        <div class="filtering-list">
          <span class="filter-name">{{ $v('처리 상태') }}</span>
          <div class="filter-options">
            <el-select
              v-model="selectedFilter.workState"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.workState"
                :key="item.groupIdx"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <!-- Filter : 분류  -->
        <div class="filtering-list">
          <span class="filter-name">{{ $v('분류') }}</span>
          <div class="filter-options">
            <el-select
              v-model="selectedFilter.isExpress"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.type"
                :key="item.groupIdx"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="filter-form">
          <span class="filter-name">{{ $v('완료희망일') }}</span>

          <div class="filter-date">
            <el-date-picker
              v-model="startDate"
              type="date"
              :clearable="false"
              @change="changeStartDate"
              :picker-options="createDateOptStart"
              :placeholder="$t('task.PAY.draft')"
            />
            <span class="date-line"> ~ </span>
            <el-date-picker
              v-model="endDate"
              type="date"
              :clearable="false"
              @change="changeEndDate"
              :picker-options="createDateOptEnd"
              :placeholder="$t('task.PAY.draft')"
            />
          </div>
        </div>
      </filtering-component>
    </article>
    <!-- /. 필터링 -->

    <section
      class="conference-list-contents"
      v-loading="loading.task"
    >
      <task-view-type-component @changeView="changeListType" />

      <template v-if="viewList === 'ticket'">
        <new-common-ticket-list
          is-conf
          :data="taskData"
          :process="false"
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
          :header-merge="headerMergeColumns"
          @selectedRow="param => selectItem(param.dataItem)"
          selectable
          paging-type="pagination"
          class="overflow-visible-grid"
          :column-data-map="columnDataMap"
          @total-count="cnt => totalResultCnt = cnt"
          @changingPage="gridChangePage"
          page-keeping
        >
          <template #processStatus="{row}">
            <div>
              {{ row.expectedDay }}
              <!-- is-wait -status -->
              <span
                :class="['-status', `${row.isDelayed ? 'is-delay' : 'is-wait'}`]"
              >{{ row.delayedTime }}</span>
            </div>
          </template>
          <template #isExpress="{row}">
            {{ row.isExpress ? $v('긴급') : $v('일반') }}
          </template>

          <template #state="props">
            <span :class="[`is-${status[props.row.state].color}`, '-status']">
              {{ props.row.taskStatus }}
            </span>
          </template>
        </cmp-grid>
      </template>
    </section>

    <!-- [Public] 프로젝트 생성 모달 -->
    <aws-project-modal
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
import NewCommonTicketList from '../../CommonTicketList/NewCommonTicketList.vue'
import TaskDetailCommon from '../../TaskDetailCommon'
import AWSProjectModal from '../../../AWS/AWSProjectModal'

import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import TaskFilters from '../../TaskFilters'

export default {
  name: 'ConferenceDetail',
  components: {
    'task-view-type-component': TaskViewTypeComponent,
    'aws-project-modal': AWSProjectModal,
    'new-common-ticket-list': NewCommonTicketList
  },
  mixins: [TaskFilters, TaskDetailCommon],
  watch: {
    rawData (data) {
      if (data.length) {
        this.taskData = [...data]
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
      moduleType: state => state.cloud.cloud

    }),
    selectedCloudType () {
      return this.$store.state.cloud.cloudType.toUpperCase()
    }
  },
  async created () {
    await this.getGroupManageTree()
    this.init()
  },
  methods: {
    getWorkState (roles) {
      // console.log('#getWorkState', roles)
      const role = roles?.find(x => x.roleIdx === this.userRole)

      if (role) return role.workState
      return 'rando '
    },
    /**
     * 기안일 [종료일] 변경시 시작일의 기본 세팅을 변경합니다
     * 시작일이 종료일보다 전으로 설정할 수 있어야 하고, 오늘 날짜보다 전날에 설정되어야합니다.
     */
    changeEndDate () {
      this.createDateOptStart.disabledDate = (time) => {
        const untilToday = this.setToday(time)
        const endDate = new Date(this.endDate)
        return time.getTime() > endDate.setDate(endDate.getDate()) || untilToday
      }
      this.filterHandler()
    },
    /**
     * 기안일 [시작일] 변경시, 종료일의 기본 세팅을 변경합니다
     * 종료일은 시작일보다 적고, 오늘날짜보다 전날에 설정되어야합니다.
     */
    changeStartDate () {
      this.createDateOptEnd.disabledDate = (time) => {
        const untilToday = this.setToday(time)
        const startDate = new Date(this.startDate)
        return time.getTime() < startDate.setDate(startDate.getDate()) || untilToday
      }

      this.filterHandler()
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
    selectItem (item) {
      // console.log(item)
      const { cloudType } = item
      if (cloudType === 'PRIVATE') return this.routeTo('conference-detail', { id: item.orderNo })
      // if (cloudType === 'PRIVATE') return this.routeTo('conference-aws-detail', { id: item.orderNo })
    },
    routeTo (to, param) {
      this.$router.push({ name: to, params: param })
    },
    async init () {
      this.loading.task = true
      const response = await API.work_v3.getWorkReviewList()
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

      this.taskData = [...this.rawData, ...this.rawData]
      this.loading.task = false
    }
  },
  data () {
    const now = Dayjs().format('YYYY-MM-DD 00:00:00')
    return {
      setToday (time) {
        const today = new Date().toDateString()
        return time.getTime() > new Date(today)
      },
      startDate: new Date(Dayjs(now).add(-7, 'day')),
      endDate: new Date(Dayjs(now).add(30, 'day')),
      createDateOptStart: {
        disabledDate (time) {
          const today = new Date(Dayjs(now).add(30, 'day'))
          return time.getTime() > new Date(today)
        }
      },
      createDateOptEnd: {
        disabledDate (time) {
          const today = new Date(Dayjs(now).add(-7, 'day'))
          return time.getTime() < today
        }
      },
      hasAllRoles: false,
      userRole: 1,
      orderType: {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제')
      },
      states: {
        REVIEW: this.$v('작업 필요'),
        CANCELED: this.$v('자원 취소'), // 모든 item 이 canceled
        APPROVAL1: this.$v('결재 대기'), // 사전협의 결재 요청상태
        APPROVAL1_REJECTED: this.$v('결재 반려') // 사전협의 결재 반려상태
      },
      totalResultCnt: 0,
      loading: {
        filter: false,
        task: false,
        requestTask: false
      },
      groupList: [],
      filteringOptions: {
        relCorp: [],
        workState: [
          { value: undefined, label: this.$v('전체') },
          { value: 'REVIEW', label: '작업 필요' },
          { value: 'APPROVAL1', label: '결재 대기' }

        ],
        type: [
          { value: undefined, label: this.$v('전체') },
          { value: false, label: this.$v('일반') },
          { value: true, label: this.$v('긴급') }
        ]
      },
      selectedFilter: {},
      rawData: [],
      taskData: [],
      tableColumns: [
        { binding: 'approvalTitle', keyPath: this.$v('주문 요청 제목'), filtable: false, width: 350, align: 'left' },
        { binding: 'orderCreateTime', keyPath: this.$v('주문일'), filtable: false, width: 100 },
        { binding: 'companyName', keyPath: this.$v('관계사'), filtable: false, width: 80 },
        { binding: 'groupName', keyPath: this.$v('조직'), filtable: false, width: 80 },
        { binding: 'projectName', keyPath: this.$v('프로젝트명'), filtable: false, width: 220 },
        { binding: 'orderer', keyPath: this.$v('주문자'), filtable: false },
        { binding: 'expectedDay', keyPath: this.$v('완료 희망일'), filtable: false, width: 110 },
        { binding: 'processStatus', keyPath: this.$v('처리 상태'), filtable: false, customHtml: true, width: 170 },
        { binding: 'isExpress', keyPath: this.$v('구분'), filtable: false, customHtml: true },
        { binding: 'amount', keyPath: this.$v('주문수량'), filtable: false },
        { binding: 'serverCount', keyPath: this.$v('서버'), filtable: false },
        { binding: 'networkCount', keyPath: this.$v('네트워크'), filtable: false },
        { binding: 'securityCount', keyPath: this.$v('보안'), filtable: false },
        { binding: 'file', keyPath: this.$v('첨부파일'), filtable: false }
      ],
      headerMergeColumns: {
        colSpan: [
          { startIdx: 0, endIdx: 2, header: this.$v('주문') },
          { startIdx: 10, endIdx: 12, header: '자원' }
        ],
        rowSpan: ['companyName', 'groupName', 'projectName', 'orderer', 'expectedDay', 'processStatus', 'isExpress', 'amount', 'file']
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
</script>
<style lang="scss" scoped>
.task-conference-list {
}

</style>
