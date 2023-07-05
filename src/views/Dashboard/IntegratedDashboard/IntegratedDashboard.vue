<template>
  <!-- 관계사 설정 가능한 중간 관리자 이상 사용 가능 -->
  <section
    class="integrated-dashboard"
    v-loading="pageLoading"
  >
    <dashboard-company-options
      @selectGroup="selectGroup"
      @filtering="filtering"
      @isLoading="doPageLoading"
    />
    <!--./ 관계사 / 조직 -->

    <div class="integrated-dashboard-wrapper">
      <article>
        <dashboard-monthly-bill
          :group-idx="search"
          @expectBillings="setExpectBillings"
        />
        <!--/. 이번달 예상 청구 금액 -->

        <div
          v-if="!isGraphLoading"
          class="chart-area"
          :style="'noborder: 1px solid #3D435E !important'"
        >
          <dashboard-billing-chart
            :is-loading="isGraphLoading"
            :data="privateData"
            :binding="[
              { name: 'Nutanix', binding: 'nutanix', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#73A1F5', stroke: '#73A1F5' }, symbolSize: 3 } },
              { name: 'VMWare', binding: 'vmware', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#16A3BF', stroke: '#16A3BF' }, symbolSize: 3 } }
            ]"
            :tooltip="['nutanix', 'vmware']"
            :tooltip-unit="'원'"
            :chart-height="280"
          />
          <dashboard-billing-chart
            :is-loading="isGraphLoading"
            :data="publicData"
            :binding="[
              { name: 'AWS', binding: 'aws', chartType: 'LineSymbols', splineStyle: { symbolStyle: { fill: '#EE9659', stroke: '#EE9659' }, symbolSize: 3 } }
            ]"
            :tooltip="['aws']"
            :tooltip-unit="'$'"
            :chart-height="250"
          />
        </div>
      </article>
      <!-- /. 산 차트 -->

      <!-- /////// -->
      <!-- /////// -->
      <!-- /////// -->

      <dashboard-csps
        @selectedTab="setSelectedTab"
      />

      <article>
        <div
          class="integrated-dashboard-counter"
        >
          <dashbaord-contents-counter
            :is-loading="isPjtCounterLoading"
            type="project"
            :labels="[this.$v('전체'), this.$v('일반'), this.$v('공통')]"
            :data="[projects.all_cnt, projects.nonshared_cnt, projects.shared_cnt]"
          />
          <dashbaord-contents-counter
            :is-loading="isVmsCounterLoading"
            type="compute"
            :labels="[this.$v('전체'), this.$v('ON'), this.$v('OFF')]"
            :data="[vms.all_cnt, vms.on_cnt, vms.off_cnt]"
          />
          <!--/. 프로젝트 수 -->
        </div>
        <dashbaord-threshold-alarm
          :group-idx="search"
          :selected-tab="targetTab"
        />
        <!--/. 임계치 알람 -->
      </article>
      <!-- /. 2 -->

      <!-- /////// -->
      <!-- /////// -->
      <!-- /////// -->

      <article>
        <dashboard-bill-top5
          :group-idx="search"
          :selected-tab="targetTab"
          :all-vm-list="allVms"
        />
        <!--/. 프로젝트별 예상 청구 금액 TOP 5 -->
        <dashboard-usage-top5
          :group-idx="search"
          :selected-tab="targetTab"
          :all-vm-list="allVms"
          @vmCounts="setVmCounts"
        />
        <!--/. 자원 사용률 TOP 5 -->
      </article>
      <!-- /////// -->
      <!-- /////// -->
      <!-- /////// -->
    </div>
  </section>
</template>

<script>
import DashboardCsps from './DashboardCsps'
import DashboardBillingChart from './DashboardBillingChart'
import DashboardCompanyOptions from './DashboardCompanyOptions'
import DashboardMonthlyBill from './DashboardMonthlyBill'
import DashboardContentsCounter from './DashboardContentsCounter'
import DashboardThresholdAlarm from './DashboardThresholdAlarm'
import DashboardBillTop5 from './DashboardBillTop5'
import DashboardUsageTop5 from './DashboardUsageTop5'
import { mapState, mapGetters, createNamespacedHelpers } from 'vuex'
// import _CMPChart from '@/components/Wijmo/CMPChart/CMPChart.vue'
// import _CMPStackedChart from '@/components/Wijmo/CMPChart/CMPStackedChart.vue'
import Dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'

/*
import axios from 'axios'
const config = {
  url: process.env.VUE_APP_ZUUL_URL
} */

