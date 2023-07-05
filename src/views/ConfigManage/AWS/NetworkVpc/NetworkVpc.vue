<template>
  <div class="network-vpc">
    <resource-filter-component
      @search="changeResource"
      @reset="reset"
      cloud-type="public"
      only-active-project
    >
      <section class="filter-form">
        <span class="filter-name">{{ this.$v('VPC 연결 상태') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filter.state"
            @change="filterAll"
          >
            <el-option
              :key="option.value"
              v-for="option in statusOptions"
              :value="option.value"
              :label="option.label"
            />
          </el-select>
        </div>
      </section>
      <section class="filter-form">
        <span class="filter-name">{{ this.$v('VPC 망 종류') }}</span>
        <div class="filter-options">
          <el-select
            v-model="filter.type"
            @change="filterAll"
          >
            <el-option
              v-for="option in typeOptions"
              :key="option.value"
              :value="option.value"
              :label="option.label"
            />
          </el-select>
        </div>
      </section>
    </resource-filter-component>
    <search-component
      v-model="filter.keyword"
      @input="filterKeywords"
      style="margin-bottom:30px;"
      :placeholder="$t('common.PLACEHOLDER.searchEnter')"
      :keywords="keywords"
    />
    <cmp-grid
      v-if="getIsProjectLoaded"
      v-loading="isLoading"
      :columns="columns"
      :item-source="dataList"
      selectable
      @selectedRow="selectRow"
    >
      <template #vpcId="{row}">
        <a
          @click.prevent="showVpcModal(true, row)"
          class="link-text"
        >{{ row.vpcId }}</a>
      </template>
    </cmp-grid>

    <el-dialog
      :visible="vpcShow"
      width="1000px"
      @close="showVpcModal(false)"
    >
      <dashboard-panel
        :title="$t('bill.basicInfo')"
        :padding-top="0"
      >
        <vertical-table
          :columns="vpcColumns"
          :data="vpc"
          type="horizontal"
        />
      </dashboard-panel>

      <div style="display:flex; justify-content:center; margin-top:30px;">
        <button
          class="button"
          type="is-anti"
          @click="vpcShow = false"
        >
          {{ $t('common.BTN.close') }}
        <!-- 정보 수정 완료 -->
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel, ResourceFilterComponent } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

import networkMixins from '@/views/ConfigManage/AWS/Network.mixins'
import { mapGetters } from 'vuex'
export default {
  mixins: [networkMixins],
  components: {
    VerticalTable,
    DashboardPanel,
    ResourceFilterComponent
  },
  computed: {
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  watch: {
    getIsProjectLoaded: {
      immediate: true,
      handler (flag) {
        if (flag) this.fetchList() // 리스트 호출
      }
    }
  },
  methods: {
    changeResource ({ companyIdx, groupIdx, projectIdx }) {
      this.filter.company = companyIdx
      this.filter.group = groupIdx
      this.filter.project = projectIdx

      if (this.filter.company === '전체') this.filter.company = ''
      if (this.filter.group === '전체') this.filter.group = ''
      if (this.filter.project === '전체') this.filter.project = ''
      this.filterAll()
    },
    async fetchList () {
      this.dataList = await this.getNetworkVpc()
      await this.customizeData()
      this.clonedList = cloneDeep(this.dataList)
    },
    customizeData () {
      this.dataList.map(item => {
        const projectInfo = this.getProject(item.projectIdx)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          item.companyIdx = projectInfo?.companyIdx
          item.groupIdx = projectInfo?.groupIdx
          item.projectName = projectInfo?.projectName
          item.company = projectInfo.companyName
          item.group = projectInfo.groupName
          item.project = projectInfo.projectName
          item.createTime = this.$options.filters.date(item.createTime)
          item.vpcTag = this.$options.filters.vpcTag(item.projectName, item.environment)
          item.projectLocation = location
        }
        item.environmentEng = item.environment
        item.environment = this.$options.filters.typeCategory(item.environment)
        item.associateSubnetCount = String(item.associateSubnetCount)
      })
    },
    async getProjectDetail (projectIdx) {
      const prj = await API.aws.getProjectDetail(projectIdx)
      return prj
    },
    async getNetworkVpc () {
      try {
        this.isLoading = true
        const response = await API.aws.getAllVpc()
        return response.data
      } catch (error) {
        console.log('@error : ', error)
      } finally {
        this.isLoading = false
      }
    },
    reset () {
      this.resetList()
      this.clearFilters()
    },
    resetList () {
      this.dataList = this.clonedList
    },
    clearFilters () {
      this.filter.type = ''
      this.filter.state = ''
      this.filter.keyword = ''
    },
    filterAll () {
      const { company, group, project, state, type } = this.filter
      this.resetList()
      this.dataList = this.dataList.filter(item => {
        let result = true
        if (company) result = result && (item.companyIdx === company)
        if (group) result = result && (item.groupIdx === group)
        if (project) result = result && (item.projectIdx === project)
        if (state) result = result && (item.state.toLowerCase().includes(state.toLowerCase()))
        if (type) result = result && (item.environmentEng.toLowerCase().includes(type.toLowerCase()))
        return result
      })
    },
    filterKeywords (val) {
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.dataList.filter(item => {
          const isId = item.vpcId?.toLowerCase().includes(val.toLowerCase())
          const isVpc = item.cidrBlock?.toLowerCase().includes(val.toLowerCase())
          const isName = item.vpcTag?.toLowerCase().includes(val.toLowerCase())
          return isId || isVpc || isName
        })
      }
    },
    selectRow (param) {
      if (param && param._data.vpcId) {
        this.routeTo({
          name: 'network-vpc-detail',
          params: {
            id: param._data.vpcId
          }
        })
      }
    },
    routeTo (payload) { this.$router.push(payload) },
    showVpcModal (bool, row) {
      this.vpcShow = bool
      bool ? this.vpc = row : this.vpc = {}
    }
  },
  data () {
    return {
      filter: {
        company: '',
        group: '',
        project: '',
        state: '',
        type: '',
        keyword: ''
      },
      keywords: ['VPC ID', this.$v('VPC 명'), this.$v('VPC 대역')],
      isLoading: false,
      dataList: [],
      clonedList: [],
      vpc: {},
      vpcShow: false,
      // 서브넷 연결 상태
      statusOptions: [
        { label: 'available', value: 'available' },
        { label: 'pending', value: 'pending' }
      ],
      // vpc 망 종류
      typeOptions: [
        { label: '개발', value: 'DEV' },
        { label: '운영', value: 'PRD' },
        { label: '스테이징', value: 'STG' }
      ],
      columns: [
        { binding: 'cidrBlock', header: 'VPC 대역', keyPath: 'network.vpcBand', width: 150 },
        { binding: 'environment', header: 'VPC 망 종류', keyPath: 'network.vpcNetType', width: 120, customHtml: true },
        { binding: 'regionDisplayName', header: 'Region', keyPath: '', width: 120 },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'VPC ID', customHtml: true },
        { binding: 'vpcTag', header: 'VPC 명', width: '*', keyPath: 'network.vpcName', customHtml: true },
        { binding: 'state', header: 'VPC 연결 상태', width: 120, keyPath: 'network.vpcConnectionStatus' },
        { binding: 'networkAclId', header: '네트워크 ACL', width: '*', keyPath: 'network.networkAcl' },
        { binding: 'company', header: '관계사', width: 120, keyPath: 'common.TERMS.rel' },
        { binding: 'group', header: '조직', width: 120, keyPath: 'common.TERMS.group' },
        { binding: 'project', header: '프로젝트', width: 140, keyPath: 'common.TERMS.project' },
        { binding: 'createTime', header: '생성 시간', width: 180, customHtml: true, keyPath: 'common.createdTime' }
      ]
    }
  }
}
</script>

<style scoped>
.link-text {
  opacity: .99;
  text-shadow: 0px 0px 0px #3e57c9;
  color: #3e57c9;
  text-decoration: underline;
}
</style>

<style lang="scss">
.network-vpc {
  .el-dialog__header {
    margin-bottom:0px !important;
  }
}
</style>
