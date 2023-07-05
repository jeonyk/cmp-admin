<template>
  <div
    v-loading="isLoadingGetData"
    class="monitor-chart"
  >
    <section class="monitor-chart-header">
      <div class="monitor-chart-header__sync">
        <el-radio-group
          v-model="activeTabGroup"
          class="scope-radio-group radio-group type-a"
        >
          <el-radio-button
            v-for="item in platforms"
            :label="item.value"
            :key="item.value"
            :disabled="item.disabled"
          >
            {{ item.name }}
          </el-radio-button>
        </el-radio-group>
        <monitoring-sync-button
          :syncing="syncing"
          :sync-date="syncDate"
          @click="onClickSync"
        />
      </div>

      <div class="monitor-chart-header__filter">
        <monitoring-chart-filter
          :volume-id="volumeId"
          :threshold="thresholdMap"
          :start-date.sync="filterStartDate"
          :end-date.sync="filterEndDate"
          @change="onChangeFilter"
          @change-custom-date="onChangeCustomFilter"
          @full-update="onFullUpdate"
        />
      </div>
    </section>
    <div
      v-if="chartData.length"
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
        {{ $v('데이터가 없습니다.') }}
      </div>
    </div>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import MonitoringChartFilter from '@/components/Monitoring/MonitoringChartFilter'
import MonitoringChartItem from '@/components/Monitoring/MonitoringChartItem.vue'
import MonitoringSyncButton from './MonitoringSyncButton.vue'
import { diffHours } from '@/components/Monitoring/FilterUtil'
import { isEmpty } from 'lodash'
import dayjs from 'dayjs'

export default {
  name: 'EBSMonitoring',
  components: {
    MonitoringChartFilter,
    MonitoringChartItem,
    MonitoringSyncButton
  },
  props: {
    /**
     * 모니터링 데이터 조회할 ebs 자원의 volumeId
     */
    volumeId: {
      type: [Number, String, null],
      default: ''
    },
    projectId: {
      type: [Number, String],
      default: ''
    }
  },
  watch: {
    filterStartDate (date) {
      this.calculateInterval()
      this.getAwsEbsMonitoring()
    }
  },
  computed: {
    syncing () {
      return this.isLoadingGetData
    }
  },
  created () {
    this.onFullUpdate()
  },
  methods: {
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
    async onFullUpdate () {
      await this.getAwsEbsCommonThreshold()
      await this.getAwsEbsMonitoring()
    },
    /**
     * 동기화 버튼 클릭 이벤트
     */
    onClickSync () {
      this.getAwsEbsMonitoring()
    },
    /**
     * 차트 제목 찾기
     */
    findHeader (keyName) {
      return this.awsBindingKeys.find(key => key.value === keyName)
    },
    /**
     * 차트 데이터 세팅
     */
    setChartData (chartData) {
      this.awsBindingKeys.forEach(key => {
        this.$set(
          this.chartMapData,
          key.value,
          chartData.map(data => {
            let value = parseInt(data[key.value]) || 0
            if (value < 0) value = 0

            const byteToKbKeys = ['readBandwidth', 'writeBandwidth', 'avgReadBytes', 'avgWriteBytes']

            if (byteToKbKeys.includes(key.value) && value > 0) {
              value = value / 1024
            }

            return {
              x: dayjs(new Date(data.timestamp)).format('HH:mm'),
              [key.value]: value,
              raw: data
            }
          })
        )
      })

      // console.log('%c chartMapData ',
      //   'color: white; background-color: #61dbfb',
      //   this.chartMapData)
    },
    async getAwsEbsMonitoring () {
      if (this.isLoadingGetData) return

      try {
        this.isLoadingGetData = true

        const defaultFilterDate = diffHours(new Date(), 1, true)
        const nowDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const { data } = await API.aws.getAwsEbsMonitoring({
          volumeId: this.volumeId,
          projectIdx: this.projectId,
          // projectIdx: 2924,
          startDate: this.filterStartDate || defaultFilterDate,
          // startDate: '2022-04-10 14:56:40',
          endDate: this.filterEndDate || nowDate,
          // endDate: '2022-04-26 15:56:40',
          interval: this.interval || 60
        })
        this.chartData = data
        // console.log('@Monitoring 정보 :: ', data)

        this.setChartData(this.chartData)

        if (this.chartData.length) {
          this.syncDate = dayjs(new Date(this.chartData[this.chartData.length - 1].timestamp)).format(
            'YYYY-MM-DD HH:mm:ss'
          )
        } else {
          this.syncDate = dayjs().format('YYYY-MM-DD HH:mm:ss')
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.isLoadingGetData = false
      }
    },
    async getAwsEbsCommonThreshold () {
      try {
        const { data } = await API.aws.getAwsEbsCommonThreshold({ volumeId: this.volumeId })

        if (!isEmpty(data)) {
          const byteToKbKeys = ['readBandwidth', 'writeBandwidth', 'avgReadBytes', 'avgWriteBytes']

          Object.keys(data).forEach(key => {
            if (byteToKbKeys.includes(key)) {
              // data[key] = data[key] / 1024
            }
          })
          this.thresholdMap = data
        }
        // console.log('%c 임계치 ',
        //   'color: white; background-color: orange',
        //   this.thresholdMap)

        // if (data && Object.keys(data).length) {
        //   Object.keys(data).forEach(key => {
        //     const valMapKey = this.thresholdMappingKey[key]
        //     this.$set(this.thresholdMap, valMapKey, data[key])
        //   })
        // }
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
    activeTabGroup: 'aws',
    isLoadingGetData: false,
    chartData: [],
    chartMapData: {},
    filterStartDate: null,
    filterEndDate: null,
    syncDate: '',
    platforms: [{ name: 'AWS CloudWatch', value: 'aws', disabled: false }, { name: 'Zabbix', value: 'zabbix', disabled: true }, { name: 'Paio', value: 'paio', disabled: true }],
    awsBindingKeys: [
      { value: 'readBandwidth', name: root.$v('읽기 대역폭 (KiB/s)') },
      { value: 'writeBandwidth', name: root.$v('쓰기 대역폭 (KiB/s)') },
      { value: 'readIops', name: root.$v('읽기 처리량 (Ops/s)') },
      { value: 'writeIops', name: root.$v('쓰기 처리량 (Ops/s)') },
      { value: 'queueLength', name: root.$v('평균 대기열 길이 (작업)') },
      { value: 'timeSpentIdle', name: root.$v('유휴시간(%)') },
      { value: 'avgReadBytes', name: root.$v('평균 읽기 크기 (KiB/op)') },
      { value: 'avgWriteBytes', name: root.$v('평균 쓰기 크기 (KiB/op)') },
      { value: 'avgReadTime', name: root.$v('평균 읽기 지연 시간 (ms/op)') },
      { value: 'avgWriteTime', name: root.$v('평균 쓰기 지연 시간 (ms/op)') },
      { value: 'burstBalance', name: root.$v('버스트 잔고 (%)') }

    ],
    thresholdMap: {}
  })
}
</script>

<style lang="scss" scoped>
.monitor-chart {
  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &__sync {
      display: flex;
      align-items: center;

      .refresh-btn {
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
        padding: 0 15px;
        height: auto;
        border: none;

        &:hover {
          color: $white;
        }
      }

      &.is-active {
        .el-radio-button__inner {
          background-color: $primary;
        }
      }
    }
  }
}
</style>
