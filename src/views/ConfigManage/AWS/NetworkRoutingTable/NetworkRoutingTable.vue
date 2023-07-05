<template>
  <div class="network-routing-table">
    <resource-filter-component
      @search="changeResource"
      @reset="reset"
      cloud-type="public"
      only-active-project
    />
    <search-component
      v-model="filter.keyword"
      style="margin-bottom:30px;"
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
      <template #vpcId="{row}">
        <a
          @click.prevent="showVpcModal(true,row)"
          class="link-text"
          style="cursor:pointer;"
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
        :title="$t('bill.basicInfo')"
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
          @click="vpc.isShow = false"
        >
          {{ $t('common.BTN.close') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { DashboardPanel, ResourceFilterComponent } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

import networkMixins from '@/views/ConfigManage/AWS/Network.mixins'
import { mapGetters } from 'vuex'
export default {
  mixins: [networkMixins],
  components: {
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
    'vpc.isShow': {
      handler (newVal) {
        if (newVal === false) {
          this.vpc.data = {}
        }
      }
    },
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
    selectRow (param) {
      this.$router.push({
        name: 'routing-table-aws-detail',
        params: {
          id: param._data.routeTableId,
          index: param._data.index
        }
      })
    },
    async showVpcModal (bool, row) {
      this.fetchVpc(row.vpcId, row.projectName, row.projectLocation)
    },
    async fetchVpc (vpcId, projectName, projectLocation) {
      this.vpc.data = await this.getVpc(vpcId)
      this.vpc.data.associateSubnetCount = String(this.vpc.data.associateSubnetCount)
      this.vpc.data.environment = this.$options.filters.typeCategory(this.vpc.data.environment)
      this.vpc.data.createTime = this.$options.filters.date(this.vpc.data.createTime)
      if (projectName) {
        this.vpc.data.vpcTag = this.$options.filters.vpcTag(projectName, this.vpc.data.environment)
        this.vpc.data.projectLocation = projectLocation
      }
    },
    // associateSubnetCount
    async getVpc (vpcId) {
      try {
        const res = await API.aws.getVpcDetail(vpcId)
        this.vpc.isShow = true
        return res.data
      } catch (error) {
        let message = error.response.data.message
        if (error.response.data.message === 'Not Exist VPC-ID') message = this.$v('연결된 VPC 를 찾을 수 없습니다')
        this.$alert(message)
        return false
      }
    },
    async fetchList () {
      this.dataList = await this.getRoutingTable()
      await this.convertTimeFormat(this.dataList)
      // await this.bindData(this.dataList)

      this.dataList.map((data, idx) => {
        const projectInfo = this.getProject(data.projectIdx)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          data.companyIdx = projectInfo?.companyIdx
          data.groupIdx = projectInfo?.groupIdx
          data.projectIdx = projectInfo?.projectIdx
          data.projectName = projectInfo?.projectName
          data.project = projectInfo.projectName
          data.group = projectInfo.groupName
          data.company = projectInfo.companyName
          data.projectLocation = location
          data.name = this.$options.filters.routingTag(projectInfo.projectName, idx)
        }
      })

      this.dataList = this.$options.filters.orderByCreatedTime(this.dataList)
      this.clonedList = cloneDeep(this.dataList)
    },
    reset () {
      // this.clearFilters()
      this.resetList()
    },
    resetList () {
      this.dataList = this.clonedList
    },
    filterKeywords (val) {
      console.log('@검색키워드', val)
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.clonedList.filter(item => {
          const isId = item.routeTableId.toLowerCase().includes(val.toLowerCase())
          const isName = item.name.toLowerCase().includes(val.toLowerCase())
          return isId || isName
        })
      }
    },
    bindData (list) {
      list.map((item) => {
        item.name = this.$options.filters.routingTag()
      })
    },
    convertTimeFormat (list) {
      list.map(data => {
        data.createTime = this.$options.filters.date(data.createTime)
      })
    },
    async getRoutingTable () {
      try {
        this.isLoading = true
        const response = await API.aws.getRoutingTable()
        return response.data
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoading = false
      }
    }
  },
  data () {
    return {
      filter: {
        company: '',
        group: '',
        project: '',
        availableZone: '',
        keyword: ''
      },
      keywords: [this.$v('라우팅 테이블 ID'), this.$v('라우팅 테이블 명')],
      dataList: [],
      clonedList: [],
      isLoading: false,
      vpc: {
        isShow: false,
        data: {
        }
      },
      columns: [
        { binding: 'routeTableId', header: '라우팅 테이블 ID', keyPath: 'network.routingTableId', width: 200 },
        { binding: 'name', header: '라우팅 테이블 명', keyPath: 'network.routingTableName', width: 200 },
        { binding: 'associationSubnetCount', header: '명시적 연결 서브넷', keyPath: 'network.explicitConnectionSubnet', width: 200 },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId', width: 200, customHtml: true },
        { binding: 'company', header: '관계사', keyPath: 'common.TERMS.rel' },
        { binding: 'group', header: '조직', keyPath: 'common.TERMS.group' },
        { binding: 'project', header: '프로젝트', keyPath: 'common.TERMS.project' },
        { binding: 'createTime', header: '생성 시간', keyPath: 'common.createdTime' }
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
.network-routing-table {
  .el-dialog__header {
    margin-bottom:0px !important;
  }
}
</style>
