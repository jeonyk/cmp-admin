<template>
  <div class="network-vpc-detail">
    <dashboard-panel
      v-loading="isLoading"
      :title="$t('bill.basicInfo')"
      :padding-top="0"
    >
      <vertical-table
        :data="vpcData"
        :columns="columns"
        type="horizontal"
      >
        <template #state="{row}">
          <span style="text-transform: capitalize;">
            {{ row.state }}
          </span>
        </template>
        <template #associateSubnetCount="{row}">
          <span>{{ row.associateSubnetCount }} 개</span>
        </template>
      </vertical-table>
    </dashboard-panel>

    <content-foldable
      v-loading="isCardLoading"
      style="margin-top: 30px;"
      :title="$v('서브넷 연결 정보')"
      :length="subnets.length"
      @close="showSubnets"
    >
      <template v-if="subnets && subnets.length">
        <transition name="slide">
          <div v-if="showSubnetList">
            <ul style="display: flex; gap: 10px">
              <subnet-card
                v-for="subnet in subnets"
                :data="subnet"
                :key="subnet.subnetId"
              />
            </ul>
          </div>
        </transition>
      </template>
      <!-- <template v-if="!showSubnetList && subnets && !subnets.length">
        <p style="text-align: center; font-size: 20px" />
      </template> -->
    </content-foldable>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import SubnetCard from '@/components/NetworkAws/SubnetCard.vue'
import ContentFoldable from '@/components/NetworkAws/ContentFoldable.vue'

import { mapGetters } from 'vuex'
export default {
  components: {
    VerticalTable,
    SubnetCard,
    ContentFoldable,
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
    setIdToBreadCrumbs (id) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: id,
        path: ''
      })
    },
    fetch () {
      this.fetchVpc()
      this.fetchSubnet(this.$route.params.id)
    },
    async fetchVpc () {
      this.vpcData = await this.getVpcDetail(this.$route.params.id)
      this.vpcData.associateSubnetCount = String(this.vpcData.associateSubnetCount)
      this.vpcData.environment = this.$options.filters.typeCategory(this.vpcData.environment)

      const projectInfo = this.getProject(this.vpcData.projectIdx)
      if (projectInfo) {
        const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
        this.vpcData.projectLocation = location
        this.vpcData.vpcTag = this.$options.filters.vpcTag(projectInfo.projectName, this.vpcData.environment)
      }
      // await this.getVpcTag(this.vpcData)
      await this.convertTimeFormat(this.vpcData)
    },
    async fetchSubnet (id) {
      this.subnets = await this.getSubnet({ vpcId: id })
      console.log('#subnet', this.subnets)
    },
    // getVpcTag (vpc) {
    //   vpc.vpcTag = this.$options.filters.vpcTag('프로젝트명', vpc.environment)
    // },
    convertTimeFormat (object) {
      object.createDate = this.$options.filters.date(object.createTime)
    },
    async getVpcDetail (id) {
      try {
        this.isLoading = true
        const response = await API.aws.getVpcDetail(id)
        return response.data
      } catch (error) {
        console.log(error)
        // 에러 발생 시 목록
        return this.$router.replace({ name: 'vpc-aws' })
      } finally {
        this.isLoading = false
      }
    },
    async getSubnet (payload) {
      try {
        this.isCardLoading = true
        const res = await API.aws.getSubnet(payload)
        console.log('@getSubnet :', res)
        return res.data
      } catch (error) {
        console.log('@error : ', error)
      } finally {
        this.isCardLoading = false
      }
    },
    showSubnets (e) {
      this.showSubnetList = e
    }
  },
  data () {
    return {
      isLoading: false,
      isCardLoading: true,
      projectIdx: null,
      subnets: [],
      showSubnetList: true,
      tempData: null,
      vpcData: null,
      columns: [
        { binding: 'vpcId', header: this.$v('VPC ID') },
        { binding: 'vpcTag', header: this.$v('VPC 별칭') },
        { binding: 'regionDisplayName', header: this.$v('리전 정보') },
        { binding: 'associateSubnetCount', header: this.$v('서브넷 개수') },
        { binding: 'environment', header: this.$v('VPC 망 분류') },
        { binding: 'cidrBlock', header: this.$v('VPC 대역') },
        { binding: 'networkAclId', header: this.$v('네트워크 ACL') },
        { binding: 'state', header: this.$v('VPC 연결상태') },
        { binding: 'createDate', header: this.$v('생성일') },
        { binding: 'projectLocation', header: this.$v('프로젝트 위치') }
      ]
    }
  }
}
</script>

<style scoped>
.card-list {
  display: flex;
  gap: 10px;
}
.no-data-text {
  text-align: center;
  font-size: 20px;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter,
.slide-leave-to {
  transform: translateY(-0px);
  opacity: 0;
}
</style>