const { mapMutations } = createNamespacedHelpers('cloud')

export default {
  name: 'IntegratedDashboard',
  components: {
    'dashboard-company-options': DashboardCompanyOptions,
    'dashboard-monthly-bill': DashboardMonthlyBill,
    'dashbaord-contents-counter': DashboardContentsCounter,
    'dashbaord-threshold-alarm': DashboardThresholdAlarm,
    'dashboard-bill-top5': DashboardBillTop5,
    'dashboard-usage-top5': DashboardUsageTop5,
    'dashboard-billing-chart': DashboardBillingChart,
    'dashboard-csps': DashboardCsps
    // 'cmp-stacked-chart': CMPStackedChart
  },
  async beforeCreated () {
  },
  created () {
    this.userId = this.$store.getters.user?.userId // 전체 조회?
    this.userIdx = this.$store.getters.user?.userIdx
    this.invitedProject = this.$store.state.common?.invitedProject

    this.setIsRenderCloudSwitch(false)
  },
  beforeDestroy () {
    this.setIsRenderCloudSwitch(true)
  },
  watch: {
    selectedGroup: {
      immediate: true,
      deep: true,
      async handler (selectedGroup) {
        const userInfo = await API.iam.getUserInfo({ userId: this.userId, isAdmin: true })
        this.search = {
          ...this.search, groupIdx: userInfo?.find((itm) => itm.userId === this.userId).userGroup // 11590
          // companyIdx: null
        }

        if ((selectedGroup && selectedGroup.length > 0) // && !this.usefilter
        ) {
          const targetGroup = selectedGroup[0]?.group?.groupIdx || selectedGroup[0]?.group?.companyIdx
          if (targetGroup) {
            this.search = {
              ...this.search,
              // companyIdx: selectedGroup[0]?.company?.groupIdx,
              groupIdx: targetGroup
            }
          } else console.log('selectedGroup.watch:', this.search.groupIdx)
        }
        console.log('selectedGroup.watch(else):', this.search.groupIdx)

        await this.initDashboard()
      }
    },
    expectBillings: {
      immediate: true,
      handler (expectBillings) {
        // console.log('expectBillings:', expectBillings)
        this.initDashboard()
      }
    }
  },
  computed: {
    projectCnt () {
      return [
        this.projects.all.length,
        this.projects.nonshared.length,
        this.projects.shared.length
      ]
    },
    vmCnt () {
      return [
        this.vms.all.length,
        this.vms.on.length,
        this.vms.off.length
      ]
    },
    ...mapState({
    }),
    ...mapGetters({
    })
  },
  methods: {
    async getCompute (groupIdx) {
      const data = await API.compute.getVms({
        filterChargeDate: true,
        filterDeleteDate: true,
        groupIdx: groupIdx
      })
      this.allVms = data
    },
    async getVmwareComputes (groupIdx) {
      const vmList = await API.vmware.vm.getVmwareVmList({
        groupIdx: groupIdx,
        // userId: this.user?.userId,
        isAdmin: true
      })
      this.allVms = vmList
    },
    ...mapMutations({
      setIsRenderCloudSwitch: 'SET_IS_RENDER_CLOUD_SWITCH'
    }),
    async initDashboard (selectedTab) {
      this.LineOrBar = 'Line'
      // console.log('groupIdx:', this.search.groupIdx)

      if (this.search.groupIdx) {
        // console.log('관계사 조회: ', await API.iam.getGroupList({ groupIdx: this.companyIdx }))
        const newDate = new Date()
        const startDate = Dayjs(newDate).subtract(1, 'month').format('YYYY-MM')
        const endDate = Dayjs(newDate).format('YYYY-MM')
        const param = {
          // companyIdx: this.companyIdx,
          groupIdx: this.search.groupIdx
        }

        const initGraph = []
        this.isGraphLoading = true
        try {
          // console.log('initGraph.params:', param, startDate, endDate)
          const res = // await API.billing.getRangedVmPrice({ params: param })
            /* */
            await API.billing.getBillingReportRange({
              // ...param,
              startDate: startDate,
              endDate: endDate
            })
          const nxVmdata = res
          const nutanix = nxVmdata.filter((item) => item.moduleType === 'NX')
          const vmware = nxVmdata.filter((item) => item.moduleType === 'VMWARE')
          const awsRes =
            await API.aws.getAWSBillByGroup({
            // await axios.get(`${config.url}/api/cmp/v1/aws/bill/group`, {
              // params: {
              groupIdxList: param.groupIdx,
              startDate: startDate,
              endDate: endDate
              // }
            })
          const { data } = awsRes
          const aws = data
          // console.log('initGraph.res:', nxVmdata, aws)
          const privateData = []
          const publicData = []
          /*
          vmware.push({ dateLocal: '2023-04', total: 1500 })
          aws.push({ dateLocal: '2023-05', total: 500 })
          vmware.push({ dateLocal: '2023-06', total: 400 })
          aws.push({ dateLocal: '2023-07', total: 700 }) */

          for (let i = 0; i < 12; i++) {
            const tgYear = newDate.getFullYear()
            const tgMonth = i + 1
            const dateAxisKey = `${tgMonth}`.padStart(2, '0')
            const monthData = { date: `${i === 0 ? (`${tgYear}년`) : ''}${tgMonth}월` }
            let tgNutanix = nutanix.find((itm) => { return itm.dateLocal?.split('-')[1]?.includes(dateAxisKey) })
            let tgVmware = vmware.find((itm) => itm.dateLocal?.split('-')[1]?.includes(dateAxisKey))
            const tgAws = Array.isArray(aws) && aws.find((itm) => itm.billDate?.split('-')[1]?.includes(dateAxisKey))
            if (tgMonth === newDate.getMonth() + 1) {
              tgNutanix = { total: this.expectBillings?.curr_nutanix }
              tgVmware = { total: this.expectBillings?.curr_vmware }
              // tgAws = { total: this.expectBillings?.curr_aws }
            }
            const privates = Object.assign(monthData,
              { nutanix: tgNutanix?.total ?? 0 }, { vmware: tgVmware?.total ?? 0 })
            const publics = Object.assign(monthData,
              { aws: tgAws ? tgAws?.cost : 0 })
            // console.log('initGraph.dateAxisKey:', dateAxisKey, privates, publics)
            privateData.push(privates)
            publicData.push(publics)
          }

          this.privateData = privateData.length ? privateData : [...initGraph]
          this.publicData = publicData.length ? publicData : [...initGraph]
        } catch (error) {
          // console.log('그래프 에러!!', error)
          this.privateData = initGraph
          this.publicData = initGraph
        } finally {
          this.isGraphLoading = false
        }

        this.initTabView(selectedTab)
      }
    },
    async initTabView (selectedTab) {
      if (selectedTab) this.targetTab = selectedTab

      if (this.search.groupIdx) {
        const param = {
          // companyIdx: this.companyIdx,
          groupIdx: this.search.groupIdx,
          moduleType: this.targetTab.codeVal
        }

        this.isPjtCounterLoading = true
        try {
          this.projects = { all_cnt: '0', nonshared_cnt: '0', shared_cnt: '0' }
          // const allProjects = (await API.iam.getProject({ })).filter((itm) => itm.groupIdx === this.search.groupIdx)
          // if (this.targetTab.codeVal === 'AWS') {
          // } else {
          const myProjects = // (
          // await API.iam.getProject({
          await API.iam.getProjectCount({
            ...param
            // isAdmin: false,
            // isDeleted: false
          })
          // )?.filter((itm) => itm.userIdx === this.userIdx)
          this.projects = {
            // all: myProjects,
            // nonshared: myProjects.filter((itm) => !itm.inCommon),
            // shared: myProjects.filter((itm) => itm.inCommon),

            all_cnt: myProjects.total,
            nonshared_cnt: myProjects.general,
            shared_cnt: myProjects.common
          }
          /*
          console.log('프로젝트 수: ', param, myProjects//, this.projects
          ) */
          // }
        } finally {
          this.isPjtCounterLoading = false
        }

        this.isVmsCounterLoading = true
        try {
          this.vms = { all_cnt: '0', on_cnt: '0', off_cnt: '0' }
          /*
          const allVms = await API.compute.getVms({
            ...param
          })
          this.vms = {
            all: allVms,
            on: allVms.filter((itm) => itm.powerState === 'ON'),
            off: allVms.filter((itm) => itm.powerState === 'OFF')
          } */
          if (this.targetTab.codeVal === 'NX') {
            const nxVmCount = await API.compute.getVmCount({ ...param }).then((res) => res.data)
            this.vms = {
              all_cnt: `${nxVmCount?.userAllVms}`,
              on_cnt: `${nxVmCount?.vmOnCnt}`,
              off_cnt: `${nxVmCount?.vmOffCnt}`
            }
          } else if (this.targetTab.codeVal === 'VMWARE') {
            const vmwVmCount = await API.vmware.vm.getVmCount({ ...param }).then((res) => res.data)
            this.vms = {
              all_cnt: `${vmwVmCount?.vmCnt}`,
              on_cnt: `${vmwVmCount?.onCnt}`,
              off_cnt: `${vmwVmCount?.offCnt}`
            }
          } else if (this.targetTab.codeVal === 'AWS') {
            const awsEcCount = await API.aws.getProjectEcCount({ ...param }).then((res) => res.data)
            this.vms = {
              all_cnt: `${awsEcCount?.powerOn + awsEcCount?.powerOff}`,
              on_cnt: `${awsEcCount?.powerOn}`,
              off_cnt: `${awsEcCount?.powerOff}`
            }
            // console.log('VM/EC 수: ', awsEcCount)
          }
        } finally {
          this.isVmsCounterLoading = false
        }

        if (this.targetTab === 'NX') this.getCompute()
        if (this.targetTab === 'VMWARE') this.getVmwareComputes()
      }
    },
    selectGroup (group) {
      // console.log('selectedGroup.emit:', group)
      this.selectedGroup = group
    },
    filtering (doFilter) {
      // console.log('filtering.emit:', doFilter)
      this.usefilter = doFilter
    },
    doPageLoading (cond) {
      // console.log('doPageLoading.emit:', cond)
      this.pageLoading = cond
    },
    setExpectBillings (expectBillings) {
      this.expectBillings = expectBillings
    },
    setSelectedTab (selectedTab) {
      // console.log('setSelectedTab:', selectedTab)
      this.initTabView(selectedTab)
    },
    setVmCounts (vmcounts) {
      // console.log('setVmCounts:', vmcounts)
    }
  },
  data: () => ({
    allVms: [],
    userId: null,
    userIdx: null,
    invitedProject: null,
    search: {
      groupIdx: null,
      companyIdx: null
    },
    usefilter: false,
    selectedGroup: null,
    monthlyBilling: {
      prev_sum: 0,
      prev_nutanix: 0,
      prev_vmware: 0,
      prev_aws: 0,
      curr_sum: 0,
      curr_nutanix: 0,
      curr_vmware: 0,
      curr_aws: 0
    },
    projects: {
      all: [],
      nonshared: [],
      shared: [],
      all_cnt: 0,
      nonshared_cnt: 0,
      shared_cnt: 0
    },
    vms: {
      all: [],
      on: [],
      off: [],
      all_cnt: 0,
      on_cnt: 0,
      off_cnt: 0
    },
    alarms: [],
    billTopFive: [], // 프로젝트별 예상 청구 금액 TOP 5
    nxUsageTopFive: { // 자원 사용률 TOP 5
      vcpu: [],
      memory: [],
      disk: []
    },
    vmwUsageTopFive: {
      vcpu: [],
      memory: [],
      disk: []
    },
    awsUsageTopFive: {
      vcpu: [],
      memory: [],
      disk: []
    },
    publicData: [],
    privateData: [],
    expectBillings: null,
    isGraphLoading: true,
    isPjtCounterLoading: false,
    isVmsCounterLoading: false,
    pageLoading: false,
    targetTab: {}
  })
}
</script>

<style lang="scss" scoped>
.integrated-dashboard {
  &-wrapper {

    > article {
      display: grid;
      grid-template-columns: 420px auto;
      column-gap: 40px;
      margin-bottom: 60px;

      // &:nth-child(1) { grid-template-rows: 380px }
      &:nth-child(2) { width: 100% !important; }
      &:nth-child(3) { grid-template-rows: 315px; margin-bottom: 65px }
      &:nth-child(4) { grid-template-rows: 490px }
    }

    .set-option {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      // margin-bottom: 15px;

      .legends {
        display: flex;
        align-items: center;
        //margin-right: $gap-m;
        margin-right: 35px;

        li {
          display: flex;
          align-items: center;
          margin-left: $gap;
        }

        .circle {
          display: block;
          width: 15px; height: 15px;
          border-radius: 50%;
          margin-right: 5px;
          box-sizing: border-box;
        }
      }
    }
  }

  .radio-switch-group {
    &::v-deep {
      height: 30px;

      input:checked + span {
        height: 27px;
      }

      span {
      }

      .el-radio-button.is-active
      .el-radio-button__inner:hover { color: #333; }
    }
  }

  &-counter {
    display: grid;
    row-gap: 15px;
  }
}

</style>
