<template>
  <div class="network-nat-gateway">
    <resource-filter-component
      @search="changeResource"
      @reset="reset"
      cloud-type="public"
      only-active-project
    />
    <section style="margin-bottom: 30px">
      <search-component
        v-model="filter.keyword"
        @input="filterKeywords"
        :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        :keywords="keywords"
      />
    </section>
    <cmp-grid
      v-loading="isLoading"
      class="natgateway-grid"
      :columns="columns"
      :item-source="dataList"
    >
      <template #vpcId="{ row }">
        <a
          @click="showVpcData(row)"
          class="link-text"
        >{{ row.vpcId }}</a>
      </template>
      <template #subnetId="{ row }">
        <a
          @click="showSubnetData(row)"
          class="link-text"
        >{{ row.subnetId }}</a>
      </template>
      <template #createTime="{row}">
        <div>{{ row.createTime | date }}</div>
      </template>
    </cmp-grid>

    <!-- VPC 모달  -->
    <el-dialog
      :visible="vpc.isShow"
      @close="vpc.isShow = false"
      width="1000px"
    >
      <dashboard-panel
        :title="$v('VPC 기본 정보')"
        :padding-top="0"
      >
        <vertical-table
          :columns="vpcColumns"
          :data="vpc.data"
          type="horizontal"
        >
          <template #createTime>
            <span v-if="vpc.data.createTime">{{ vpc.data.createTime | date }}</span>
            <span v-else>-</span>
          </template>
        <!-- 생성 시간 -->
        </vertical-table>
      </dashboard-panel>
      <div style="display:flex; justify-content:center; margin-top:30px;">
        <button
          class="button -confirm"
          type="is-anti"
          @click="vpc.isShow = false"
        >
          닫기
        </button>
      </div>
    </el-dialog>

    <!-- Subnet 모달  -->
    <el-dialog
      :visible="subnet.isShow"
      @close="subnet.isShow = false"
      width="1000px"
    >
      <dashboard-panel
        :title="$v('기본 정보')"
        :padding-top="0"
      >
        <vertical-table
          :columns="subnetColumns"
          :data="subnet.data"
          type="horizontal"
        />
      </dashboard-panel>
      <div style="display:flex; justify-content:center; margin-top:30px;">
        <button
          class="button -confirm"
          type="is-anti"
          @click="subnet.isShow = false"
        >
          닫기
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { DashboardPanel, ResourceFilterComponent } from '@sd-fe/cmp-core'
import networkMixins from '@/views/ConfigManage/AWS/Network.mixins'
import { cloneDeep } from 'lodash'

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
  // async created () {
  //   await this.fetchList()
  //   this.clonedList = cloneDeep(this.dataList)
  // },
  watch: {
    getIsProjectLoaded: {
      immediate: true,
      async handler (flag) {
        if (flag) {
          await this.fetchList() // 리스트 호출
          this.clonedList = cloneDeep(this.dataList)
        }
      }
    },
    'subnet.isShow': {
      handler (newVal) {
        if (newVal === false) {
          this.subnet.data = {}
        }
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
    async fetchList () {
      this.dataList = await this.getNatGateway()
      this.dataList = this.$options.filters.orderByCreatedTime(this.dataList)
      // await this.getInternetGatewayTag(this.dataList)
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
    async showVpcData ({ vpcId, projectName, projectLocation }) {
      try {
        const { data } = await API.aws.getVpcDetail(vpcId)
        if (projectName) {
          data.vpcTag = this.$options.filters.vpcTag(projectName, data.environment)
          data.projectLocation = projectLocation
          data.environment = this.$options.filters.typeCategory(data.environment)
          data.associateSubnetCount = String(data.associateSubnetCount)
        }
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
    },
    async showSubnetData (row) {
      this.subnet.data = await this.getSubnet(row.subnetId)
      this.subnet.data.isPublic = this.subnet.data.isPublic ? 'Public' : 'Private'
      this.subnet.data.subnetTag = this.$options.filters.subnetTag(row.projectName, this.subnet.data.isPublic)
      this.subnet.data.availableIpAddressCount = String(this.subnet.data.availableIpAddressCount)
      this.subnet.data.createTime = this.$options.filters.date(this.subnet.data.createTime)
      this.subnet.data.routeTableId = this.subnet.data.associateRouteTableJson.routeTableId
      this.subnet.data.projectLocation = row.projectLocation
    },
    async getSubnet (payload) {
      try {
        const res = await API.aws.getSubnetDetail(payload)
        console.log('#get subnet')
        console.log(res)
        this.subnet.isShow = true

        return res.data
      } catch (error) {
        let message = error.response.data.message
        if (error.response.data.message === 'Not Exist Subnet-ID') message = '연결된 Subnet 을 찾을 수 없습니다'
        return await this.$alert(message, {
          callback: () => false,
          closeOnClickModal: true
        })
      }
    },
    // },
    filterKeywords (val) {
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.dataList.filter(item => {
          const isId = item.natGatewayId.toLowerCase().includes(val.toLowerCase())
          const isName = item.tag.toLowerCase().includes(val.toLowerCase())
          return isId || isName
        })
      }
    },
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
    async getNatGateway () {
      try {
        this.isLoading = true
        const response = await API.aws.getNatGateway()
        response.map(item => {
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
            item.tag = this.$options.filters.natGatewayTag(projectInfo.projectName)
            item.projectLocation = location
          }
        })
        return response
      } catch (error) {
        console.log(error)
        return false
      } finally {
        this.isLoading = false
      }
    }
  },
  data () {
    return {
      isLoading: false,
      filter: {
        company: '',
        group: '',
        project: '',
        availableZone: '',
        keyword: ''
      },
      keywords: ['NAT G/W ID', this.$v('NAT G/W 명')],
      clonedList: [],
      dataList: [],
      vpc: {
        isShow: false,
        data: {}
      },
      subnet: {
        isShow: false,
        data: {}
      },
      columns: [
        { binding: 'natGatewayId', header: 'NAT Gateway ID', keyPath: 'network.natGatewayId', width: 200 },
        { binding: 'tag', header: 'NAT Gateway 명', keyPath: 'network.natGatewayName', width: 200 },
        { binding: 'privateIp', header: 'Elastic IP', keyPath: '', width: 200 },
        { binding: 'networkInterfaceId', header: '네트워크 인터페이스 ID', keyPath: 'network.networkInterfaceId', width: 200 },
        { binding: 'connectivityType', header: '연결 유형', keyPath: 'network.connectionType', width: 200 },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId', width: 200, customHtml: true },
        { binding: 'subnetId', header: '서브넷 ID', keyPath: 'network.subnetId', width: 200, customHtml: true },
        { binding: 'company', header: '관계사', keyPath: 'common.TERMS.rel', width: 200 },
        { binding: 'group', header: '조직', keyPath: 'common.TERMS.group', width: 200 },
        { binding: 'project', header: '프로젝트', keyPath: 'common.TERMS.project', width: 200 },
        { binding: 'createTime', header: '생성 시간', keyPath: 'common.createdTime', customHtml: true, width: 150 }
      ],
      subnetColumns: [
        { binding: 'subnetId', header: '서브넷 ID', keyPath: 'network.subnetId' },
        { binding: 'subnetTag', header: '서브넷 별칭', keyPath: 'network.subnetTag' },
        { binding: 'availabilityZone', header: '가용 영역', keyPath: 'network.availabilityZone' },
        { binding: 'isPublic', header: '서브넷 분류', keyPath: 'network.subnetCategory' },
        { binding: 'cidrBlock', header: '서브넷 대역', keyPath: 'network.subnetBand' },
        { binding: 'availableIpAddressCount', header: '사용 가능 IP 수', keyPath: 'network.availableIpCount' },
        { binding: 'vpcId', header: '연결된 VPC ID', keyPath: 'network.vpcId' },
        { binding: 'projectLocation', header: '프로젝트 위치', keyPath: 'common.projectLocation' },
        { binding: 'routeTableId', header: '라우팅 테이블', keyPath: 'network.routingTable' },
        { binding: 'createTime', header: '생성일', keyPath: 'common.createdTime' },
        { binding: 'networkAclId', header: 'Network ACL', keyPath: 'network.networkAcl' }
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
.network-nat-gateway {
  .natgateway-grid {
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

.network-nat-gateway {
  .el-dialog__header {
    margin-bottom:0px !important;
  }
}
</style>
