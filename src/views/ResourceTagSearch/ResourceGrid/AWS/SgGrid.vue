<template>
  <div class="security-group">
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

      <template #createDate="{ row }">
        <span v-if="row.createDate">{{ row.createDate | date }}</span>
        <span v-else>-</span>
      </template>
      <!-- 생성 시간 -->
    </cmp-grid>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    })
  },
  props: {
    resourceGridData: {
      type: Array,
      default () {
        return []
      }
    }
  },
  watch: {
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
      list = this.$options.filters.orderByCreatedTime(list, 'ascend')
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
        data.createDate = this.$options.filters.date(data.createDate)
        if (row.projectName) {
          data.vpcName = this.$options.filters.vpcTag(row.projectName, data.environment)
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
        { binding: 'createDate', header: '생성 시간', keyPath: 'common.createdTime', width: 150, customHtml: true }
      ],
      vpcColumns: [
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId' },
        { binding: 'vpcName', header: 'VPC 별칭', keyPath: 'network.vpcTag' },
        { binding: 'regionName', header: 'Region 정보', keyPath: 'network.regionInfo' },
        { binding: 'associateSubnetCount', header: '서브넷 개수', keyPath: 'network.subnetCount' },
        { binding: 'environment', header: 'VPC 망 분류', keyPath: 'network.vpcNetType' },
        { binding: 'cidrBlock', header: 'VPC 대역', keyPath: 'network.vpcBand' },
        { binding: 'networkAclId', header: '네트워크 ACL', keyPath: 'network.networkAcl' },
        { binding: 'state', header: 'VPC 연결상태', keyPath: 'network.vpcConnectionStatus' },
        { binding: 'createDate', header: '생성일', keyPath: 'common.createdTime' },
        { binding: 'projectLocation', header: '프로젝트 위치 ', keyPath: 'common.projectLocation' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>

.link-text {
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
