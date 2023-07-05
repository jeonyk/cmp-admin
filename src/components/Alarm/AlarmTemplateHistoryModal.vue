<template>
  <el-dialog
    :title="modalTitle"
    width="1200px"
    :visible="active"
    @close="$emit('close')"
  >
    <div
      v-loading="loading"
      class="history"
    >
      <cmp-grid
        clickable
        :columns="gridColumns"
        :item-source="gridData"
        server-side-paging
        :server-side-now-page="currPage"
        :total-page-size="totalCount"
        :use-column-filter="false"
        @changingPage="onChangePage"
        @row-click="onClickRow"
      >
        <template #requestTime="{ row }">
          {{ row.requestTime | date }}
        </template>
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
    <section class="modal-button-area">
      <button
        class="button"
        @click="$emit('close')"
      >
        닫기
      </button>
    </section>
    <alarm-template-history-detail-modal
      v-model="isActiveDetailModal"
      :item="selectItem"
      :template-name="selectTemplate ? selectTemplate.name : ''"
    />
  </el-dialog>
</template>

<script>
import AlarmTemplateHistoryDetailModal from './AlarmTemplateHistoryDetailModal.vue'

export default {
  name: 'AlarmTemplateHistoryModal',
  components: { AlarmTemplateHistoryDetailModal },
  props: {
    active: {
      type: Boolean,
      required: true
    },
    historyInfo: {
      type: Object,
      default: null
    },
    triggerMap: {
      type: Map,
      default: null
    },
    alarmCycle: {
      type: Object,
      default: () => ({})
    },
    alarmTypeMap: {
      type: Map,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    selectTemplate: {
      type: Object,
      default: null
    }
  },
  computed: {
    gridData () {
      if (!this.historyInfo) return []
      return this.historyInfo.content.map(this.mapTemplate)
    },
    totalCount () {
      if (!this.historyInfo) return 0
      return this.historyInfo.totalElements
    },
    modalTitle () {
      return `${this.selectTemplate?.triggerName} 발송 이력`
    }
  },
  watch: {
    active (active) {
      if (!active) this.currPage = 0
    }
  },
  methods: {
    onClickRow (row) {
      if (row && row.dataItem) {
        this.selectItem = row?.dataItem
        this.isActiveDetailModal = true
      } else {
        this.selectItem = null
        this.isActiveDetailModal = false
      }
    },
    mapAlarmStatus (template) {
      let str = ''

      const status = {
        ERROR: '실패',
        SUCCESS: '성공'
      }[template.alarmStatus]

      str += status

      if (template.alarmStatus === 'SUCCESS') {
        str += `(${template.totalSuccess}/${template.totalReceiver})`
      } else if (template.retryCnt) {
        str += `(재발송)(${template.totalError}/${template.totalReceiver})`
      } else {
        str += `(${template.totalError}/${template.totalReceiver})`
      }

      return str
    },
    mapTemplate (template) {
      return {
        ...template,
        almTemplatesAlarmCycleTypeMap: this.alarmCycle?.[template.almTemplatesAlarmCycleType].codeName,
        alarmTypeMap: this.alarmTypeMap?.get(template.alarmType).codeName,
        trigger: this.triggerMap?.get(template.almTriggerId).name,
        alarmStatusMap: this.mapAlarmStatus(template)
      }
    },
    onChangePage (page) {
      this.currPage = page
      this.$emit('change-page', this.selectTemplate, this.currPage - 1)
    }
  },
  data: (root) => ({
    gridColumns: [
      { header: root.$v('발송 주기'), binding: 'almTemplatesAlarmCycleTypeMap', width: '0.5*' },
      { header: root.$v('트리거'), binding: 'trigger', width: '1.5*' },
      { header: root.$v('발송 시스템'), binding: 'alarmTypeMap' },
      { header: root.$v('기본 수신 대상'), binding: 'defaultReceiverName', customHtml: true },
      { header: root.$v('추가 수신 대상'), binding: 'receiverKeyword', customHtml: true },
      { header: root.$v('발송일시'), binding: 'requestTime', customHtml: true },
      { header: root.$v('성공 여부'), binding: 'alarmStatusMap' }
    ],
    currPage: 0,
    isActiveDetailModal: false,
    selectItem: null
  })
}
</script>

<style lang="scss" scoped>
.history {
  &::v-deep {
    .wj-flexgrid .wj-row {
      cursor: pointer;
    }
  }

  .receiver-tooltip-trigger {
    color: $primary;
    text-decoration: underline;
  }
}
</style>
