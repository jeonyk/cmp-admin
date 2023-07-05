<!--
  * 1. projectIdx 가 없으면 조회 불가...
  * 2.
-->

<template>
  <div class="network-internetgateway">
    <resource-filter-component
      cloud-type="public"
      @search="changeResource"
      @reset="reset"
      only-active-project
    />
    <search-component
      v-model="filter.keyword"
      @input="filterKeywords"
      style="margin-bottom:30px;"
      :placeholder="$v('검색어를 입력해주세요')"
      :keywords="keywords"
    />

    <cmp-grid
      :columns="columns"
      :item-source="dataList"
      v-loading="isLoading"
    >
      <template #vpcId="{row}">
        <a
          @click="showVpcModal(row)"
          class="link-text"
        >
          {{ row.vpcId }}
        </a>
      </template>
    </cmp-grid>

    <el-dialog
      :visible="isShowVpcModal"
      width="1000px"
      @close="isShowVpcModal = false"
    >
      <dashboard-panel
        :title="$v('기본 정보')"
        :padding-top="0"
      >
        <vertical-table
          :columns="vpcColumns"
          :data="vpcData"
          type="horizontal"
        >
          <template #createTime>
            <span v-if="vpcData.createTime">{{ vpcData.createTime | date }}</span>
            <span v-else>-</span>
          </template>
        <!-- 생성 시간 -->
        </vertical-table>
      </dashboard-panel>
      <div style="display:flex; justify-content:center; margin-top:30px;">
        <button
          class="button -confirm"
          type="is-anti"
          @click="isShowVpcModal = false"
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
  // async created () {
  //   this.fetchList()
  // },
  watch: {
    isShowVpcModal: {
      handler (newVal) {
        if (newVal === false) {
          this.vpcData = {}
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
    async fetchList () {
      await this.fetchIntergetGateway()
      this.clonedList = cloneDeep(this.dataList)
    },
    async fetchIntergetGateway () {
      this.dataList = await this.getInternetGateway()
      // await this.getInternetGatewayTag(this.dataList)
      await this.convertTimeFormat(this.dataList)
    },
    async fetchVpc (vpcId, projectName, projectLocation, environment) {
      const res = await this.getVpc(vpcId, projectName, projectLocation)
      // res.projectLocation = projectLocation
      if (!res) return
      return res
    },
    async getInternetGateway () {
      try {
        this.isLoading = true
        const response = await API.aws.getInternetGateway()
        return response.data
      } catch (error) {
        console.log('@error : ', error)
      } finally {
        this.isLoading = false
      }
    },
    async getVpc (vpcId, projectName, projectLocation) {
      try {
        const { data } = await API.aws.getVpcDetail(vpcId)
        this.isShowVpcModal = true
        data.vpcTag = this.$options.filters.vpcTag(projectName, data.environment)
        data.associateSubnetCount = String(data.associateSubnetCount)
        data.projectLocation = projectLocation
        data.environment = this.$options.filters.typeCategory(data.environment)
        return data
      } catch (error) {
        let message = error.response.data.message
        if (error.response.data.message === 'Not Exist VPC-ID') message = this.$v('연결된 VPC 를 찾을 수 없습니다')
        return await this.$alert(message, {
          callback: () => false,
          closeOnClickModal: true
        })
      }
    },
    // getInternetGatewayTag (list = []) {
    //   list.map(item => { item.tag = this.$options.filters.internetGatewayTag() })
    // },
    reset () {
      this.clearFilters()
      this.resetList()
    },
    resetList () {
      this.dataList = this.clonedList
    },
    clearFilters () {
      this.filter.keyword = ''
    },
    filterKeywords (val) {
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.clonedList.filter(item => {
          const isId = item.internetGatewayId.toLowerCase().includes(val.toLowerCase())
          const isName = item.tag.toLowerCase().includes(val.toLowerCase())
          return isId || isName
        })
      }
    },
    async showVpcModal (row) {
      this.vpcData = await this.fetchVpc(row.vpcId, row.projectName, row.projectLocation)
    },
    convertTimeFormat (list = []) {
      list.map(item => {
        const projectInfo = this.getProject(item.projectIdx)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          item.companyIdx = projectInfo?.companyIdx
          item.groupIdx = projectInfo?.groupIdx
          item.projectIdx = projectInfo?.projectIdx
          item.company = projectInfo.companyName
          item.group = projectInfo.groupName
          item.project = projectInfo.projectName
          item.projectName = projectInfo.projectName
          item.projectLocation = location
          item.tag = this.$options.filters.internetGatewayTag(projectInfo.projectName)
        }
        item.createTime = this.$options.filters.date(item.createTime)
      })
      this.dataList = this.$options.filters.orderByCreatedTime(this.dataList)
    }
  },
  data () {
    return {
      isLoading: false,
      keywords: [this.$v('인터넷 G/W ID'), this.$v('인터넷 G/W 명')],
      dataList: [],
      clonedList: [],
      vpcData: {},
      isShowVpcModal: false,
      filter: {
        keyword: ''
      },
      columns: [
        { binding: 'internetGatewayId', header: '인터넷 게이트웨이 ID', keyPath: 'network.internetGatewayId' },
        { binding: 'tag', header: '인터넷 게이트웨이 명', keyPath: 'network.internetGatewayName' },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId', customHtml: true },
        { binding: 'company', header: '관계사', keyPath: 'common.TERMS.rel' },
        { binding: 'group', header: '조직', keyPath: 'common.TERMS.group' },
        { binding: 'project', header: '프로젝트', keyPath: 'common.TERMS.project' },
        { binding: 'createTime', header: '생성 시간', keyPath: 'common.createdTime' }
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
.network-internetgateway {
  .el-dialog__header {
    margin-bottom:0px !important;
  }
}
</style>
