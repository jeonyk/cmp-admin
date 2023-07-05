<template>
  <div>
    <dashboard-panel
      v-loading="isLoading"
      :title="$t('bill.basicInfo')"
      :padding-top="0"
    >
      <vertical-table
        :columns="columns"
        :data="routingTableData"
        type="horizontal"
      >
        <template #createTime>
          <span v-if="routingTableData.createTime">{{ routingTableData.createTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 생성 시간 -->
      </vertical-table>
    </dashboard-panel>

    <!-- 서브넷 연결 정보 -->
    <content-foldable
      style="margin-top:30px;"
      :title="$v('라우팅 정보')"
      :length="routingLength"
      @close="showRoutingCards"
    >
      <!-- :length="routingTableData.routes.length || 0" -->
      <template v-if="routingTableData.routes && routingTableData.routes.length">
        <transition name="slide">
          <div v-if="isShowRoutings">
            <ul style=" display:flex; gap:10px;">
              <routing-card
                :key="route.ip"
                :data="route"
                v-for="route in routingTableData.routes"
              />
            </ul>
          </div>
        </transition>
      </template>
      <template v-if="!subnets.length && !isShowRoutings">
        <p
          class="empty-data"
          style="font-size:20px;"
        >
          {{ $v('데이터가 없습니다.') }}
        </p>
      </template>
    </content-foldable>

    <!-- 서브넷 연결 정보 -->
    <content-foldable
      style="margin-top:30px;"
      :title="$v('서브넷 연결 정보')"
      :length="subnets.length"
      @close="showSubnetCards"
    >
      <template>
        <transition name="slide">
          <div v-if="subnets && subnets.length">
            <ul style=" display:flex; gap:10px;">
              <subnet-card
                v-for="subnet in subnets"
                :data="subnet"
                :key="subnet.subnetId"
              />
            </ul>
          </div>
        </transition>
      </template>
      <template v-if="!subnets.length">
        <p
          class="empty-data"
          style="text-align:center; font-size:20px;"
        >
          {{ $v('데이터가 없습니다.') }}
        </p>
      </template>
    </content-foldable>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import SubnetCard from '@/components/NetworkAws/SubnetCard.vue'
import RoutingCard from '@/components/NetworkAws/RoutingCard.vue'
import ContentFoldable from '@/components/NetworkAws/ContentFoldable.vue'

import { mapGetters } from 'vuex'

export default {
  components: {
    VerticalTable,
    SubnetCard,
    RoutingCard,
    ContentFoldable,
    DashboardPanel
  },
  computed: {
    ...mapGetters({
      getIsProjectLoaded: 'project/getIsProjectLoaded',
      getProject: 'project/getProject'
    }),
    routingLength () {
      return this.routingTableData?.routes?.length || 0
    }
  },
  watch: {
    getIsProjectLoaded: {
      immediate: true,
      handler (flag) {
        if (flag) {
          this.fetchData()
          this.setIdToBreadCrumbs(this.$route.params.id)
        }
      }
    }
  },
  // async created () {
  //   this.fetchData()
  //   this.setIdToBreadCrumbs(this.$route.params.id)
  // },
  methods: {
    async fetchData () {
      this.routingTableData = await this.getRouteData(this.$route.params.id)
    },
    async getVpcDetail (id) {
      try {
        const { data } = await API.aws.getVpcDetail(id)
        return data
      } catch (error) {
        console.log('#error', error.response.data)
        return false
      }
    },
    async getRouteData (id) {
      try {
        this.isLoading = true
        const { data } = await API.aws.getRoutingTableDetail(id)
        const vpc = await this.getVpcDetail(data.vpcId)
        if (vpc) {
          this.vpcEnvironment = this.$options.filters.typeCategory(vpc.environment)
        }
        const projectInfo = this.getProject(data.projectIdx)
        if (projectInfo) {
          const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
          data.vpcTag = vpc && this.$options.filters.vpcTag(projectInfo.projectName, this.vpcEnvironment)
          data.routingTag = this.$options.filters.routingTag(projectInfo.projectName, this.$route.params.index)
          data.projectLocation = location
          data.associationSubnetCount = String(data.associationSubnetCount || '0')
        }

        await data.associations.map(async s => {
          const sub = await this.getSubnet(s.subnetId)
          if (sub) {
            this.subnets.push({
              startIp: sub.startIp,
              endIp: sub.endIp,
              isPublic: sub.isPublic,
              availabilityZone: sub.availabilityZone,
              subnetId: ` ${sub.subnetId}`
            })
          }
        })
        return data
      } catch (e) {
        this.$alert(this.$v('등록된 정보를 찾을 수 없습니다'))
        this.$router.push({ name: 'routing-table-aws' })
        console.log(e)
      } finally {
        this.isLoading = false
      }
    },
    async getSubnet (subnetId) {
      try {
        const { data } = await API.aws.getSubnetDetail(subnetId)
        return data
      } catch (error) {
        console.log('#error', error)
      }
    },
    setIdToBreadCrumbs (id) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: id,
        path: ''
      })
    },
    showSubnetCards (e) {
      this.isShowSubnets = e
    },
    showRoutingCards (e) {
      this.isShowRoutings = e
    }
  },
  data () {
    return {
      vpcEnvironment: '',
      isLoading: false,
      isShowRoutings: true,
      isShowSubnets: true,
      routingList: [],
      routingTableData: {
      },
      subnets: [
        // {
        //   projectIdx: 10,
        //   subnetId: 'subnet-026471331283347f8',
        //   vpcId: 'vpc-0fc5e163eef389f6c',
        //   availabilityZone: 'ap-northeast-2a',
        //   availabilityZoneId: 'apne2-az1',
        //   availableIpAddressCount: 59,
        //   cidrBlock: '20.111.1.64/26',
        //   isPublic: false,
        //   defaultForAz: false,
        //   state: 'available',
        //   mapPublicIpOnLaunch: false,
        //   createTime: '2022-01-06T22:54:49',
        //   modifyDate: '2022-01-06T22:54:49',
        //   startIp: '20.111.1.64',
        //   endIp: '20.111.1.127'
        // }
      ],
      columns: [
        { binding: 'routeTableId', header: '라우팅 ID', keyPath: 'network.routingId' },
        { binding: 'routingTag', header: '라우팅 별칭', keyPath: 'network.routingTag' },
        { binding: 'associationSubnetCount', header: '연결된 서브넷 수', keyPath: 'network.connectedSubnetCount' },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId' },
        { binding: 'vpcTag', header: 'VPC 별칭', keyPath: 'network.vpcTag' },
        { binding: 'vpcCidrBlock', header: 'VPC 대역', keyPath: 'network.vpcBand' },
        { binding: 'networkAclId', header: '설정된 네트워크 ACL', keyPath: 'network.setupNetworkAcl' },
        { binding: 'projectLocation', header: '프로젝트 위치', keyPath: 'common.projectLocation' },
        { binding: 'createTime', header: '생성일', colspan: true, keyPath: 'common.createdTime' }
      ]
    }
  }
}
</script>
