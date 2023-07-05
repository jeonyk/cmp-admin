<template>
  <div class="set-monitoring">
    <dashboard-panel
      :padding-top="0"
      class="board"
    >
      <!-- AWS 모니터링 설정 -->
      <template #title>
        <h3 class="board-title">
          {{ $t('admin.MONIT.setMonitoring') }}
        </h3>
      </template>
      <ul class="board-list">
        <draggable :list="monitorList">
          <monitoring-card-row
            v-for="(monitor, index) in monitorList"
            :key="monitor.value"
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
          @tabClick="clickTabHandler"
        />
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import CardRow from '@/components/ConfigAws/CardRow'

import SetMonitorResources from '@/views/SetConfiguration/AWS/SetMonitoring/SetMonitorResources.vue'
import { DashboardPanel } from '@sd-fe/cmp-core'

// API
import commonAWSThreshold from './utils/commonAWSThreshold'

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
        await this.getCommonThreshold(this.selectedMonitor, this.selectedTab)
        this.resetArrData()
        this.splitArrayData(this.data, this.maxRow)
      }
    },
    selectedTab: {
      async handler (val) {
        // data SET
        await this.getCommonThreshold(this.selectedMonitor, this.selectedTab)
        this.resetArrData()
        this.splitArrayData(this.data, this.maxRow)
      }
    }
  },
  methods: {
    async saveDataList (dataLeft, dataRight) {
      try {
        const combinedObject = { ...dataLeft, ...dataRight }
        const ec2ValidationData = ['cpuUtilization']
        const ebsValidationData = ['timeSpentIdle', 'burstBalance']
        let testData = []
        switch (this.selectedTab) {
          case 'EC2': testData = ec2ValidationData
            break
          case 'EBS': testData = ebsValidationData
            break
        }

        const validResult = this.checkValidation(combinedObject, testData)
        if (!validResult.isSuccess) {
          // let message = null
          if (testData.includes(validResult.key)) {
            this.$alert(this.$v('퍼센트(%) 단위의 임계 값은 0 이상 100 이하의 숫자를 입력해주세요.'))
          } else {
            this.$alert(this.$v('0 이상의 숫자를 입력해주세요.'))
          }
          // if (testData.includes(validResult.key)) {
          //   this.$alert(this.$v('퍼센트(%) 단위의 임계 값은 0 이상 100 이하의 숫자를 입력해주세요.'))
          // } else {
          //   this.$alert(this.$v('0 이상의 숫자를 입력해주세요.'))
          // }
          // this.$alert(message, { dangerouslyUseHTMLString: true })
          throw new Error()
        }

        await commonAWSThreshold.updateCommonThreshold(this.selectedMonitor, this.selectedTab, combinedObject)
      } catch (err) {
        console.log(err)
      } finally {
        await this.getCommonThreshold(this.selectedMonitor, this.selectedTab)
        await this.resetArrData()
        await this.splitArrayData(this.data, this.maxRow)
      }
    },
    orderByDesc (a, b) {
      if (a.name.charCodeAt() < b.name.charCodeAt()) {
        return -1
      }
    },
    checkValidation (combinedObject, testData) {
      let isTrue = true
      const testKeyValues = Object.entries(combinedObject)
      let pointKey = ''
      let pointVal = 0
      const test = testKeyValues
        .some(([key, value]) => {
          if (!testData.includes(key)) {
            if (value < 0) {
              pointKey = key
              pointVal = value
            }
            return value < 0
          } else {
            if (value < 0 || value > 100) {
              pointKey = key
              pointVal = value
            }
            return value < 0 || value > 100
          }
        })
      if (test) {
        isTrue = false
      }
      return {
        key: pointKey,
        value: pointVal,
        isSuccess: isTrue
      }
    },
    selectCard (value) {
      if (value) this.selectedMonitor = value
    },
    async getCommonThreshold (selectedMonit, selectedTab) {
      try {
        const threshold = await commonAWSThreshold.getCommonThreshold(selectedMonit, selectedTab)
        const selectedArr = threshold
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
    },
    clickTabHandler (e) {
      console.log(e.value)
      this.selectedTab = e.value
    }
  },
  data () {
    return {
      monitorList: [
        { name: 'AWS Cloud Watch', value: 'AWS' }
      ],
      selectedMonitor: null, // 처음 선택 모니터링 환경
      selectedTab: 'EC2', // EC2 or EBS
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
