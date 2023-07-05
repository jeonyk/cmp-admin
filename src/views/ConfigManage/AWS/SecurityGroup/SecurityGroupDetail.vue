<template>
  <div>
    <dashboard-panel
      :title="$v('기본 정보')"
      :padding-top="0"
    >
      <vertical-table
        :columns="columns"
        :data="groupData"
        type="horizontal"
      />
    </dashboard-panel>

    <content-foldable
      style="margin-top:30px;"
      :title="$v('인바운드 규칙')"
      :length="inbounds.length"
    >
      <ul class="card-wrapper">
        <bound-card
          v-for="inbound in inbounds"
          :data="inbound"
          :key="inbound.id"
        />
      </ul>
    </content-foldable>

    <content-foldable
      style="margin-top:30px;"
      :title="$v('아웃바운드 규칙')"
      :length="outbounds.length"
    >
      <ul class="card-wrapper">
        <bound-card
          v-for="outbound in outbounds"
          :data="outbound"
          :key="outbound.id"
        />
      </ul>
    </content-foldable>
  </div>
</template>

<script>
import API, { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import ContentFoldable from '@/components/NetworkAws/ContentFoldable'

import { mapGetters } from 'vuex'
export default {
  components: {
    VerticalTable,
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
    async fetch () {
      this.fetchSecurityGroup()
      this.clonedList = cloneDeep(this.dataList)
    },
    async fetchSecurityGroup () {
      this.groupData = await this.getSecurityGroup(this.$route.params.id)
      this.groupData.createDate = this.$options.filters.date(this.groupData.createTime)

      const projectInfo = this.getProject(this.groupData.projectIdx)
      if (projectInfo) {
        const location = `${projectInfo.companyName} > ${projectInfo.groupName} > ${projectInfo.projectName}`
        this.groupData.projectLocation = location
        this.groupData.groupTag = this.$options.filters.securityGroupTag(projectInfo.projectName)
      }
      this.groupData.securityGroupRuleDtoList = this.groupData.securityGroupRuleDtoList
        .map(rule => {
          return {
            ...rule,
            id: rule.ruleId,
            title: rule.ruleType,
            desc: rule.ruleDescription,
            isEgress: rule.isEgress
          }
        })
      this.inbounds = this.groupData.securityGroupRuleDtoList.filter(rule => !rule.isEgress)
      this.outbounds = this.groupData.securityGroupRuleDtoList.filter(rule => rule.isEgress)
    },
    async getSecurityGroup (id) {
      try {
        this.isLoading = true
        const res = await API.aws.getDetailSecurityGroup(id)
        console.log('@SecurityGroup:', res.data)
        return res.data
      } catch (error) {
        console.log(error)
        console.log(error.message)
      } finally {
        this.isLoading = false
      }
    },
    showOutbounds (e) {
      this.isShowOutbounds = e
    }
  },
  data () {
    return {
      groupData: {},
      isShowInbounds: true,
      inbounds: [],
      isShowOutbounds: true,
      outbounds: [],
      columns: [
        { binding: 'groupId', header: '보안그룹 ID', keyPath: 'network.securityGroupId' },
        { binding: 'groupTag', header: '보안그룹명', keyPath: 'network.securityGroupName' },
        { binding: 'vpcId', header: 'VPC ID', keyPath: 'network.vpcId' },
        { binding: 'description', header: '보안그룹 설명', keyPath: 'network.securityGroupDescription' },
        { binding: 'createDate', header: '생성일', keyPath: 'common.createdTime' },
        { binding: 'projectLocation', header: '프로젝트 위치', keyPath: 'common.projectLocation' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.card-wrapper {
  display:flex;
  gap:20px;
  flex-direction: row;
  flex-wrap:wrap;
}
</style>
