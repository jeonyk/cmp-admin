<template>
  <div
    class="dashboard-usage-top5"
    v-loading="isLoading"
  >
    <div class="flex-wrap">
      <h4 class="flex-itm">
        {{ $v('VM별 자원 사용률 TOP 5') }} <!-- (사용량/Capa 데이터 추가 필요) -->
      </h4>
      <el-select
        class="flex-itm"
        v-model="cloudList.cloudCode"
        :placeholder="$v('선택하세요')"
        :popper-append-to-body="false"
        @change="cloudChange"
        hidden
      >
        <el-option
          v-for="item in cloudList"
          :key="item.cloudCode"
          :label="item.cloudName"
          :value="item.cloudCode"
        />
      </el-select>
    </div>

    <div
      class="dashboard-usage-top5-contents"
    >
      <div
        class="type"
        v-for="{ title, key } in types"
        :key="key"
      >
        <div :class="['icon', key]" />
        <strong class="title">{{ title }}</strong>
        <!-- /. 중분류 정보 -->

        <span
          v-if="topUsages[key] === undefined || (topUsages[key] && topUsages[key].length === 0)"
          class="dashboard-usage-top5-detail -empty"
        >
          {{ $v('데이터가 없습니다.') }}
        </span>
        <!-- /. 데이터가 없을 때 -->

        <ul
          v-else
          class="dashboard-usage-top5-detail"
        >
          <li
            v-for="(item, idx) in topUsages[key]"
            :key="idx"
          >
            <a @click="goVmDetail(item)">
              <div class="info">
                <p class="text">
                  <strong class="index">{{ idx + 1 }}</strong>
                  <strong class="name">{{ item.name }}</strong>
                </p>

                <span :class="{ 'value': idx === 0 }">{{ item.value.toFixed(3) }}/{{ item.total }}%</span>
              </div>

              <div class="degree">
                <i :style="`width: ${ (item.value / item.total) * 100 }%`" />
              </div>
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
// import { goToResourceDetail } from '@/components/Utils/CurrentResourceGoToDetail'

/*
import axios from 'axios'
const config = {
  url: process.env.VUE_APP_ZUUL_URL
} */

