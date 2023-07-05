<template>
  <div class="security-network-acl">
    <resource-filter-component
      @search="changeResource"
      @reset="reset"
      cloud-type="public"
      only-active-project
    />
    <search-component
      style="margin-bottom: 30px"
      :placeholder="$t('common.PLACEHOLDER.searchEnter')"
      @input="filterKeywords"
      :keywords="keywords"
    />
    <cmp-grid
      v-loading="isLoading"
      :columns="columns"
      :item-source="dataList"
      selectable
      @selectedRow="selectRow"
    >
      <template #vpcId="{ row }">
        <a
          @click.prevent="showVpc(row)"
          class="link-text"
        >
          {{ row.vpcId }}
        </a>
      </template>
    </cmp-grid>

    <!-- VPC 모달  -->
    <el-dialog
      :visible="vpc.isShow"
      @close="vpc.isShow = false"
      width="1000px"
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
      <div style="display: flex; justify-content: center; margin-top: 30px">
        <button
          class="button -confirm"
          type="is-anti"
          @click="vpc.isShow = false"
        >
          {{ $v('닫기') }}
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
  watch: {
    getIsProjectLoaded: {
      immediate: true,
      handler (flag) {
        if (flag) this.fetch()
      }
    },
    'vpc.isShow': {
      handler (newVal) {
        if (newVal === false) {
          this.vpc.data = {}
        }
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
    async fetch () {
      this.dataList = await this.fethchNetworkAcl()
      await this.customizeData(this.dataList)
      this.clonedList = cloneDeep(this.dataList)
    },
    async fethchNetworkAcl () {
      try {
        this.isLoading = true
        const res = await API.aws.getNetworkAcl()
        return res
      } catch (e) {
        console.log(e)
      } finally {
        this.isLoading = false
      }
    },
    async showVpc (row) {
      try {
        const { data } = await API.aws.getVpcDetail(row.vpcId)
        data.environment = this.$options.filters.typeCategory(data.environment)
        data.associateSubnetCount = String(data.associateSubnetCount)
        if (row.projectName) {
          data.vpcTag = this.$options.filters.vpcTag(row.projectName, data.environment)
          data.projectLocation = row.projectLocation
        }
        data.createTime = this.$options.filters.date(data.createTime)
        this.vpc.data = data
        this.vpc.isShow = true
      } catch (error) {
        let message = error.response.data.message
        if (error.response.data.message === 'Not Exist VPC-ID') message = this.$v('연결된 VPC 를 찾을 수 없습니다')

        return await this.$alert(message, {
          callback: () => false,
          closeOnClickModal: true
        })
      }
      // this.fetchVpc(row.vpcId, row.projectLocation)
    },
    // async fetchVpc (id, projectLocation) {
    //   try {
    //     const res = await API.aws.getVpcDetail(id)
    //     this.vpc.isShow = true
    //     this.vpc.data = res.data
    //     this.vpc.data.vpcTag = this.$options.filters.vpcTag()
    //     this.vpc.data.associateSubnetCount = String(this.vpc.data.associateSubnetCount)
    //     this.vpc.data.projectLocation = projectLocation
    //   } catch (error) {
    //     const message = error.response.data.message
    //     this.$alert(message)
    //   }
    // },
    customizeData (list = []) {
      list.map((item) => {
        const projectInfo = this.getProject(item.projectIdx)
        item.createTime = this.$options.filters.date(item.createTime)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          item.companyIdx = projectInfo?.companyIdx
          item.groupIdx = projectInfo?.groupIdx
          item.projectIdx = projectInfo?.projectIdx
          item.project = projectInfo.projectName
          item.projectName = projectInfo.projectName
          item.company = projectInfo.companyName
          item.group = projectInfo.groupName

          item.tag = this.$options.filters.networkAclTag(projectInfo.projectName)
          item.projectLocation = location
        }
      })

      list = this.$options.filters.orderByCreatedTime(list)
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
    filterKeywords (val) {
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.dataList.filter(item => {
          const isId = item.networkAclId.toLowerCase().includes(val.toLowerCase())
          const isName = item.tag.toLowerCase().includes(val.toLowerCase())
          return isId || isName
        })
      }
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
    selectRow (param) {
      this.$router.push({
        name: 'security-network-acl-detail',
        params: {
          id: param._data.networkAclId
        }
      })
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
      keywords: [this.$v('네트워크 ACL ID'), this.$v('네트워크 ACL 명')],
      isLoading: false,
      clonedList: [],
      dataList: [],
      vpc: {
        isShow: false,
        data: {
        }
      },
      columns: [
        { binding: 'networkAclId', header: '네트워크 ACL ID', keyPath: 'network.networkAclId', width: 250 },
        { binding: 'tag', header: '네트워크 ACL 명', keyPath: 'network.networkAclName', width: 250 },
        { binding: 'associationSubnetCount', header: '명시적 연결 서브넷', keyPath: 'network.explicitConnectionSubnet' },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId', width: 250, customHtml: true },
        { binding: 'inboundRuleCount', header: '인바운드 규칙 수', keyPath: 'network.inboundRuleCount' },
        { binding: 'outboundRuleCount', header: '아웃바운드 규칙 수', keyPath: 'network.outboundRuleCount' },
        { binding: 'company', header: '관계사', keyPath: 'common.TERMS.rel' },
        { binding: 'group', header: '조직', keyPath: 'common.TERMS.group' },
        { binding: 'project', header: '프로젝트', keyPath: 'common.TERMS.project' },
        { binding: 'createTime', header: '생성 시간', keyPath: 'common.createdTime', width: 150 }
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
.security-network-acl {
  .el-dialog__header {
    margin-bottom: 0px !important;
  }
}
</style>
