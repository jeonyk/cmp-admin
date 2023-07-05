<template>
  <div class="alarm-history">
    <div class="alarm-history-filter">
      <filtering-component
        :data="filterData"
        @reset-data="onResetFilter"
        @selected="onSetFilter"
        class="filtering-component"
      >
        <div class="filter-form">
          <span class="filter-name">발송일</span>
          <div class="filter-date">
            <el-date-picker
              v-model="filterDate.start"
              type="date"
              :clearable="false"
              placeholder="Start Date"
              value-format="yyyy-MM-dd 00:00:01"
              :picker-options="createDateOptStart"
              @change="dateSelection"
            />
            <!-- format="yyyy.MM.dd" -->
            <span class="date-line">~</span>
            <el-date-picker
              v-model="filterDate.end"
              type="date"
              :clearable="false"
              placeholder="End Date"
              value-format="yyyy-MM-dd 23:59:59"
              :picker-options="createDateOptEnd"
              @change="dateSelection"
            />
          </div>
        </div>
        <div
          class="filter-form"
          style="width: 100%"
        />
        <div
          class="filter-form log-name-search"
        >
          <search-component
            v-model="filterName"
            :placeholder="$v('템플릿명을 입력해주세요.')"
            @input="onInputTemplateName"
          />
          <!-- <el-input
            v-model="filterName"
            placeholder="검색어를 입력하세요."
            @input="onInputTemplateName"
          />
          <div class="icon-wrapper">
            <search-icon
              :width="14"
              :height="14"
              is-button
            />
            <refresh-icon
              :width="14"
              :height="14"
              is-button
              @click="onResetFilterName"
            />
          </div> -->
        </div>
      </filtering-component>
    </div>
    <div
      v-loading="isLoadingHistoryData"
      class="alarm-history-grid"
    >
      <total-count :total-count="totalHistory" />
      <cmp-grid
        clickable
        :columns="alarmHistoryColumns"
        :item-source="gridData"
        server-side-paging
        :server-side-now-page="currPage"
        :total-page-size="totalHistory"
        :use-column-filter="false"
        @changingPage="onChangePage"
        @row-click="onClickRow"
      >
        <template #receiverKeyword="{ row }">
          <el-tooltip
            v-if="row.receiverKeyword && row.receiverKeyword.length > 1"
            effect="light"
          >
            <span class="receiver-tooltip-trigger">
              {{ row.receiverKeyword[0] }} 외 {{ row.receiverKeyword.length - 1 }}
            </span>
            <div slot="content">
              <div
                v-for="receiver in row.receiverKeyword"
                :key="receiver"
              >
                {{ receiver }}
              </div>
            </div>
          </el-tooltip>
          <div v-else-if="row.receiverKeyword && row.receiverKeyword.length === 1">
            {{ row.receiverKeyword[0] }}
          </div>
          <div v-else>
            -
          </div>
        </template>
      </cmp-grid>
    </div>
    <alarm-template-history-detail-modal
      v-model="isActiveDetailModal"
      :item="selectHistory"
      :template-name="selectHistory ? selectHistory.almTemplatesName : ''"
    />
  </div>
</template>

<script>
import dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'
import AlarmTemplateHistoryDetailModal from './AlarmTemplateHistoryDetailModal.vue'