export default {
  name: 'DashboardUsageTop5',
  props: {
    usageData: { // { vcpu: [...], memory: [...], disk: [...] } 형식의 데이터
      type: Object,
      default: () => {}
    },
    groupIdx: {
      type: Object,
      default: null
    },
    selectedTab: {
      type: Object,
      default: null
    },
    allVmList: {
      type: Array,
      default: () => []
    }
  },
  async mounted () {
    // await this.loadData(null)

    this.cloudList = [
      {
        cloudCode: '',
        cloudName: '전체'
      },
      {
        cloudCode: 'nutanix',
        cloudName: 'nutanix'
      },
      {
        cloudCode: 'vmware',
        cloudName: 'vmware'
      },
      {
        cloudCode: 'aws',
        cloudName: 'aws'
      }
    ]
  },
  watch: {
    usageData: {
      immediate: true,
      deep: true,
      handler (usageData) {
        // this.topUsages = usageData
      }
    },
    topUsages: {
      immediate: true,
      deep: true,
      handler (topUsages) {
      }
    },
    groupIdx: {
      immediate: true,
      deep: true,
      async handler (groupIdx) {
        // console.log('groupIdx:', groupIdx)
        await this.loadData(null)
      }
    },
    selectedTab: {
      immediate: true,
      deep: true,
      async handler (selectedTab) {
        // console.log('selectedTab:', selectedTab)
        await this.loadData(null)
      }
    }
  },
  methods: {
    async getEc2Usages (groupIdx) {
      const params = {
        groupIdx: groupIdx,
        sortType: 'DESC'
      }
      const cpu = await API.aws.getEc2CpuUsage({
        ...params
      })

      const disk = await API.aws.getEc2DiskUsage({
        ...params
      })

      const network = await API.aws.getEc2DiskUsage({
        ...params
      })

      const convertedEc2Cpu = cpu.data.map(x => {
        return {
          ...x,
          name: x.instanceId,
          usagePpm: x.cpuUtilization
        }
      })

      const convertedDiskCpu = disk.data.map(x => {
        return {
          ...x,
          name: x.instanceId,
          usagePpm: x.diskOps
        }
      })

      const convertedNetwork = network.data.map(x => {
        return {
          ...x,
          name: x.instanceId,
          usagePpm: x.diskOps
        }
      })

      this.getUsageVms(convertedEc2Cpu, 'vcpu', 'AWS')
      this.getUsageVms(convertedDiskCpu, 'disk', 'AWS')
      this.getUsageVms(convertedNetwork, 'memory', 'AWS')
    },
    async getVmwareVmUsages (groupIdx) {
      const body = {
        // limit: 5,
        groupIdx: groupIdx,
        sortType: 'DESC'
      }
      const cpu = await API.compute.getVmwareCpuRank(body)
      const memory = await API.compute.getVmwareMemoryRank(body)
      const disk = await API.compute.getVmwareDiskRank(body)

      this.getUsageVms(cpu.data, 'vcpu', 'VMWARE')
      this.getUsageVms(memory.data, 'memory', 'VMWARE')
      this.getUsageVms(disk.data, 'disk', 'VMWARE')
    },
    async getNutanixVmUsages (groupIdx) {
      const body = {
        // limit: 5,
        groupIdx: groupIdx,
        sortType: 'DESC'
      }
      const cpu = await API.compute.getVmCpuRank(body)
      const memory = await API.compute.getVmMemoryRank(body)
      const disk = await API.compute.getVmDiskRank(body)

      this.getUsageVms(cpu.data, 'vcpu')
      this.getUsageVms(memory.data, 'memory')
      this.getUsageVms(disk.data, 'disk')
    },
    // vCpu: x.hypervisorCpuUsagePpm / 10000
    getUsageVms (data, standardName, csp) {
      const result = []
      const sorted = data.sort((a, b) => a.usagePpm > b.usagePpm ? -1 : 1).slice(0, 5)
      for (const key of sorted) {
        let value
        if (csp === 'VMWARE') {
          this.vmCounts.vmware = data.length
          value = {
            vcpu: key.usagePpm < 0 ? 0 : key.usagePpm,
            memory: key.usagePpm < 0 ? 0 : key.usagePpm,
            disk: key.usagePpm < 0 ? 0 : key.usagePpm
          }[standardName]
        } else {
          this.vmCounts.nutanix = data.length
          value = {
            vcpu: key.usagePpm < 0 ? 0 : key.usagePpm / 10000,
            memory: key.usagePpm < 0 ? 0 : key.usagePpm / 10000,
            disk: key.usagePpm < 0 ? 0 : key.usagePpm / 10000
          }[standardName]
        }
        result.push({
          vmUuid: key.vmUuid,
          name: key.vmName,
          value: value,
          total: 100
        })
      }

      this.$emit('vmCounts', this.vmCounts)
      this.$set(this.vmsUsages, standardName, result)
    },
    goVmDetail (data) {
      try {
        let selectedVm, routePath
        if (this.selectedTab.codeVal === 'NX') {
          selectedVm = this.allVmList?.find(vm => vm.vmUuid === data.vmUuid)
          // routePath = 'set-resource-server-detail'
          // routePath = 'set-resource-server'
        } else if (this.selectedTab.codeVal === 'VMWARE') {
          selectedVm = this.allVmList?.find(vm => vm.vmUuid === data.vmUuid)
          // routePath = 'set-resource-server-detail-vmw'
          // routePath = 'set-resource-server-vmw'
        }
        console.log('routeTo:', routePath, selectedVm)
        // if (!selectedVm) return
        /*
        goToResourceDetail(
          selectedVm,
          { resource: 'userVmIdx', order: 'orderDataIdx', basket: 'basketIdx' },
          routeName
        ) */
        this.$router.push({ name: routePath })
      } catch (error) {
        console.log(error)
      }
    },
    async loadData (filter) {
      this.vmsUsages = []
      const param = {
        // companyIdx: this.companyIdx,
        ...this.groupIdx
      }

      if (param.groupIdx) {
        try {
          this.isLoading = true
          if (this.selectedTab.codeVal === 'NX') {
            // this.getCompute(param.groupIdx)
            this.getNutanixVmUsages(param.groupIdx)
          } else if (this.selectedTab.codeVal === 'VMWARE') {
            // this.getVmwareComputes(param.groupIdx)
            this.getVmwareVmUsages(param.groupIdx)
          } else if (this.selectedTab.codeVal === 'AWS') {
            this.getEc2Usages(param.groupIdx)
          } else {
            this.getNutanixVmUsages()
            this.getVmwareVmUsages()
            this.routePath = ''
          }
          this.topUsages = this.vmsUsages
          // console.log('usageTop5: ', this.selectedTab.codeVal, this.vmsUsages)
        } finally {
          this.isLoading = false
        }
      } else this.isLoading = false
    },
    cloudChange (selected) {
      this.loadData(selected)
    }
  },
  data: () => ({
    vmsUsages: [],
    topUsages: {
      vcpu: [],
      memory: [],
      disk: []
    },
    vmCounts: {
      nutanix: 0,
      vmware: 0,
      aws: 0
    },
    types: [
      { title: 'vCPU', key: 'vcpu' },
      { title: 'Memory', key: 'memory' },
      { title: 'Disk', key: 'disk' }
    ],
    cloudList: [],
    isLoading: true
  })
}
</script>

