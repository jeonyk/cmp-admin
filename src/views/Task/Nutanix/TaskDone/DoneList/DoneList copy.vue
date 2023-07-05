<!--
  * 파일명 : DoneList.vue
  * 파일 기능 : 한일에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 Add: fix: 업무 > 한일 태 상태 날짜 표기 오류 동일하게 수정
 -->

<template>
  <div class="done-list">
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

    <section
      class="done-list-contents"
      v-loading="loading.detail"
    >
      <task-view-type-component @changeView="changeListType" />

      <template v-if="viewList === 'ticket'">
        <common-ticket-list
          :data="taskData"
          :process="false"
          @select-item="selectItem"
        />
      </template>
      <!-- /. 업무로 보기 -->

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
          <template #orderType="props">
            <span v-if="props.row.orderType==='NEW'">{{ $t('common.TERMS.new') }}</span>
            <span v-else-if="props.row.orderType==='CHANGE'">{{ $t('common.BTN.change') }}</span>
            <span v-else-if="props.row.orderType==='DELETE'">{{ $t('common.BTN.delete') }}</span>
            ({{ props.row.sourceLength }} EA)
          </template>

          <template #state="props">
            <span :class="[`is-confirm`, '-status']">
              {{ props.row.taskStatus }}
            </span>
          </template>
        </cmp-grid>
      </template>
    <!-- /. 티켓으로 보기 -->
    </section>

    <aws-project-todo-modal
      field="done"
      :active="publicProjectModal.view"
      :data="publicProjectModal.item"
      @close="activePublicProject({}, false)"
      @call="init()"
    />
  </div>
</template>
<script>
import TaskViewTypeComponent from '@/components/TaskViewTypeComponent/TaskViewTypeComponent'
import CommonTicketList from '../../CommonTicketList/CommonTicketList'
import TaskDetailCommon from '../../TaskDetailCommon'
import API from '@sd-fe/cmp-core'
import TaskFilters from '../../TaskFilters'
import AWSProjectTodoModal from '../../../AWS/AWSProjectTodoModal'

export default {
  name: 'DoneList',
  components: {
    'task-view-type-component': TaskViewTypeComponent,
    'common-ticket-list': CommonTicketList,
    'aws-project-todo-modal': AWSProjectTodoModal
  },
  mixins: [TaskFilters, TaskDetailCommon],
  computed: {
    selectedCloudType () {
      return this.$store.state.cloud.cloudType.toUpperCase()
    }
  },
  watch: {
    rawData (data) {
      if (data.length) {
        this.taskData = [...data]
        this.getAllProcessType()
      }
    }
  },
  created () {
    this.userInfo = this.$store.state?.auth?.user
    this.init()
    this.getGroupManageTree()
  },
  methods: {
    filterBySpecs (list) {
      return list.filter((x) => {
        const type = x.taskTodoRoleList?.[0].taskDataList?.[0].workType
        const isCommon = type === 'COMMON_PROJECT' // 필터 공통프로젝트
        const isCloudType = x.cloudType === this.selectedCloudType // 필터 클라우드
        return !isCommon && isCloudType
      })
    },
    setTicketType (resp = {}) {
      if (!resp) return ''
      const data = resp?.taskTodoRoleList?.[0]
      if (data && data.taskDataList?.[0]) {
        const result = data.taskDataList?.[0].workType
        return result
      }
    },
    /**
     * 티켓 또는 로우 선택시 발생 이벤트
     */
    selectItem (rowData) {
      const { workType } = rowData
      // AWS
      if (workType === 'AWS_PROJECT') return this.activePublicProject(rowData, true)
      // if (workType === 'EC2' || workType === 'EFS') return this.routeTo('done-aws-detail', rowData)
      if (['EC2', 'EFS', 'SG', 'TARGET_GROUP', 'NLB_L4'].includes(workType)) return this.routeTo('done-aws-detail', rowData)
      rowData.field = rowData.progressStep

      // NTX
      this.routeTo('done-detail', rowData)
    },
    routeTo (to, param) {
      this.$router.push({ name: to, params: param })
    },
    async init () {
      this.loading.detail = true
      if (!this.userInfo) return
      const roleUpperList = this.userInfo?.userPermUpperRoleList?.map(item => item.roleUpper)?.join(',')
      let response = await API.work_v3.getWorkDoneList({ roleUpper: roleUpperList })
      // let response = await API.work.getTaskDoneList({ roleUpper: roleUpperList })
      if (response) {
        response = this.filterBySpecs(response)
        const ticketData = response.map(resp => {
          let taskStatus = this.$t('task.STATE.unde')
          if (resp.finishTime) {
            // 완료시 D+date 표시 필요 X
            // const today = Dayjs(new Date())
            // const date = Dayjs(new Date(resp.finishTime))
            // const interval = this.$options.filters.interval(today, date)
            // taskStatus = `D${interval < 0 ? '' : '+'}${interval} ${this.status[resp.odrProceedStatus].ko}`
            taskStatus = `${this.status[resp.odrProceedStatus].ko}`
          }

          const dateConverter = (date, format = 'YYYY.MM.DD HH:mm:ss') => this.$options.filters.date(date, format)
          return {
            id: resp.orderNo,
            title: resp.ownerCompanyName,
            company: resp.companyName,
            companyIdx: resp.companyIdx,
            part: resp.groupName,
            name: resp.userName,
            projectName: resp.projectName,
            applyDate: dateConverter(resp.approvalCreateTime),
            processDate: dateConverter(resp.finishTime) || '-',
            ownerCompanyIdx: resp.ownerCompanyIdx,
            sourceLength: resp.odrDataCount,
            state: resp.odrProceedStatus,
            taskStatus: taskStatus === '미정' ? '완료' : taskStatus,
            project: [{ label: resp.projectName }],
            orderType: resp.orderType,
            roleIdxes: resp.roleIdxes,
            workFlowIdx: resp.workFlowIdx,
            serviceDate: resp.serviceDate ? resp.serviceDate : undefined,
            type: this.setTicketType(resp),
            cloudType: resp.cloudType || 'PRIVATE',
            workType: resp.taskTodoRoleList?.[0]?.taskDataList?.[0].workType
          }
        })

        this.rawData = [...ticketData]
        this.loading.detail = false
      }
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      loading: {
        filter: false,
        detail: false
      },
      userInfo: undefined,
      grouptree: [],
      filteringOptions: {
        relCorp: [],
        department: [],
        proceedState: []
      },
      selectedFilter: {},
      rawData: [],
      taskData: [],
      rawOrderList: [],
      tableColumns: [
        { header: '주문번호', binding: 'id', width: 200, keyPath: 'common.TERMS.orderNumber' },
        { header: '관계사', binding: 'title', width: 230, keyPath: 'common.TERMS.rel' },
        { header: '조직', binding: 'part', width: 200, keyPath: 'common.TERMS.orgName' },
        { header: '프로젝트', binding: 'projectName', keyPath: 'common.TERMS.project' },
        { header: '요청자', binding: 'name', width: 150, keyPath: 'task.TODO.requester' },
        { header: '신청일자', binding: 'applyDate', width: 200, keyPath: 'common.TERMS.ad' },
        { header: '완료 희망일', binding: 'processDate', width: 200, keyPath: 'task.PRIOR.GRID.endDate' },
        { header: '자원', binding: 'orderType', width: 150, customHtml: true, keyPath: 'main.DASHBOARD.res' },
        { header: '상태', binding: 'state', width: 150, customHtml: true, keyPath: 'common.GRID.state' }
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
.done-list {
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
