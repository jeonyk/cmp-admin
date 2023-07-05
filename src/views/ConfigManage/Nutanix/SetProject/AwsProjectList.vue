<template>
  <div class="container">
    <filtering-component @reset-data="reset">
      <div class="filtering-list">
        <span class="filter-name">{{ $v('관계사') }}</span>
        <div class="filter-options">
          <el-select
            :placeholder="$t('common.BTN.select')"
            v-model="selectedCompany"
            @change="onFilter"
          >
            <el-option
              v-for="company in UNIQUE_COMPANIES"
              :key="company"
              :label="company"
              :value="company"
            />
          </el-select>
        </div>
      </div>

      <div class="filtering-list">
        <span class="filter-name">{{ $v('조직') }}</span>
        <div class="filter-options">
          <el-select
            :placeholder="$t('common.BTN.select')"
            v-model="selectedOrganization"
            @change="onFilter"
          >
            <el-option
              v-for="company in UNIQUE_ORGANIZATIONS"
              :key="company"
              :label="company"
              :value="company"
            />
          </el-select>
        </div>
      </div>
    </filtering-component>
    <el-input
      class="search-input"
      :placeholder="$v('프로젝트명을 입력하세요.')"
      suffix-icon="el-icon-search"
      v-model="searchKeyword"
      @input="onFilter"
    />
    <total-count :total-count="taskData.length" />
    <cmp-grid
      :item-source="taskData"
      :columns="tableColumns"
      @selectedRow="selectProject"
      selectable
    >
      <template #type="{row}">
        {{ getType(row.type) }}
      </template>
      <template #status="{row}">
        <cmp-status-tag
          v-if="row.status === 'READY'"
          type="is-pending"
        >
          {{ $v('대기') }}
        </cmp-status-tag>

        <cmp-status-tag
          v-if="row.status === 'RUNNING'"
          type="is-loading"
        >
          <i
            class="el-icon-loading"
          />
          {{ $v('작업중') }}
        </cmp-status-tag>

        <el-tooltip
          effect="light"
          placement="top"
          :disabled="!row.failMessage"
        >
          <div
            v-if="row.failMessage"
            slot="content"
          >
            {{ row.failMessage }}
          </div>
          <cmp-status-tag
            v-if="row.status === 'FAIL'"
            type="is-fail"
          >
            {{ $v('실패') }}
          </cmp-status-tag>
        </el-tooltip>
      </template>
    </cmp-grid>

    <aws-project-modal
      :data="selectedProject"
      @close="close"
    />
  </div>
</template>

<script>
import API, { CmpStatusTag } from '@sd-fe/cmp-core'
import AwsProjectModal from '@/views/Task/AWS/AWSProjectModalTest.vue'
import dayjs from 'dayjs'

export default {
  components: {
    AwsProjectModal,
    CmpStatusTag
  },
  async created () {
    await this.getAwsProjects()
  },
  beforeRouteLeave (to, from, next) {
    clearTimeout(this.time)
    next()
  },
  computed: {
    UNIQUE_COMPANIES () {
      return [this.$v('전체'), ...new Set(this.clonedList.map(x => x.companyName))]
    },
    UNIQUE_ORGANIZATIONS () {
      let result = [...new Set(this.clonedList.map(x => x.groupName))]

      if (this.selectedCompany && this.selectedCompany !== this.$v('전체')) {
        result = result.filter(org => this.clonedList.some(x => x.groupName === org && x.companyName === this.selectedCompany))
      }

      return [this.$v('전체'), ...result]
    }
  },
  watch: {
    selectedProjectIdx: {
      async handler (projectIdx) {
        if (!projectIdx) return
        const project = await this.getAwsProject(projectIdx)
        this.activePublicProject(project, true)
      }
    },
    selectedCompany: {
      handler (newVal) {
        if (newVal) {
          this.selectedOrganization = this.$v('전체')
        }
      }
    }
  },
  methods: {
    getTime (time) {
      return dayjs(time).format('YYYY.MM.DD hh:mm:ss')
    },
    reset () {
      this.selectedCompany = ''
      this.selectedOrganization = ''
      this.searchKeyword = ''
      this.taskData = this.clonedList
    },
    onFilter () {
      let result = [...this.clonedList]
      if (this.selectedCompany !== this.$v('전체') && this.selectedCompany) result = result.filter(x => x.companyName === this.selectedCompany)
      if (this.selectedOrganization !== this.$v('전체') && this.selectedOrganization) result = result.filter(x => x.groupName === this.selectedOrganization)

      if (this.searchKeyword) result = result.filter(x => x.projectName.includes(this.searchKeyword))

      this.taskData = result
    },
    getType (type) {
      return {
        CREATE: this.$v('생성'),
        DELETE: this.$v('삭제')
      }[type]
    },
    activePublicProject (item, status) {
      this.selectedProjectIdx = undefined
      this.selectedProject = { ...item, view: status }
    },
    timeout () {
      if (this.time) {
        clearTimeout(this.time)
        this.time = null
      }

      this.time = setTimeout(() => {
        this.getAwsProjects()
      }, 30000)
    },
    close () {
      this.activePublicProject({}, false)
    },
    async getAwsProjects () {
      console.log('#getAwsProjects')
      const res = await API.iam.getAwsProjects()
      this.clonedList = res
      this.taskData = res
      const updateWaitingCountFromTabs = this.$parent.$parent.getWaitingProjectCount
      updateWaitingCountFromTabs()
      this.timeout()
    },
    async getAwsProject (projectIdx) {
      const res = await API.iam.getAwsProject(projectIdx)
      return res
    },
    selectProject (row) {
      const hasRow = row?._data?.projectIdx
      if (!hasRow) return
      this.selectedProjectIdx = row?._data?.projectIdx
    }
  },
  data () {
    return {
      clonedList: [],
      selectedCompany: '',
      selectedOrganization: '',
      searchKeyword: '',
      time: null,
      selectedProjectIdx: undefined,
      awsData: {},
      isSelected: false,
      selectedProject: {
        view: false
      },
      isVisible: false,
      taskData: [],
      tableColumns: [
        { binding: 'companyName', header: this.$v('관계사') },
        { binding: 'groupName', header: this.$v('조직') },
        { binding: 'projectName', header: this.$v('프로젝트명') },
        { binding: 'region', header: this.$v('리전') },
        { binding: 'userName', header: this.$v('요청자') },
        { binding: 'type', header: this.$v('유형'), customHtml: true },
        { binding: 'status', header: this.$v('상태'), customHtml: true },
        { binding: 'createTime', header: this.$v('요청일'), customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  &::v-deep {
    .filtering-component {
      margin-bottom:20px;
    }
    .search-input {
      width:200px;
      .el-input__inner {
        border:none;
        width:200px;
        border-bottom:1px solid #3D435E;
      }
      .el-input__icon {
        color: #3D435E !important;
      }
    }
  }
}

</style>