<style lang="scss" scoped>
.dashboard-usage-top5 {

  h4 {
    font-size: 16px;
    margin-bottom: $gap;
  }

  &-contents {
    border-radius: $radius-m;
    background-color: $panel-bg;
    padding: $gap $gap-m;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 410px;
    column-gap: 70px;
  }

  .type {
    position: relative;

    .icon {
      width: 50px; height: 50px;
      position: absolute;
      top: 0; right: 0;
      opacity: 0.2;

      &.vcpu { background: url('../../../assets/images/integrated-dashboard/semiconductor.svg') no-repeat center; }
      &.memory { background: url('../../../assets/images/integrated-dashboard/ram.svg') no-repeat center; }
      &.disk { background: url('../../../assets/images/integrated-dashboard/server.svg') no-repeat center; }
    }

    .title {
      display: block;
      line-height: 50px;
      height: 50px;
    }
  }

  &-detail {

    &.-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: $input-placeholder;
      height: calc(100% - 50px);
    }

    > li {
      margin-top: $gap-m;

      a { display: block; }

      .info {
        display: flex;
        align-items: center;
        color: $white;
        justify-content: space-between;
        margin-bottom: $gap-s;

        .index {
          border: 1px solid transparent;
          display: block;
          width: $gap; height: $gap;
          line-height: $gap;
          text-align: center;
          margin-right: $gap-s;
        }

        .text {
          display: flex;
          align-items: center;
        }

        .name {
          display: block;
          width: 130px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .value { font-weight: 700; }
      }

      .degree {
        background-color: #E1E1E1;
        border-radius: 25px;
        height: 10px;
        overflow: hidden;

        i {
          background: linear-gradient(270deg, #174489 -3.91%, #2378FA 101.74%);
          display: block;
          height: 100%;
          border-radius: 25px;
        }
      }
    }
  }

  .flex-wrap {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    .flex-itm:nth-child(2) {
      width: 120px;
      margin-right: 30px;
      margin-bottom: 15px;
    }
  }
}
</style>
