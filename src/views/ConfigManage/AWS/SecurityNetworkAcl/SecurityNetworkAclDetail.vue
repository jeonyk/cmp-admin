<template>
  <div>
    <dashboard-panel
      :title="$v('기본 정보')"
      :padding-top="0"
    >
      <vertical-table
        v-loading="isLoading"
        :columns="columns"
        :data="aclData"
        type="horizontal"
      >
        <template #createDate>
          <span v-if="aclData.createTime">{{ aclData.createTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 생성 시간 -->
      </vertical-table>
    </dashboard-panel>
    <content-foldable
      style="margin-top:30px;"
      :title="$v('서브넷 연결 정보')"
      :length="subnets.length"
      @close="showSubnets"
      v-loading="isCardLoading"
    >
      <template v-if="subnets && subnets.length">
        <transition name="slide">
          <div v-if="showSubnetList">
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
    </content-foldable>
    <content-foldable
      style="margin-top:30px;"
      :title="$v('인바운드 규칙')"
      :length="inbounds.length"
      @close="toggleInbounds"
      v-loading="isBoundLoading"
    >
      <template v-if="inbounds && inbounds.length">
        <transition name="slide">
          <div v-if="showInboundList">
            <ul style="">
              <bound-row-card
                v-for="bound in inbounds"
                :key="bound.ruleNumber"
                :data="bound"
                style="margin-bottom:10px;"
              />
            </ul>
          </div>
        </transition>
      </template>
    </content-foldable>
    <content-foldable
      style="margin-top:30px;"
      :title="$v('아웃바운드 규칙')"
      :length="outbounds.length"
      @close="toggleOutbounds"
      v-loading="isBoundLoading"
    >
      <template v-if="outbounds && outbounds.length">
        <transition name="slide">
          <div v-if="showOutboundList">
            <ul>
              <bound-row-card
                v-for="bound in outbounds"
                :key="bound.ruleNumber"
                :data="bound"
                style="margin-bottom:10px;"
              />
            </ul>
          </div>
        </transition>
      </template>
    </content-foldable>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import SubnetCard from '@/components/NetworkAws/SubnetCard.vue'
import ContentFoldable from '@/components/NetworkAws/ContentFoldable.vue'
import BoundRowCard from '@/components/NetworkAws/BoundRowCard.vue'

import { mapGetters } from 'vuex'
export default {
  components: {
    VerticalTable,
    SubnetCard,
    ContentFoldable,
    BoundRowCard,
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
  created () {
    this.isLoading = true
    this.isCardLoading = true
    this.isBoundLoading = true
    // this.fetch()
    // this.setIdToBreadCrumbs(this.$route.params.id)
  },
  methods: {
    async fetch () {
      await this.fetchAcl()
      await this.fetchSubnet()
      await this.fetchBoundRule()
    },
    fetchBoundRule () {
      this.inbounds = this.aclData.entries.filter(rule => rule.egress)
      this.outbounds = this.aclData.entries.filter(rule => !rule.egress)
    },
    async fetchAcl () {
      this.aclData = await this.getNetworkAcl(this.$route.params.id)
      this.aclData.associationSubnetCount = String(this.aclData.associationSubnetCount || 0)

      const projectInfo = this.getProject(this.aclData.projectIdx)
      if (projectInfo) {
        const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
        this.aclData.projectLocation = location
        this.aclData.networkAclTag = this.$options.filters.networkAclTag(projectInfo.projectName)
      }
    },
    async getNetworkAcl (id) {
      try {
        const res = await API.aws.getNetworkAclDetail(id)
        return res
      } catch (e) {
        console.log(e)
      } finally {
        this.isLoading = false
        this.isBoundLoading = false
      }
    },
    async fetchSubnet () {
      const vpcId = this.aclData.vpcId
      this.subnets = await this.getSubnet({ vpcId: vpcId })
      // 서브넷 조회 오류 발생
    },
    async getSubnet (payload) {
      try {
        const res = await API.aws.getSubnet(payload)
        return res.data
      } catch (error) {
        console.log('@error : ', error)
      } finally {
        this.isCardLoading = false
      }
    },
    setIdToBreadCrumbs (id) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: id,
        path: ''
      })
    },
    showSubnets (e) {
      console.log('@showSubnets : ', e)
      this.showSubnetList = e
    },
    toggleInbounds (e) {
      this.showInboundList = e
    },
    toggleOutbounds (e) {
      this.showOutboundList = e
    }
  },
  data () {
    return {
      isCardLoading: false,
      isLoading: false,
      isSubnetLoading: false,
      isBoundLoading: false,
      aclData: {},
      showSubnetList: true,
      showInboundList: true,
      showOutboundList: true,
      inbounds: [],
      outbounds: [],
      subnets: [],
      columns: [
        { binding: 'networkAclId', header: 'Network ACL ID', keyPath: 'network.networkAclId' },
        { binding: 'networkAclTag', header: 'Network ACL 별칭', keyPath: 'network.networkAclTag' },
        { binding: 'vpcId', header: '연결된 VPC', keyPath: 'network.connectedVpc' },
        { binding: 'projectLocation', header: '프로젝트 위치', keyPath: 'common.projectLocation' },
        { binding: 'associationSubnetCount', header: '연결된 서브넷 수', keyPath: 'network.connectedSubnetCount' },
        { binding: 'createDate', header: '생성일', keyPath: 'common.createdTime' }
      ]
    }
  }
}
</script>
