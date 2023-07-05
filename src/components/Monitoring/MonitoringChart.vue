<template>
  <div
    v-loading="isLoadingGetData"
    class="monitor-chart"
    :class="{ loading: isLoadingGetData }"
  >
    <div class="monitor-chart-header">
      <div class="monitor-chart-header__sync">
        <el-radio-group
          v-model="activeTabGroup"
          class="scope-radio-group radio-group type-a"
        >
          <el-radio-button :label="1">
            Nutanix
          </el-radio-button>
          <el-radio-button
            :label="2"
            disabled
          >
            <el-tooltip
              effect="light"
              content="사용하지 않는 솔루션입니다."
            >
              <span>Zabbix</span>
            </el-tooltip>
          </el-radio-button>
          <el-radio-button
            :label="3"
            disabled
          >
            <el-tooltip
              effect="light"
              content="사용하지 않는 솔루션입니다."
            >
              <span>polestar</span>
            </el-tooltip>
          </el-radio-button>
        </el-radio-group>
        <button
          v-if="!syncing"
          class="button refresh-btn"
          type="is-primary"
          @click="onClickSync"
        >
          {{ syncDate }}
          <refresh-full-icon
            :width="12"
            :height="12"
            class="refresh-btn-icon"
          />
        </button>
        <button
          v-else
          class="button syncing-btn"
          type="is-primary"
        >
          {{ $v('동기화 중') }}
          <pending-icon class="syncing-btn-icon" />
        </button>
      </div>
      <div class="monitor-chart-header__filter">
        <monitoring-chart-filter
          :vm-idx="vmIdx"
          :threshold="thresholdMap"
          :start-date.sync="filterStartDate"
          :end-date.sync="filterEndDate"
          @change="onChangeFilter"
          @change-custom-date="onChangeCustomFilter"
          @full-update="onFullUpdate"
        />
      </div>
    </div>
    <div
      v-if="chartData.length && !isLoadingGetData"
      class="monitor-chart-body"
    >
      <monitoring-chart-item
        v-for="(v, k) in chartMapData"
        :key="k"
        :data="v"
        :binding-key="k"
        :header="findHeader(k).name"
        :threshold="thresholdMap[k] || 0"
      />
    </div>
    <div
      v-else-if="!chartData.length"
      class="no-data-wrap"
    >
      <div class="empty-data">
        데이터가 없습니다.
      </div>
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import MonitoringChartFilter from './MonitoringChartFilter.vue'
import MonitoringChartItem from './MonitoringChartItem.vue'
import { diffHours } from './FilterUtil'
import dayjs from 'dayjs'
import RefreshFullIcon from '../Icons/RefreshFullIcon.vue'
import PendingIcon from '../Icons/ThreeDotPendingIcon.vue'

