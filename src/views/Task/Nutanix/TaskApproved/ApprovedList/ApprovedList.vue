<!--
  * 파일명 : ApprovedList.vue
  * 파일 기능 : 결재함에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 염창윤 외 4명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 업무 > 결재함 : 오타 수정
 -->

<template>
  <div
    class="task-approved-list"
    v-loading="isLoading"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <filtering-component @reset-data="resetData">
      <div class="filtering-list">
        <span class="filter-name">{{ $v('문서 제목') }} </span>
        <div class="text-search">
          <search-bar
            ref="searchBar"
            :user-reset-icon="false"
            :placeholder="$v('문서 제목을 검색해주세요.')"
            @input="titleChange"
          />
        </div>
      </div>

      <div class="filter-form">
        <span class="filter-name">{{ $v('분류') }}</span>
        <div class="filter-options">
          <el-select
            v-model="orderType"
            :placeholder="`${$t('task.PAY.DETAIL.box')} ${$t('task.PAY.filter')}`"
            :popper-append-to-body="false"
            @change="typeChange_V3"
          >
            <el-option
              v-for="item in orderTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
      <!-- /. 분류 -->

      <div class="filter-form">
        <span class="filter-name">{{ $v('필터') }}</span>
        <div class="filter-options">
          <el-select
            v-model="approvalType"
            :placeholder="`${$t('task.PAY.DETAIL.box')} ${$t('task.PAY.filter')}`"
            :popper-append-to-body="false"
            @change="typeChange_V3"
          >
            <el-option
              v-for="item in approvalTypeOptions"
              :key="item.key"
              :label="item.label+' ('+item.count+')'"
              :value="item.key"
            />
          </el-select>
        </div>
        <!-- /. 필터 -->
      </div>
    </filtering-component>
    <!-- /. 필터링 -->

    <section class="table-top-wrap">
      <total-count :total-count="total" />
    </section>

    <section class="table-area">
      <cmp-grid
        :init-custom-action="initGrid"
        :loading="isLoading"
        :item-source="filteredData"
        :columns="tableColumns"
        is-read-only
        @total-count="count => total = count"
        selectable
        @selectedRow="rowGroup => selectItem(rowGroup.dataItem)"
      />
    </section>

    <aws-project-approval-modal
      field="approved"
      :active="publicProjectModal.view"
      :data="publicProjectModal.item"
      @close="activePublicProject({}, false)"
      @call="init()"
    />
  </div>
