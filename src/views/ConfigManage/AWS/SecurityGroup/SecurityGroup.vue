<template>
  <div class="security-group">
    <resource-filter-component
      v-if="!isOnlyGrid"
      @search="changeResource"
      @reset="reset"
      cloud-type="public"
      only-active-project
    />
    <search-component
      v-if="!isOnlyGrid"
      @input="filterKeywords"
      style="margin-bottom:30px;"
      :placeholder="$t('common.PLACEHOLDER.searchEnter')"
      :keywords="keywords"
    />
    <cmp-grid
      v-loading="isLoading"
      class="security-group-grid"
      :columns="columns"
      :item-source="dataList"
      selectable
      @selectedRow="selectRow"
    >
      <template #vpcId="{row}">
        <a
          @click.prevent="showVpcModal(true, row)"
          class="link-text"
          style="cursor:pointer;"
        >{{ row.vpcId }}</a>
      </template>

      <template #createTime="{ row }">
        <span v-if="row.createTime">{{ row.createTime | date }}</span>
        <span v-else>-</span>
      </template>
      <!-- 생성 시간 -->
    </cmp-grid>

    <el-dialog
      v-if="!isOnlyGrid"
      :visible="vpc.show"
      width="1000px"
      @close="showVpcModal(false)"
    >
      <dashboard-panel
        :title="$v('기본 정보')"
        :padding-top="0"
      >
        <vertical-table
          :columns="vpcColumns"
          :data="vpc.data"
          type="horizontal"
        />
      </dashboard-panel>
      <div style="display:flex; justify-content:center; margin-top:30px;">
        <button
          class="button -confirm"
          type="is-anti"
          @click="vpc.show = false"
        >
          {{ this.$v('닫기') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel, ResourceFilterComponent } from '@sd-fe/cmp-core'
import networkMixins from '@/views/ConfigManage/AWS/Network.mixins'
import { cloneDeep } from 'lodash'

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
  props: {
    isOnlyGrid: {
      type: Boolean,
      default: false
    },
    searchedTags: {
      type: Array,
      default () {
        return []
      }
    }
  },
  watch: {
    searchedTags: {
      immediate: true,
      deep: true,
      handler (val) {
        this.dataList = this.filterGridSearchedTags(val)
      }
    },
    getIsProjectLoaded: {
      immediate: true,
      handler (flag) {
        if (flag) this.fetch() // 리스트 호출
      }
    }
  },
  // async created () {
  //   this.fetch()
  // },
  methods: {
    filterGridSearchedTags (searchedTags) {
      let result = cloneDeep(this.initList)

      // 검색된 자원태그가 없을경우 빈 배열을 반환합니다.
      if (!searchedTags || searchedTags.length === 0) {
        return []
      }

      result = this.initList.filter((el) => {
        return searchedTags.some((tags) =>
          tags.serviceType === 'SG' && el.groupId === tags.resourceId
        )
      })
      // 자원태그 검색화면에서 사용하는 이벤트입니다.
      this.$emit('change', result.length || 0)
      return result
    },
    changeResource ({ companyIdx, groupIdx, projectIdx }) {
      this.filter.company = companyIdx
      this.filter.group = groupIdx
      this.filter.project = projectIdx

      if (this.filter.company === '전체') this.filter.company = ''
      if (this.filter.group === '전체') this.filter.group = ''
      if (this.filter.project === '전체') this.filter.project = ''
      this.filterAll()
    },
    filterAll () {
      const { company, group, project } = this.filter
      this.resetList()
      this.dataList = this.dataList.filter(item => {
        let result = true
        if (company) result = result && (item.companyIdx === company)
        if (group) result = result && (item.groupIdx === group)
        if (project) result = result && (item.projectIdx === project)
        return result
      })
    },
    async fetch () {
      this.isLoading = true
      this.dataList = await this.fetchSecurityGroup()
      this.clonedList = cloneDeep(this.dataList)
    },
    async fetchSecurityGroup () {
      let list = await this.getSecurityGroups()
      if (!list) return
      list.map(item => {
        const projectInfo = this.getProject(item.projectIdx)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          item.companyIdx = projectInfo?.companyIdx
          item.groupIdx = projectInfo?.groupIdx
          item.projectIdx = projectInfo?.projectIdx
          item.tag = this.$options.filters.securityGroupTag(projectInfo.projectName)
          item.project = projectInfo.projectName
          item.projectName = projectInfo.projectName
          item.group = projectInfo.groupName
          item.company = projectInfo.companyName
          item.projectLocation = location
        }
      })

      list = this.$options.filters.orderByCreatedTime(list)
      if (this.isOnlyGrid) {
        this.initList = cloneDeep(list)
        this.$emit('getGrid', true)
      }
      return list
    },
    reset () {
      this.clearFilters()
      this.resetList()
    },
    clearFilters () {
      this.filter.keyword = ''
    },
    resetList () {
      this.dataList = this.clonedList
    },
    filterKeywords (val) {
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.clonedList.filter(item => {
          const isId = item.groupId.toLowerCase().includes(val.toLowerCase())
          const isName = item.tag.toLowerCase().includes(val.toLowerCase())
          return isId || isName
        })
      }
    },
    async getSecurityGroups () {
      try {
        const res = await API.aws.getSecurityGroups()
        return res.data
      } catch (error) {
        console.log(error)
        console.log(error.message)
      } finally {
        this.isLoading = false
      }
    },
    async getNetworkVpc (vpcId) {
      try {
        const response = await API.aws.getNetworkVpc(vpcId)
        return response.data
      } catch (error) {
        let message = error.response.data.message
        if (error.response.data.message === 'Not Exist VPC-ID') message = this.$v('연결된 VPC 를 찾을 수 없습니다')

        this.$alert(message)
        return false
      }
    },
    async showVpcModal (bool, row) {
      console.log('#row', row)
      if (bool === false) {
        this.vpc.show = bool
      } else {
        const data = await this.getNetworkVpc(row.vpcId)
        if (!data) return
        data.environment = this.$options.filters.typeCategory(data.environment)
        data.associateSubnetCount = String(data.associateSubnetCount)
        data.createTime = this.$options.filters.date(data.createTime)
        if (row.projectName) {
          data.vpcTag = this.$options.filters.vpcTag(row.projectName, data.environment)
          data.projectLocation = row.projectLocation
        }
        this.vpc.data = data
        this.vpc.show = bool
      }
    },
    selectRow (param) {
      this.$router.push({
        name: 'security-group-detail',
        params: {
          id: param._data.groupId
        }
      })
    }
  },
  data () {
    return {
      initList: [],
      filter: {
        company: '',
        group: '',
        project: '',
        state: '',
        type: '',
        keyword: ''
      },
      keywords: [this.$v('보안그룹 ID'), this.$v('보안그룹 명')],
      isLoading: false,
      dataList: [],
      clonedList: [],
      vpc: {
        data: {},
        show: false
      },
      columns: [
        { binding: 'groupId', header: '보안그룹 ID', keyPath: 'network.securityGroupId', width: 250, customHtml: true },
        { binding: 'tag', header: '보안그룹 명', keyPath: 'network.securityGroupName', width: 200 },
        { binding: 'description', header: '설명', width: 350, keyPath: 'network.description' },
        { binding: 'inboundRuleCount', header: '인바운드 규칙 수', keyPath: 'network.inboundRuleCount', width: 170 },
        { binding: 'outboundRuleCount', header: '아웃바운드 규칙 수', keyPath: 'network.outboundRuleCount', width: 170 },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId', width: 250, customHtml: true },
        { binding: 'company', header: '관계사', keyPath: 'common.TERMS.rel', width: 150 },
        { binding: 'group', header: '조직', keyPath: 'common.TERMS.group', width: 150 },
        { binding: 'project', header: '프로젝트', keyPath: 'common.TERMS.project', width: 150 },
        { binding: 'createTime', header: '생성 시간', keyPath: 'common.createdTime', width: 150, customHtml: true }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>

.link-text {
  opacity: .99;
  text-shadow: 0px 0px 0px #3e57c9;
  color: #3e57c9;
  text-decoration: underline;
}

</style>

<style lang="scss">

.security-group {
  .el-dialog__header {
    margin-bottom:0px !important;
  }
}

.security-group {
  .security-group-grid {
    .cmp-grid-inner {
      overflow: auto;
      max-width: 100%;
      min-height: 100px;

      #cmpGrid {
        width: auto;
      }
    }
  }
}
</style>
