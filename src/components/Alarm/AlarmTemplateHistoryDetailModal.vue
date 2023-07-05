<template>
  <el-dialog
    width="80%"
    :title="modalTitle"
    :visible="active"
    @close="$emit('visible-change', false)"
  >
    <cmp-grid
      :columns="columns"
      :item-source="historyInfo"
    />
    <!-- {{ item.almTriggerId }} -->
  </el-dialog>
</template>

<script>
export default {
  name: 'AlarmTemplateHistoryDetailModal',
  model: {
    prop: 'active',
    event: 'visible-change'
  },
  props: {
    active: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      default: null
    },
    templateName: {
      type: String,
      default: ''
    }
  },
  computed: {
    historyInfo () {
      return (this.item?.historyAlarmSendReceiverDtos || []).map(this.mapping)
    },
    modalTitle () {
      return `${this.item?.almTriggerName} 발송 결과`
    }
  },
  methods: {
    mapping (history) {
      return {
        ...history,
        userNameMap: `${history.userName}(${this.$options.filters.maskingName(history.userId)})`,
        alarmStatus: { ERROR: '실패', SUCCESS: '성공' }[history.alarmStatus]
      }
    }
  },
  data: (root) => ({
    columns: [
      { header: root.$v('관계사'), binding: 'userCompanyName', width: '0.8*' },
      { header: root.$v('조직'), binding: 'userGroupName' },
      { header: root.$v('이름(사번)'), binding: 'userNameMap', width: '0.7*' },
      { header: root.$v('기본 수신 대상'), binding: 'defaultReceiverName' },
      { header: root.$v('추가 수신 대상'), binding: 'receiverKeyword', width: '1.75*' },
      { header: root.$v('발송 결과'), binding: 'alarmStatus', width: '0.5*' },
      { header: root.$v('실패 메세지'), binding: 'failMessage' }
    ]
  })
}
</script>
