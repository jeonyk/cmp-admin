<template>
  <div class="dashboard-threshold-alerm">
    <h4>
      <i class="icon" />
      {{ $v('임계치 알람') }} <!-- (임계치 알람 조회 API 필요) -->
    </h4>

    <div
      class="dashboard-threshold-alerm-table"
      v-if="thresholds.length > 0"
      v-loading="isLoading"
    >
      <div class="columns">
        <div
          v-for="{ header, binding } in columns"
          :key="binding"
        >
          <strong>{{ header }}</strong>
        </div>
      </div>
      <!-- /. header -->

      <div
        class="rows"
        v-for="(items, idx) in thresholds"
        :key="idx"
      >
        <div>
          <div
            v-for="{ binding } in columns"
            :key="`item_${binding}`"
          >
            <i
              v-if="binding === 'vm'"
              class="server-icon"
            />
            <p
              v-if="binding === 'status'"
              class="excessed"
            >
              <template v-if="items.status === 'cpu'">
                <arrow-icon />
                {{ $v('CPU 임계치 초과') }}
              </template>
              <template v-else>
                {{ items.status }}
              </template>
            </p>
            <!-- /. CPU 임계치 초과 -->
            <span v-else> {{ items[binding] }} </span>
          </div>
        </div>
      </div>
      <!-- /. data -->
    </div>
    <div
      class="rows -empty"
      v-else
    >
      데이터가 없습니다
    </div>
  </div>
</template>

<script>
import Dayjs from 'dayjs'
import DashboardArrowIcon from './DashboardArrowIcon'
import API from '@sd-fe/cmp-core'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'DashboardThresholdAlarm',
  components: {
    'arrow-icon': DashboardArrowIcon
  },
  props: {
    alarmData: {
      type: Array,
      default: () => []
    },
    groupIdx: {
      type: Object,
      default: null
    },
    selectedTab: {
      type: Object,
      default: null
    }
  },
  async mounted () {
    // await this.loadData()
  },
  watch: {
    alarmData: {
      immediate: true,
      deep: true,
      handler (alarmData) {
        // this.thresholds = alarmData
      }
    },
    thresholds: {
      immediate: true,
      deep: true,
      handler (thresholds) {
      }
    },
    groupIdx: {
      immediate: true,
      async handler (groupIdx) {
        // console.log('groupIdx:', groupIdx)
        await this.loadData()
      }
    },
    selectedTab: {
      immediate: true,
      deep: true,
      async handler (selectedTab) {
        // console.log('selectedTab:', selectedTab)
        await this.loadData()
      }
    }
  },
  methods: {
    ...mapState({
      // wholeProjectOptions: state => state.project.wholeProjectOptions
    }),
    ...mapGetters({
      // wholeProjectOptions: 'project/wholeProjectOptions'
    }),
    async getNxAlarmLimits (groupIdx) {
      try {
        const { data } = await API.compute.getNxAlarmLimits({
          groupIdx: groupIdx,
          sortType: 'ASC'
          // limit: 5
        })
        // console.log('getNxAlarmLimits:', data)
        return data
      } catch (error) {
        console.log('ERROR :getVmwareAlarmLimits()', error)
      }
    },
    async getVmwareAlarmLimits (groupIdx) {
      try {
        const { data } = await API.vmware.vm.getVmwareAlarmLimitList({
          groupIdx: groupIdx,
          sortType: 'ASC'
          // limit: 5
        })
        // console.log('getVmwareAlarmLimits:', data)
        return data
      } catch (error) {
        console.log('ERROR :getVmwareAlarmLimits()', error)
      }
    },
    async getAwsAlarmLimits (groupIdx) {
      try {
        const { data } = await API.aws.getAwsEc2CommonThresholdEx({
          groupIdx: groupIdx,
          sortType: 'ASC'
        })
        // console.log('getAwsAlarmLimits:', data)
        return data
      } catch (error) {
        console.log('ERROR :getAwsAlarmLimits()', error)
      }
    },
    async loadData () {
      // const newDate = new Date()
      // const currDate = Dayjs(newDate).format('YYYY.MM.DD HH:mm:ss')
      // const prevDate = Dayjs(currDate).subtract(1, 'month').format('YYYY-MM-DD')
      const param = {
        // companyIdx: this.companyIdx,
        ...this.groupIdx
      }

      if (param.groupIdx) {
        try {
          this.isLoading = true

          this.thresholds = [
            // { name: '서원정보', projectName: '프로젝트 A', vm: 'scsic-test-dei01', startDate: '2022-02-02' }
          ]
          const apiCallList = []
          // const alarms = await API.alarm.getAlarmInfo() // await API.compute.getThreshold({})
          if (this.selectedTab.codeVal === 'NX') {
            apiCallList.push(this.getNxAlarmLimits(param.groupIdx))
          } else if (this.selectedTab.codeVal === 'VMWARE') {
            apiCallList.push(this.getVmwareAlarmLimits(param.groupIdx))
          } else if (this.selectedTab.codeVal === 'AWS') {
            apiCallList.push(this.getAwsAlarmLimits(param.groupIdx))
          } else {
            apiCallList.push(
              this.getNxAlarmLimits(),
              this.getVmwareAlarmLimits()
            )
          }
          const allProjects = await API.iam.getProject(param)
          Promise.all([...apiCallList]).then((res) => {
            res = res.filter((resArr) => (resArr instanceof Array))
            // console.log('ThreAlarm:', this.selectedTab.codeVal, res)
            const thresholds = [].concat(...res)
            if (thresholds// .length
            ) {
              const mapped = thresholds.map((itm) => {
                const targetProject = allProjects
                  .find(_itm => {
                    // console.log('tp.itm:', itm, _itm)
                    return (
                      itm.projectIdx !== undefined &&
                      itm.projectIdx === _itm.projectIdx)
                  })
                // console.log('targetProject:', targetProject)

                let mapping = {
                  ...itm,
                  name: targetProject?.groupName || '-',
                  projectName: targetProject?.projectName || '-',
                  vm: itm.targetName || '-',
                  startTime: itm.createTime,
                  startDate: Dayjs(itm.createTime).format('YYYY.MM.DD HH:mm:ss'),
                  status: itm.alarmType
                }
                if (this.selectedTab.codeVal === 'AWS') {
                  const checklist = [
                    'cpuUtilization', // CPU 사용률
                    'diskReadBytes', // 디스크 읽기(바이트)
                    'diskReadOps', // 디스크 읽기 작업(개수)
                    'diskWriteBytes', // 디스크 쓰기(바이트)
                    'diskWriteOps', // 디스크 쓰기 작업(개수)
                    'networkIn', // 네트워크 입력(바이트)
                    'networkOut', // 네트워크 출력(바이트)
                    'networkPacketIn', // 네트워크 패킷 입력(개수)
                    'networkPacketOut', // 네트워크 패킷 출력(개수)
                    'statusCheckFailed', // 상태 검사 실패(시스템)(개수)
                    'statusCheckFailedInstance', // 상태 검사 실패(인스턴스)(개수)
                    'statusCheckFailedSystem' // 상태 검사 실패(전체)(개수)
                  ]
                  mapping = {
                    ...itm,
                    name: targetProject?.groupName || '-',
                    projectName: targetProject?.projectName || '-',
                    vm: itm.instanceId || '-',
                    startTime: itm.createTime,
                    startDate: Dayjs(itm.createTime).format('YYYY.MM.DD HH:mm:ss'),
                    status: Object.keys(itm).filter((_itm) => checklist.includes(_itm)).join()
                  }
                }
                return {
                  ...mapping
                }
              }).sort((a, b) => a.startTime > b.startTime ? -1 : 1)// .slice(0, 5)
              /*
              console.log('임계값:', mapped, res//, thresholds
              ) */
              this.thresholds = mapped
            }
          })
        } finally {
          this.isLoading = false
        }
      } else this.isLoading = false
    }
  },
  data: () => ({
    thresholds: [],
    columns: [
      { header: '조직명', binding: 'name' },
      { header: '프로젝트 명', binding: 'projectName' },
      { header: 'VM', binding: 'vm' },
      { header: '발생시간', binding: 'startDate' },
      { header: '', binding: 'status' }
    ],
    isLoading: true
  })
}
</script>

