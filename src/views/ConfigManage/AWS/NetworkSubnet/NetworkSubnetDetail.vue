<template>
  <div>
    <dashboard-panel
      :title="$t('bill.basicInfo')"
      :padding-top="0"
    >
      <vertical-table
        :columns="columns"
        :data="subnet"
        type="horizontal"
      />
    </dashboard-panel>
    <dashboard-panel
      :title="$v('연결된 VPC 정보')"
      :padding-top="0"
    >
      <vertical-table
        :columns="vpcColumns"
        :data="vpc"
        type="horizontal"
      />
    </dashboard-panel>
  </div>
</template>
<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'

import { mapGetters } from 'vuex'
export default {
  components: {
    VerticalTable,
    DashboardPanel
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
        if (flag) {
          this.fetch()
          this.setIdToBreadCrumbs(this.$route.params.id)
        }
      }
    }
  },
  methods: {
    async fetch () {
      await this.fetchSubnet(this.$route.params.id)
      await this.fetchVpc(this.subnet.vpcId)
    },
    setIdToBreadCrumbs (id) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: id,
        path: ''
      })
    },
    async fetchSubnet (id) {
      // this.subnet = await this.getSubnet({ subnetId: this.$route.params.id })
      this.subnet = await this.getSubnet(id)
      const routingId = this.subnet.associateRouteTableJson.routeTableId
      this.subnet.availableIpAddressCount = String(this.subnet.availableIpAddressCount)
      this.subnet.isPublic = this.subnet.isPublic ? 'Public' : 'Private'
      this.subnet.createTime = this.$options.filters.date(this.subnet.createTime)
      this.subnet.routingTableId = routingId
      const projectInfo = this.getProject(this.subnet.projectIdx)
      if (projectInfo) {
        const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
        this.subnet.projectLocation = location
        this.subnet.tag = this.$options.filters.subnetTag(projectInfo.projectName, this.subnet.isPublic)
      }
    },
    async fetchVpc (id) {
      this.vpc = await this.getVpcData(id)
      if (!this.vpc) return
      this.vpc.associateSubnetCount = String(this.vpc.associateSubnetCount)
      this.vpc.environment = this.$options.filters.typeCategory(this.vpc.environment)
      this.vpc.createTime = this.$options.filters.date(this.vpc.createTime)
      const projectInfo = this.getProject(this.vpc.projectIdx)
      if (projectInfo) {
        const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
        this.vpc.projectLocation = location
        this.vpc.tag = this.$options.filters.vpcTag(projectInfo.projectName, this.vpc.environment)
      }
    },
    async getSubnet (id) {
      try {
        const res = await API.aws.getSubnet({ subnetId: id })
        console.log('############res', res)
        if (!res.data[0]) throw Error('error')
        return res.data[0]
      } catch (error) {
        console.log('@error : ', error)
        await this.$alert(this.$v('서브넷 정보를 찾을 수 없습니다'), {
          callback: () => false,
          closeOnClickModal: true
        })
        return this.$router.replace({ name: 'subnet-aws' })
      }
    },
    async getVpcData (id) {
      try {
        const res = await API.aws.getVpcDetail(id)
        return res.data
      } catch (error) {
        console.log(error)
      }
    }
  },
  data () {
    return {
      vpc: {},
      subnet: {},
      columns: [
        { binding: 'subnetId', header: '서브넷 ID', keyPath: 'network.subnetId' },
        { binding: 'tag', header: '서브넷 별칭', keyPath: 'network.subnetTag' },
        { binding: 'availabilityZone', header: '가용 영역', keyPath: 'network.availabilityZone' },
        { binding: 'isPublic', header: '서브넷 분류', keyPath: 'network.subnetCategory' },
        { binding: 'cidrBlock', header: '서브넷 대역', keyPath: 'network.subnetBand' },
        { binding: 'availableIpAddressCount', header: ' 사용 가능 IP  수', keyPath: 'network.availableIpCount' },
        { binding: 'vpcId', header: '연결된 VPC ID', keyPath: 'network.connectedVpcInfo' },
        { binding: 'networkAclId', header: 'Network ACL', keyPath: 'network.networkAcl' },
        { binding: 'routingTableId', header: '라우팅 테이블', keyPath: 'network.routingTable' },
        { binding: 'createTime', header: '프로젝트 위치', keyPath: this.$v('생성 시간') },
        { binding: 'projectLocation', header: '생성일', keyPath: 'common.projectLocation' }
      ],
      vpcColumns: [
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId' },
        { binding: 'tag', header: 'VPC 별칭', keyPath: 'network.vpcTag' },
        { binding: 'regionName', header: 'Region 정보', keyPath: 'network.availabilityZoneInfo' },
        { binding: 'associateSubnetCount', header: '서브넷 개수', keyPath: 'network.subnetCount' },
        { binding: 'environment', header: 'VPC 망 분류', keyPath: 'network.vpcNetType' },
        { binding: 'cidrBlock', header: 'VPC 대역', keyPath: 'network.vpcBand' },
        { binding: 'networkAclId', header: '네트워크 ACL', keyPath: 'network.networkAcl' },
        { binding: 'state', header: 'VPC 연결상태', keyPath: 'network.vpcConnectionStatus' },
        { binding: 'createTime', header: '생성일', keyPath: 'common.createdTime' },
        { binding: 'projectLocation', header: '프로젝트 위치', keyPath: 'common.projectLocation' }
      ]
    }
  }
}
</script>