</template>
<script>
import AWSProjectApprovalModal from '../../../AWS/AWSProjectApprovalModal'
import SearchBar from '@/components/SearchBar/SearchBar'
// import TaskDetailCommon from '../../TaskDetailCommon'
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  name: 'ApprovedList',
  // mixins: [TaskDetailCommon],
  components: {
    'aws-project-approval-modal': AWSProjectApprovalModal,
    'search-bar': SearchBar
  },
  computed: {
    ...mapState({ // 가끔 안먹는 경우가있음..
      user: state => state.auth.user,
      cloud: state => state.cloud.cloud.toUpperCase()
    })
  },
  async created () {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.user?.userId) resolve(this.init())
      }, 20)
    })
  },
  methods: {
    async init () {
      this.approvalType = 'myCount'
      this.approvalTypeOptions = await this.getApprovalCount(this.user)
      this.typeChange_V3()
    },

    /**
     * 로우 선택시 발생 이벤트
     */
    selectItem (rowData) {
      const { workTypeList } = rowData

      if (workTypeList === 'AWS_PROJECT') return this.activePublicProject(rowData, true)
      else return this.$router.push({ name: 'approved-detail', params: rowData })
    },
    /**
     * 필터 옵션의 count 설정
     *   const {
     *     myCount: 내가 올린 결재함 (requested)
     *     waitingCount: 결재 대기함 (waiting)
     *     pendingCount: 결재 진행함 (pending)
     *     acceptCount: 결재 완료함 (accepted)
     *     rejectCount: 결재 반려함 (rejected)
     *     afterActionCount: 사후 결재함 (afteraction)
     *   } = taskCount
     * @param {Object} this.user 로그인한 관리자 정보
     */
    async getApprovalCount ({ userId, userGroup } = this.user) {
      const params = {
        userId,
        groupIdxList: userGroup,
        csp: this.cloud
      }

      const count = await API.work_v3.getWorkApprovalCount(params)

      const options = {
        myCount: this.$t('task.PAY.myApprvBox'), // 내가 올린 결재함
        waitingCount: this.$t('task.PAY.waitApprvBox'), // 결재 대기함
        pendingCount: this.$t('task.PAY.processingApprvBox'), // 결재 진행함
        acceptCount: this.$t('task.PAY.doneApprvBox'), // 결재 완료함
        rejectCount: this.$t('task.PAY.rejectApprvBox'), // 결재 반려함
        afterActionCount: this.$t('task.PAY.rejectApprvBox') // 사후 결재함
      }

      // [사후결재함] 미사용시에는 null 로 들어옴 = 메뉴에서 삭제함
      const setOptions = []
      for (const key in count) {
        if (count[key] !== null) setOptions.push({ label: options[key], key, count: count[key] })
      }

      return setOptions
    },
    /**
     * 변경
     */
    async typeChange_V3 () {
      try {
        this.isLoading = true
        this.rawData = []
        const { userId, userGroup } = this.user
        const approvalType = this.approvalType

        // INIT, WAITING, PENDING, ACCEPT, REJECT
        const query = {
          myCount: { userId },
          waitingCount: { approvalUser: userId, approvalState: 'WAITING' },
          pendingCount: { approvalUser: userId, approvalState: 'PENDING', userId },
          acceptCount: { approvalUser: userId, approvalState: 'ACCEPT' },
          rejectCount: { approvalUser: userId, approvalState: 'REJECT', groupIdxList: userGroup }
        }[approvalType]

        const params = { csp: this.cloud, title: this.title, ...query }

        const response = await API.work_v3.getWorkApprovalList(params)
        this.rawData = await response

        this.filteredData = this.searchFunction_V3()
      } catch (error) {
        console.error('@@ ApprovedList > typeChange_V3', error)
      } finally {
        this.isLoading = false
      }
    },

    /**
     * 결재함 목록 필터링 및 데이터 가공
     * @param {Array} rawData
     * @return {Array}
     */
    searchFunction_V3 (rawData = this.rawData) {
      const result = this.orderType ? rawData.filter(item => (this.orderType === item.approvalType)) : rawData

      return result.map(({ approvalType, attachFiles, manageApprovalKind, createTime, approvalState, ...item }) => {
        const type = { GENERAL: this.$v('일반'), URGENT: this.$v('긴급') }[approvalType]
        const kind = { PLAN: this.$v('사전협의'), REPORT: this.$v('할 일'), AA_REPORT: this.$v('사후 결재함') }[manageApprovalKind]
        const createdTime = this.$options.filters.date(createTime, 'YYYY.MM.DD HH.mm.ss')
        const status = { PENDING: '진행', WAITING: '대기', ACCEPT: '완료 (승인)', REJECT: '완료 (반려)' }[approvalState] || approvalState

        // 진행,대기, 완료(승인), 완료(반려
        return {
          ...item,
          type, // 분류
          files: attachFiles.length + ' EA',
          kind, // 업무 단계
          createdTime, // 결재일
          status // 결재상태
        }
      })
    },
    /**
     * 문서 제목 input change event
     * @param {String} value
     */
    titleChange (value) {
      this.title = value
      this.typeChange_V3()
    },

    /**
     * 필터 변경이벤트
     */
    async typeChange (val) {
      try {
        console.log(val)
        this.isLoading = true
        let query = {}
        this.rawData = []
        const user = this.user
        const approvalUser = await user.userId

        if (val === 'REQUEST') {
          query = { userId: approvalUser }
        } else if (val === 'WAIT') {
          query = { taskStatus: val, approvalUser }
        } else if (val === 'PROCEED') {
          query = { taskStatus: val, userId: approvalUser, approvalUser }
        } else if (val === 'DONE' || val === 'REJECT') {
          query = { taskStatus: val, approvalUser, groupIdxList: user?.userGroup }
        }
        query.startDate = this.$options.filters.date(this.startDate, 'YYYY-MM-DD')
        query.endDate = this.$options.filters.date(this.endDate, 'YYYY-MM-DD')

        const response = await API.work_v3.getWorkApprovalList({ csp: this.cloud })
        console.log('뭐하고 사세요?', response)
        // const response = await API.work.getApprovalList(query)
        this.approvalTypeOptions = await this.getApprovalCount(user)

        this.rawData = response

        await this.searchFunction(response)
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoading = false
      }
    },
    searchFunction (list = this.rawData) {
      this.filteredData = []
      const findList = []
      for (let i = 0; i < list.length; i++) {
        if (this.title && this.title.indexOf(list[i].name) < 0) {
          continue
        }
        if (this.startDate && this.startDate.getTime() > list[i].createTime) {
          continue
        }
        if (list[i].createTime) list[i].createTimeTemp = this.$options.filters.date(list[i].createTime)
        findList.push(list[i])
      }

      this.filteredData = findList
    },
    resetData () {
      this.orderType = undefined
      this.approvalType = undefined
      this.$refs.searchBar.refresh()
      this.init()
    },

    initGrid (grid, data) {
      this.grid = grid
      this.gridData = data

      const { page } = this.$route.query
      if (!page) return

      this.$nextTick(() => {
        if (this.gridData) this.gridData.moveToPage(Number(page) - 1)
      })
    }
  },
  data () {
    return {
      filterOptions: [],
      filteredData: [],
      title: '',
      isLoading: true,
      approvalType: undefined, // "필터" 변경
      approvalTypeOptions: [
        // 내가 올린 결재함 (myCount)
        // 결재 대기함 (waitingCount)
        // 결재 진행함 (pendingCount)
        // 결재 완료함 (acceptCount)
        // 결재 반려함 (rejectCount)
        // 사후 결재함 (afterActionCount)
      ],
      orderType: undefined, // "분류" 변경
      orderTypeOptions: [
        { label: this.$v('일반'), value: 'GENERAL' },
        { label: this.$v('긴급'), value: 'URGENT' }
      ],
      teamLeaderOnly: true, // 업무 담당자 / 팀장 결재함 임시 설정
      searchText: '',
      total: 0,
      rawData: [],
      tableColumns: [
        { binding: 'type', header: this.$v('분류'), width: 100 },
        { binding: 'title', header: this.$v('제목') },
        { binding: 'files', header: this.$v('첨부'), width: 100 },
        { binding: 'approvalNo', header: this.$v('주문번호') },
        { binding: 'kind', header: this.$v('업무단계') },
        { binding: 'team', header: this.$v('조직'), width: 150 },
        { binding: 'createdTime', header: this.$v('결재일') },
        { binding: 'status', header: this.$v('결재상태'), width: 200 }
      ],
      columnDataMap: {
        proceedStatus: [
          { value: 'REQUEST', caption: this.$t('task.STATE.request') },
          { value: 'WAIT', caption: this.$t('task.STATE.wait') },
          { value: 'PROCEED', caption: this.$t('task.STATE.progress') },
          { value: 'DELAY', caption: this.$t('task.STATE.delay') },
          { value: 'DONE', caption: this.$t('task.STATE.complete') },
          { value: 'REJECT', caption: this.$t('task.STATE.reject') },
          { value: 'ERROR', caption: this.$t('task.STATE.error') },
          { value: 'confirm', caption: this.$t('task.STATE.confirm') },
          { value: 'undefined', caption: this.$t('task.STATE.unde') }
        ],
        taskStatus: [
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
      stateDesc: {
        REQUEST: { color: 'ing', ko: '요청', keyPath: 'task.STATE.request' },
        WAIT: { color: 'wait', ko: '대기', keyPath: 'task.STATE.wait' },
        PROCEED: { color: 'ing', ko: '처리중', keyPath: 'task.STATE.progress' },
        DELAY: { color: 'delay', ko: '지연', keyPath: 'task.STATE.delay' },
        DONE: { color: 'complete', ko: '완료', keyPath: 'task.STATE.complete' },
        REJECT: { color: 'reject', ko: '반려', keyPath: 'task.STATE.reject' },
        ERROR: { color: 'delay', ko: '오류', keyPath: 'task.STATE.error' },
        confirm: { color: 'confirm', ko: '확인', keyPath: 'task.STATE.confirm' },
        undefined: { color: '', ko: '미정', keyPath: 'task.STATE.unde' }
      },
      setToday (time) {
        const today = new Date().toDateString()
        return time.getTime() > new Date(today)
      },
      createDateOptStart: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() > new Date(today)
        }
      },
      createDateOptEnd: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() > new Date(today)
        }
      },

      // =========== PUBLIC =============

      publicProjectDetail: null,
      approvalStatus: true, // 결재 미사용 여부
      publicProjectModal: {},
      resourceProject: { // 프로젝트 결재 모달 데이터
        orderNo: '', // 주문 번호
        oldTaskNo: '', // 결재 번호
        projectName: 'project_1',
        companyInfo: '신세계 I&C > 데이터센터팀',
        region: '서울',
        vpc: '운영/개발',
        accessKey: '',
        secretAccessKey: ''
      },
      projectModalHandler: false, // 프로젝트 할 일 모달 Handler
      isApprovalRole: false,
      approverUserList: [],
      agreementUserList: [],
      taskInfo: {
        taskName: '',
        finishTime: '',
        reason: 'test',
        fileName: ''
      },
      approvalProcessModal: {
        view: false,
        title: null,
        width: ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .task-approved-list {
    .file-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .filter-form {
      .magnify-icon {
        display: inline-block;
        width: 18px;
        height: 17px;
        background-image: url('../../../../../assets/images/magnify_ico@3x.png');
        background-position: center;
        background-size: cover;
        background-repeat: no-repeat;
      }
    }
  }
</style>