<style lang="scss" scoped>
.dashboard-threshold-alerm {
  overflow-y: scroll;
  border: 1px solid $purple-gray;
  padding: $gap;
  box-sizing: border-box;
  background-color: transparent;
  border-radius: 5px;

  h4 {
    font-size: 16px;
    margin-bottom: $gap-m;
    display: flex;
    align-items: center;
    line-height: 15px;

    .icon {
      display: inline-block;
      width: 17px; height: 15px;
      margin-right: 5px;
      background-size: contain;
      background: url('../../../assets/images/integrated-dashboard/bell.svg') no-repeat;
    }
  }

  &-table {

    .columns {
      display: grid;
      grid-template-columns: 200px 200px 200px 150px auto;
      font-size: 12px;

      strong {
        color: #9596A0;
        display: block;
        height: 38px;
        line-height: 38px;
      }
    }

    .rows {
      > div {
        display: grid;
        grid-template-columns: 200px 200px 200px 150px auto;
        border-bottom: 1px solid $purple-gray;
        transition: .3s ease background-color;

        &:last-child { border: none; }
        &:hover { background-color: $purple-gray; }

        > div {
          display: flex;
          align-items: center;
          height: 40px;
          line-height: 40px;

          > span {
            width: 210px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .server-icon {
        display: block;
        width: 15px; height: 15px;
        margin-right: $gap-s;
        background: url('../../../assets/images/integrated-dashboard/server-line.svg') no-repeat center center;
      }

      .excessed {
        border: 1px solid $main-red;
        color: $main-red;
        line-height: 20px;
        font-size: 12px;
        padding: 0 8px;
        font-style: normal;
        border-radius: 25px;
        display: flex;
        align-items: center;
        justify-content: center;

        > svg { margin-right: 5px }
      }
    }
  }
}

.rows, .-empty {
  display: flex;
  align-items: center;
    justify-content: left;
  color: $input-placeholder;
  height: calc(100% - 50px);
}
</style>
