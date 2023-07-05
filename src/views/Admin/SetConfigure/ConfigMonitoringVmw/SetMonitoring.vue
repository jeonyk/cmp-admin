<template>
  <div class="set-monitoring">
    <dashboard-panel
      :padding-top="0"
      class="board"
    >
      <template #title>
        <h3 class="board-title">
          {{ $t('admin.MONIT.setMonitoring') }}
        </h3>
      </template>
      <ul class="board-list">
        <draggable :list="monitorList">
          <monitoring-card-row
            v-for="(monitor, index) in monitorList"
            :key="monitor.name"
            :data="monitor"
            :index="index + 1"
            style="padding-left: 20px"
            :selected-card="selectedMonitor"
            @selectCard="selectCard"
          />
        </draggable>
      </ul>
    </dashboard-panel>
    <div class="monitor-info-container">
      <div
        v-for="(monitor, index) of monitorList"
        :key="monitor.value +'-'+ index"
      >
        <set-monitor-resources
          v-if="monitor.value === selectedMonitor"
          :title="`${monitor.name} ${$t('admin.MONIT.setMonitoring')}`"
          :data-left="dataLeft"
          :data-right="dataRight"
          @save="saveDataList"
        />
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import CardRow from '@/components/ConfigAws/CardRow'
import SetMonitorResources from './SetMonitorResources.vue'
import { DashboardPanel } from '@sd-fe/cmp-core'

// API
import commonThreshold from './utils/commonThreshold'

export default {
  name: 'SetMonitoring',
  components: {
    'monitoring-card-row': CardRow,
    SetMonitorResources,
    draggable,
    DashboardPanel
  },
  async created () {
    try {
      this.monitorList.sort(this.orderByDesc)

      // 초기 selectedMonitor 값 설정
      this.selectedMonitor = this.monitorList[0].value
      // data SET
      await this.getCommonThreshold(this.selectedMonitor)
      if (this.doesNotExistBothData) {
        await this.splitArrayData(this.data, this.maxRow)
      }
    } catch (err) {
      return err.data
    }
  },
  computed: {
    doesNotExistBothData: function () {
      if (this.dataLeft.length === 0 && this.dataRight.length === 0) return true
      else return false
    }
  },
  watch: {
    selectedMonitor: {
      async handler (val) {
        // data SET
        await this.getCommonThreshold(val)
        this.resetArrData()
        this.splitArrayData(this.data, this.maxRow)
      }
    }
  },
  methods: {
    async saveDataList (dataLeft, dataRight) {
      try {
        const combinedObject = [...Object.values(dataLeft), ...Object.values(dataRight)]
        if (!this.checkValidation(combinedObject)) {
          this.$alert(this.$t('common.ALERT.NUTA.048'), { dangerouslyUseHTMLString: true })
          throw new Error()
        }

        // const ctAvgLatencty = combinedObject.controllerAvgIoLatencyThreshold

        // if (ctAvgLatencty) {
        //   // 컨트롤러 I/O 평균 지연율 IOPS -> ms
        //   combinedObject.controllerAvgIoLatencyThreshold = ctAvgLatencty * 1000
        // }
        // combinedObject
        await commonThreshold.updateCommonThreshold(this.selectedMonitor, combinedObject)
        await this.getCommonThreshold(this.selectedMonitor)
      } catch (err) {
        console.log(err)
      } finally {
        this.resetArrData()
        this.splitArrayData(this.data, this.maxRow)
      }
    },
    orderByDesc (a, b) {
      if (a.name.charCodeAt() < b.name.charCodeAt()) {
        return -1
      }
    },
    selectCard (value) {
      if (value) this.selectedMonitor = value
    },
    checkValidation (combinedObject) {
      let isTrue = false

      isTrue = combinedObject.filter((el) => {
        return el.thresholdValue !== null && el.unitInfoLabel === '%'
      }).every((el) => {
        return el.thresholdValue <= 100
      })
      console.log('🚀 ~ file: SetMonitoring.vue:130 ~ checkValidation ~ isTrue', isTrue)

      return isTrue
    },
    async getCommonThreshold (selectedMonit) {
      try {
        const threshold = await commonThreshold.getCommonThreshold(selectedMonit)
        const selectedArr = threshold

        // if (selectedMonit === 'Nutanix') {
        //   const ctAvgLatencty = selectedArr.find(thr => thr.key === 'controllerAvgIoLatencyThreshold')

        //   if (ctAvgLatencty) {
        //     // 컨트롤러 I/O 평균 지연율 IOPS -> ms
        //     ctAvgLatencty.value = ctAvgLatencty.value ? ctAvgLatencty.value / 1000 : 0
        //   }
        // }
        this.data = selectedArr

        return selectedArr
      } catch (err) {
        console.log(err)
      }
    },
    resetArrData () {
      this.dataLeft = []
      this.dataRight = []
    },

    /** selectedArr 배열에 newData를 추가한다.
     * @param [selectedArr](Array)선택된 배열
     * @param [newData](Array)새로 삽입할 값의 배열
     */
    addArrData (selectedArr, newData) {
      if (selectedArr) { selectedArr.push(newData) }
    },

    /** options 배열을 받아서 두줄로 나눕니다.
     * @param [options](Array)받아온 데이터 값들
     * @param [maxRowNum](number)최대 열 크기
     */
    splitArrayData (options, maxRowNum) {
      options.forEach((option, index) => {
        if (index + 1 > maxRowNum) {
          this.addArrData(this.dataRight, option)
        } else this.addArrData(this.dataLeft, option)
      })
    }

  },
  data () {
    return {
      monitorList: [
        { name: 'VMware', value: 'vmware' }
      ],
      selectedMonitor: null, // 처음 선택 모니터링 환경
      dataLeft: [],
      dataRight: [],
      data: [],
      maxRow: 9
    }
  }
}
</script>

<style lang="scss" scoped>
.set-monitoring {
  display: flex;
  height: 100%;
  width: 100%;
  .board {
    flex-basis: 400px;
    background: #070a20;
    padding: 15px;
    padding-left: 0px;
    box-sizing: border-box;
    height:95vh;
    border-radius: 6px;
    .board-title {
      text-indent: 20px;
    }
  }
  .monitor-info-container {
    width: 100%;
    display: block;
  }
}
</style>