export default {
  name: 'MonitoringChart',
  components: {
    MonitoringChartFilter,
    MonitoringChartItem,
    RefreshFullIcon,
    PendingIcon
  },
  props: {
    /**
     * 모니터링 데이터 조회할 vm의 idx
     */
    vmIdx: {
      type: [Number, String],
      required: true
    }
  },
  watch: {
    filterStartDate (date) {
      this.calculateInterval()
      this.getMonitoringData()
    }
  },
  computed: {
    syncing () {
      return this.isLoadingGetData
    }
  },
  created () {
    this.getMonitoringData()
    this.getThreshold()
  },
  methods: {
    /**
     * X값 계산
     */
    getAxisDate (time) {
      const startDate = new Date(this.filterStartDate).getTime()
      const endDate = new Date(this.filterEndDate).getTime()
      const distance = (endDate - startDate) / 1000 / 60 / 60

      if (distance < 24) {
        // 필터링 시간이 24시간 미만일 경우
        return dayjs(new Date(time)).format('HH:mm')
      } else if (distance >= 24 && distance < 865) {
        // 필터링 시간이 24시간 이상/365일 미만일 경우
        return dayjs(new Date(time)).format('MM/DD HH:mm')
      } else {
        return dayjs(new Date(time)).format('YYYY/MM/DD HH:mm')
      }
    },
    /**
     * 인터벌 계산
     */
    calculateInterval () {
      const startDate = dayjs(this.filterStartDate)
      const endDate = dayjs(this.filterEndDate)

      const diff = endDate.diff(startDate, 'seconds', true)

      if (diff <= 3600) {
        this.interval = 60
      } else if (diff > 3600 && diff <= 86400) {
        this.interval = 3600
      } else {
        this.interval = 86400
      }
    },
    onFullUpdate () {
      this.getMonitoringData()
      this.getThreshold()
    },
    /**
     * 동기화 버튼 클릭 이벤트
     */
    onClickSync () {
      this.getMonitoringData()
    },
    /**
     * 차트 제목 찾기
     */
    findHeader (keyName) {
      return this.nxBindingKeys.find(key => key.value === keyName)
    },
    /**
     * 차트 데이터 세팅
     */
    setChartData (chartData) {
      this.nxBindingKeys.forEach(key => {
        this.$set(
          this.chartMapData,
          key.value,
          chartData.map(data => {
            let value = parseInt(data[key.value]) || 0
            if (value < 0) value = 0

            const ppmKeys = ['hypervisorCpuUsagePpm', 'memoryUsagePpm']

            if (ppmKeys.includes(key.value) && value > 0) {
              value = value / 10000
            }

            if (key.value === 'controllerAvgIoLatencyUsecs' && value > 0) {
              // 컨트롤러 평균 I/O 지연율 (ms)의 경우
              // IOPS를 ms로 변경하고 소수점 2자리까지 표현함
              value = value / 1000
            }

            return {
              // x: dayjs(new Date(data.createTime)).format('HH:mm'),
              x: this.getAxisDate(data.createTime),
              [key.value]: value,
              raw: data
            }
          })
        )
      })
    },
    async getMonitoringData () {
      if (this.isLoadingGetData) return

      try {
        this.isLoadingGetData = true

        const defaultFilterDate = diffHours(new Date(), 1, true)
        const nowDate = dayjs().format('YYYY-MM-DD HH:mm')

        const { data } = await API.compute.getVmStats(this.vmIdx, {
          startDate: this.filterStartDate || defaultFilterDate,
          endDate: this.filterEndDate || nowDate,
          interval: this.interval || 60
        })
        this.chartData = data
        this.setChartData(data)
        if (data.length) {
          this.syncDate = dayjs(
            new Date(data[data.length - 1].createTime)
          ).format('YYYY-MM-DD HH:mm')
        } else {
          this.syncDate = dayjs().format('YYYY-MM-DD HH:mm')
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingGetData = false
      }
    },
    async getThreshold () {
      try {
        const { data } = await API.compute.getThreshold(this.vmIdx)
        // const data = {
        //   controllerAvgIoLatencyThreshold: 0,
        //   controllerIoBandwidthThreshold: 20,
        //   controllerIopsThreshold: 20,
        //   cpuThreshold: 20,
        //   diskThreshold: 20,
        //   memoryThreshold: 20,
        //   networkReceivedRateThreshold: 20,
        //   networkTransmittedRateThreshold: 20
        // }

        if (data.controllerAvgIoLatencyThreshold) {
          // 컨트롤러 I/O 평균 지연율 IOPS -> ms
          data.controllerAvgIoLatencyThreshold = data.controllerAvgIoLatencyThreshold / 1000
        }

        if (data && Object.keys(data).length) {
          Object.keys(data).forEach(key => {
            const valMapKey = this.thresholdMappingKey[key]
            this.$set(this.thresholdMap, valMapKey, data[key])
          })
        }
      } catch (error) {
        if (error.response && error.response.data.message === null) {
          return
        }
        this.$alert(this.$v('임계치 정보 조회를 실패하였습니다.'), () => false)
      }
    },
    onChangeFilter () {},
    onChangeCustomFilter ({ start, end }) {
      this.filterStartDate = start
      this.filterEndDate = end
    }
  },
  data: (root) => ({
    interval: 60, // 기본 조회 시간 단위
    activeTabGroup: 1,
    isLoadingGetData: false,
    chartData: [],
    chartMapData: {},
    filterStartDate: null,
    filterEndDate: null,
    syncDate: '',
    nxBindingKeys: [
      { value: 'hypervisorCpuUsagePpm', name: root.$v('{label} 사용률 (%)', { label: 'CPU' }) },
      { value: 'memoryUsagePpm', name: root.$v('{label} 사용률 (%)', { label: root.$v('메모리') }) },
      { value: 'controllerUserBytes', name: root.$v('{label} 사용률 (%)', { label: root.$v('디스크') }) },
      // { value: 'networkReceivedRateKbps', name: '네트워크 패킷 수신율 (kBps)' },
      // {
      //   value: 'networkTransmittedRateKbps',
      //   name: '네트워크 패킷 전송율 (kBps)'
      // },
      { value: 'controllerNumIops', name: root.$v('컨트롤러 IOPS (IOPS)') },
      {
        value: 'controllerIoBandwidthKbps',
        name: root.$v('컨트롤러 평균 I/O 대역폭 (IOPS)')
      },
      {
        value: 'controllerAvgIoLatencyUsecs',
        name: root.$v('컨트롤러 평균 I/O 지연율 (ms)')
      }
    ],
    thresholdMap: {},
    /**
     * controllerAvgIoLatencyThreshold 컨트롤러 평균 I/O 지연율
     * controllerIoBandwidthThreshold 컨트롤러 평균 I/O 대역폭
     * controllerIopsThreshold 컨트롤러 IOPS
     * cpuThreshold CPU 사용률
     * diskThreshold 디스크 사용률
     * memoryThreshold 메모리 사용률
     * networkReceivedRateThreshold 네트워크 패킷 수신율
     * networkTransmittedRateThreshold 네트워크 패킷 전송율
     * 모니터링 차트 API에서 받아온 키값과 임계치 키 값을
     * 매핑시키기 위한 데이터
     */
    thresholdMappingKey: {
      controllerAvgIoLatencyThreshold: 'controllerAvgIoLatencyUsecs',
      controllerIoBandwidthThreshold: 'controllerIoBandwidthKbps',
      controllerIopsThreshold: 'controllerNumIops',
      cpuThreshold: 'hypervisorCpuUsagePpm',
      diskThreshold: 'controllerUserBytes',
      memoryThreshold: 'memoryUsagePpm',
      networkReceivedRateThreshold: 'networkReceivedRateKbps',
      networkTransmittedRateThreshold: 'networkTransmittedRateKbps'
    }
  })
}
</script>

<style lang="scss" scoped>
.monitor-chart {
  &.loading {
    min-height: 600px;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &__sync {
      & > * {
        display: inline-block;
      }

      .refresh-btn {
        height: 36px;

        &-icon {
          position: relative;
          top: 1px;
          margin-left: 5px;
        }
      }

      .syncing-btn {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 160px;
        height: 36px;

        &-icon {
          margin-left: 5px;
        }
      }

      .scope-radio-group {
        margin-right: $gap-s;
      }
    }
  }

  &-body {
    margin-top: $gap-m;
    display: flex;
    flex-wrap: wrap;

    & > * {
      margin-bottom: $gap;

      &:nth-child(3n + 1) {
        // 1
        margin-right: $gap;
      }

      &:nth-child(3n + 2) {
        // 2
        margin-right: $gap;
      }
    }
  }
}

.no-data-wrap {
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<style lang="scss">
.radio-group {
  &.type-a {
    .el-radio-button {
      &.is-disabled {
        .el-radio-button__inner {
          color: #727797;

          &:hover {
            cursor: not-allowed;
          }
        }
      }

      &:first-child {
        .el-radio-button__inner {
          border-radius: 2px 0 0 2px;
        }
      }

      &:last-child {
        .el-radio-button__inner {
          border-radius: 0 2px 2px 0;
        }
      }

      .el-radio-button__inner {
        background-color: $main-gray;
        padding: 2px 15px;
        height: auto;
        border: none;
      }

      &.is-active {
        .el-radio-button__inner {
          background-color: $primary;
        }
      }
    }
  }

  &.type-b {
  }

  .el-radio-button {
  }
}
</style>
