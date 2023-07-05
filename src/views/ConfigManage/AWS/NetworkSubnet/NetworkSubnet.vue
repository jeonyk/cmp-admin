<template>
  <div class="network-subnet">
    <resource-filter-component
      @search="changeResource"
      @reset="reset"
      cloud-type="public"
      only-active-project
    >
      <section
        class="filter-form"
        v-loading="isRegionLoading"
      >
        <span class="filter-name">{{ $v('가용영역') }}</span>
        <div class="filter-options">
          <searchable-select
            :options="defaultAvailableRegions"
            :placeholder="$v('가용영역 선택')"
            unique-key="zoneName"
            @change="filterZone"
            v-model="filter.availableZone"
          />
        </div>
      </section>
    </resource-filter-component>
    <section style="margin-bottom:30px;">
      <search-component
        v-model="filter.keyword"
        @input="filterKeywords"
        :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        :keywords="keywords"
      />
    </section>
    <cmp-grid
      v-loading="isLoading"
      class="subnet-grid"
      :columns="columns"
      :item-source="dataList"
      selectable
      @selectedRow="selectRow"
    >
      <template #vpcId="{row}">
        <a
          @click.prevent="showVpcModal(true, row) "
          class="link-text"
        >{{ row.vpcId }}</a>
      </template>
      <template #availableIpAddressCount="{row}">
        <div :class="{ __zero :Number(row.availableIpAddressCount) === 0 }">
          {{ row.availableIpAddressCount }}
        </div>
      </template>
      <template #createTime="{ row }">
        {{ row.createTime | date }}
      </template>
    </cmp-grid>

    <!-- <el-dialog
      :visible="subnet.show"
      width="1000px"
      @close="subnet.show = false"
    >
      <dashboard-panel
        title="서브넷 기본 정보"
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
          @click="subnet.show = false"
        >
          닫기
        </button>
      </div>
    </el-dialog> -->

    <el-dialog
      :visible="vpc.show"
      width="1000px"
      @close="vpc.show = false"
    >
      <dashboard-panel
        :title="$t('서브넷 기본 정보')"
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
          {{ $t('common.BTN.close') }}
        <!-- 정보 수정 완료 -->
        </button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import API, { DashboardPanel, SearchableSelect, ResourceFilterComponent } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