export default {
  name: 'AlarmHistoryList',
  components: {
    AlarmTemplateHistoryDetailModal
  },
  watch: {
    currentFilter: {
      deep: true,
      handler (filter) {
        this.getData()
        this.currPage = 1
      }
    }
  },
  computed: {
    gridData () {
      if (!this.alarmHistories || !this.alarmHistories.length) return []

      return this.alarmHistories.map(history => ({
        ...history,
        alarmCycleMap: this.findAlarmCycle(history.almTemplatesAlarmCycleType)?.codeName,
        alarmTypeMap: this.findAlarmType(history.alarmType)?.codeName,
        sendDate: dayjs(new Date(history.requestTime)).format('YYYY-MM-DD HH:mm:ss'),
        status: this.getAlarmStatus(history.alarmStatus)
      }))
    }
  },
  created () {
    this.resetFilterDate()
    this.getData()
  },
  methods: {
    onClickRow (row) {
      if (row && row.dataItem) {
        this.selectHistory = row.dataItem
        this.isActiveDetailModal = true
      } else {
        this.selectHistory = null
        this.isActiveDetailModal = false
      }
    },
    resetFilterDate () {
      this.filterDate = {
        start: new Date(dayjs(new Date()).subtract(30, 'days').format('YYYY-MM-DD')),
        end: new Date(dayjs(new Date()).format('YYYY-MM-DD'))
      }
    },
    getAlarmStatus (alarmStatus) {
      return {
        WAIT: '대기중',
        SENDING: '발신중',
        SEND_COMPLETE: '발신 완료',
        SUCCESS: '성공',
        ERROR: '실패'
      }[alarmStatus]
    },
    findAlarmCycle (alarmCycle) {
      return this.alarmCycles.find(cycle => cycle.codeVal === alarmCycle)
    },
    findAlarmType (alarmType) {
      return this.alarmTypes.find(type => type.codeVal === alarmType)
    },
    onSetFilter (filterData) {
      this.currentFilter = filterData
    },
    setFilter () {
      if (this.settledFilter) return

      const filterAlarmCycleType = this.filterData.find(f => f.field === 'alarmCycleType')

      if (filterAlarmCycleType) {
        filterAlarmCycleType.selections = this.alarmCycles.map(cycle => ({
          label: cycle.codeName,
          value: cycle.codeVal
        }))
      }

      const filterAlarmType = this.filterData.find(f => f.field === 'alarmType')

      if (filterAlarmType) {
        filterAlarmType.selections = this.alarmTypes.map(type => ({
          label: type.codeName,
          value: type.codeVal
        }))
      }

      this.settledFilter = true
    },
    onChangePage (page) {
      this.currPage = page
      this.getData()
    },
    getData () {
      this.isLoadingHistoryData = true

      Promise.all([
        this.getAlarmCycle(),
        this.getAlarmType(),
        this.getHistory()
      ])
        .then(([alarmCycle, alarmType, history]) => {
          this.alarmCycles = alarmCycle
          this.alarmTypes = alarmType
          this.setFilter()

          this.alarmHistories = history.content
        })
        .catch(() => {
          this.$alert(this.$v('히스토리 조회에 실패하였습니다.'))
        })
        .finally(() => {
          this.isLoadingHistoryData = false
        })
    },
    async getAlarmCycle () {
      if (this.alarmCycles && this.alarmCycles.length) return this.alarmCycles
      const { data } = await API.alarm.getAlarmCycleTypes()
      return data
    },
    async getAlarmType () {
      if (this.alarmTypes && this.alarmTypes.length) return this.alarmTypes
      const { data } = await API.alarm.getAlarmTypes()
      return data
    },
    async getHistory () {
      const filter = this.currentFilter ? { ...this.currentFilter } : {}
      const { data } = await API.alarm.getHistoryList({
        // startDate: dayjs(this.filterDate.start).format('YYYY-MM-DD HH:mm:ss'),
        // endDate: dayjs(this.filterDate.end).format('YYYY-MM-DD HH:mm:ss'),
        pageSize: this.pageSize,
        pageNo: this.currPage - 1,
        almTemplatesName: this.filterName || null,
        ...filter
      })
      this.totalHistory = data.totalElements
      return data
    },
    onResetFilterName () {
      this.filterName = ''
    },
    onInputTemplateName (value) {
      if (value) this.currPage = 1
      this.getData()
    },
    onResetFilter () {
      this.resetFilterDate()
      this.currentFilter = null
      this.filterName = ''
      this.currPage = 1
    },
    dateSelection () {
      const startDate = this.filterDate.start
      const endDate = this.filterDate.end
      const today = new Date()

      if (startDate) {
        this.createDateOptEnd.disabledDate = time => {
          return (
            time.getTime() > new Date(today.toDateString()) ||
            time.getTime() <
              new Date(new Date(startDate).toDateString()).getTime()
          )
        }
      }

      if (endDate) {
        this.createDateOptStart.disabledDate = time => {
          return (
            time.getTime() > new Date(today.toDateString()) ||
            time.getTime() >
              new Date(new Date(endDate).toDateString()).getTime()
          )
        }
      }
    }
  },
  data: () => ({
    isActiveDetailModal: false,
    selectHistory: null,
    settledFilter: false,
    isLoadingHistoryData: false,
    alarmCycles: [],
    alarmTypes: [],
    alarmHistories: [],
    totalHistory: 0,
    currPage: 1,
    pageSize: 10,
    currentFilter: null,
    filterData: [
      {
        label: '유형',
        field: 'alarmCycleType',
        selections: []
      },
      {
        label: '발송 시스템',
        field: 'alarmType',
        selections: []
      }
    ],
    filterDate: {
      start: null,
      end: null
    },
    filterName: '',
    createDateOptStart: {
      disabledDate (time) {
        const today = new Date().toDateString()
        return time.getTime() > new Date(today)
      }
    },
    createDateOptEnd: {
      disabledDate (time) {
        const today = new Date().toDateString()
        return time.getTime() > new Date(today)
      }
    },
    alarmHistoryColumns: [
      { binding: 'alarmCycleMap', header: '유형', width: '0.3*' },
      { binding: 'almTemplatesName', header: '템플릿명', width: '1.3*' },
      { binding: 'almTriggerName', header: '트리거', width: '1.3*' },
      { binding: 'alarmTypeMap', header: '발송 시스템', width: '0.5*' },
      { binding: 'receiverKeyword', header: '수신 대상', customHtml: true, width: '1.5*' },
      { binding: 'sendDate', header: '발송일시', width: '0.5*' },
      { binding: 'status', header: '성공 여부', width: '0.3*' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.alarm-history {
  &-filter {
    .filtering-component {
      &::v-deep .filter-wrapper {
        flex-wrap: wrap;
      }

      .filter-form.log-name-search {
        margin-top: $gap-m;

        .icon-wrapper {
          > svg {
            margin-left: 5px;
          }
        }
      }
    }
  }

  &-grid {
    margin-top: $gap-m;
    padding-top: $gap-m;
    min-height: 500px;

    .receiver-tooltip-trigger {
      color: $primary;
      text-decoration: underline;
    }
  }
}
</style>