import networkMixins from '@/views/ConfigManage/AWS/Network.mixins'
import { mapGetters } from 'vuex'
export default {
  mixins: [networkMixins],
  components: {
    DashboardPanel,
    SearchableSelect,
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
    filterZone (e) {
      this.filter.availableZone = e
      this.filterAll()
    },
    filterKeywords (val) {
      if (!val) {
        this.resetList()
        this.filterAll()
      } else {
        this.filterAll()
        this.dataList = this.dataList.filter(item => {
          const isId = item.subnetId.toLowerCase().includes(val.toLowerCase())
          const isTag = item.subnetTag.toLowerCase().includes(val.toLowerCase())
          const isSubnetBandwidth = item.subnetBandwidth.toLowerCase().includes(val.toLowerCase())
          return isId || isTag || isSubnetBandwidth
        })
      }
    },
    filterAll () {
      // availableZone
      const { company, group, project, availableZone } = this.filter
      this.resetList()
      this.dataList = this.dataList.filter(item => {
        let result = true
        if (company) result = result && (item.companyIdx === company)
        if (group) result = result && (item.groupIdx === group)
        if (project) result = result && (item.projectIdx === project)
        if (availableZone) result = result && (item.availabilityZone.toLowerCase().includes(availableZone.toLowerCase()))
        return result
      })
    },
    reset () {
      this.clearFilters()
      this.resetList()
    },
    resetList () {
      this.dataList = this.clonedList
    },
    clearFilters () {
      this.filter.availableZone = ''
    },
    async fetchList () {
      await this.fetchAvailableZones()
      await this.fetchSubnet()
      this.clonedList = cloneDeep(this.dataList)
    },
    async fetchSubnet () {
      this.dataList = await this.getSubnet()
      this.dataList.map(item => {
        const projectInfo = this.getProject(item.projectIdx)
        item.isPublic = item.isPublic ? 'Public' : 'Private'
        item.subnetBandwidth = this.$options.filters.subnetBandwidth(item.startIp, item.endIp)
        item.routeTableId = item.associateRouteTableJson.routeTableId

        item.availableIpAddressCount = String(item.availableIpAddressCount)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          item.companyIdx = projectInfo?.companyIdx
          item.groupIdx = projectInfo?.groupIdx
          item.projectIdx = projectInfo?.projectIdx
          item.company = projectInfo.companyName
          item.group = projectInfo.groupName
          item.project = projectInfo.projectName
          item.projectName = projectInfo.projectName
          item.subnetTag = this.$options.filters.subnetTag(projectInfo.projectName, item.isPublic)
          item.projectLocation = location
        }
      })

      this.dataList = this.$options.filters.orderByCreatedTime(this.dataList)
    },
    async fetchAvailableZones () {
      this.defaultAvailableRegions = await this.getDefaultRegions()
      this.defaultAvailableRegions.map(region => { region.label = region.zoneName })
    },
    async getSubnet () {
      try {
        this.isLoading = true
        const res = await API.aws.getSubnet()
        return res.data
      } catch (error) {
        console.log('@error : ', error)
      } finally {
        this.isLoading = false
      }
    },
    async getDefaultRegions () {
      try {
        // ### -환경 설정 내에서 가용영역이 활성화 된 영역만 노출 해결되면 지우기
        this.isRegionLoading = true
        const res = await API.aws.getDefaultRegions()
        return res
      } catch (error) {
        console.log(error)
      } finally {
        this.isRegionLoading = false
      }
    },
    async showVpcModal (bool, row) {
      this.vpc.data = await this.getVpc(row.vpcId, row.projectName, row.projectLocation)
      this.vpc.data.createTime = this.$options.filters.date(this.vpc.data.createTime)
      // this.vpc.data.vpcTag = this.$options.filters.vpcTag()
      // this.vpc.data.associateSubnetCount = '100'
    },
    async getVpc (id, projectName, projectLocation) {
      try {
        const { data } = await API.aws.getVpcDetail(id)
        this.vpc.show = true
        data.associateSubnetCount = String(data.associateSubnetCount)
        data.environment = this.$options.filters.typeCategory(data.environment)
        if (projectName) {
          data.vpcTag = this.$options.filters.vpcTag(projectName, data.environment)
          data.projectLocation = projectLocation
        }
        return data
      } catch (error) {
        let message = error.response.data.message
        if (error.response.data.message === 'Not Exist VPC-ID') message = this.$v('연결된 VPC 를 찾을 수 없습니다')
        this.$alert(message)
        return false
      }
    },

    selectRow (param) {
      this.$router.push({
        name: 'network-subnet-detail',
        params: {
          id: param._data.subnetId
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
        availableZone: '',
        keyword: ''
      },
      keywords: [this.$v('서브넷 ID'), this.$v('서브넷 명'), this.$v('서브넷 대역')],
      dataList: [],
      clonedList: [],
      isLoading: false,
      isRegionLoading: false,
      subnet: {
        show: false,
        data: {}
      },
      vpc: {
        show: false,
        data: {}
      },
      defaultAvailableRegions: [],
      columns: [
        { binding: 'subnetId', header: '서브넷 ID', keyPath: 'network.subnetId', width: 250, customHtml: true },
        { binding: 'subnetTag', header: '서브넷 별칭', keyPath: 'network.subnetTag', width: 220, customHtml: true },
        { binding: 'availabilityZone', header: '가용 영역', keyPath: 'network.availabilityZone', width: 200 },
        { binding: 'subnetBandwidth', header: '서브넷 대역', keyPath: 'network.subnetBand', width: 250, customHtml: true },
        { binding: 'isPublic', header: '서브넷 분류', keyPath: 'network.subnetCategory', width: 100, customHtml: true },
        { binding: 'state', header: '서브넷 상태', keyPath: 'network.subnetStatus', width: 120 },
        { binding: 'availableIpAddressCount', header: '사용 가능 IP 수', keyPath: 'network.availableIpCount', width: 120, customHtml: true },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId', width: 200, customHtml: true },
        { binding: 'routeTableId', header: '라우팅 테이블', keyPath: 'network.routingTable', width: 190, customHtml: true },
        { binding: 'networkAclId', header: 'Network ACL', keyPath: 'network.networkAcl', width: 130 },
        { binding: 'company', header: '관계사', keyPath: 'common.TERMS.rel', width: 130 },
        { binding: 'group', header: '조직', keyPath: 'common.TERMS.group', width: 130 },
        { binding: 'project', header: '프로젝트', keyPath: 'common.TERMS.project', width: 130 },
        { binding: 'createTime', header: '생성 시간', keyPath: 'common.createdTime', width: 150, customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>

</style>

<style lang="scss">

.link-text {
  opacity: .99;
  text-shadow: 0px 0px 0px #3e57c9;
  color: #3e57c9;
  text-decoration: underline;
}

.__zero {
  color:#FA5657;
}

.network-subnet {
  .subnet-grid {
    .cmp-grid-inner {
      overflow: auto;
      max-width: 100%;
      min-height: 100px;

      #cmpGrid {
        width: auto;
      }
    }
  }

  .el-dialog__header {
    margin-bottom:0px !important;
  }
}

</style>

<style lang="scss">
</style>
