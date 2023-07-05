import Dayjs from 'dayjs'
import { mapState } from 'vuex'
export default {
  created  () {
    if (this.$field_V3() === 'CONFERENCE') {
      this.removeStautsPropInColumns()
      this.updatePropInColumns(this.selectedService.service)
    }
  },
  inject: ['$orderType', '$field_V3', '$roleState'],
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    selectedService () {
      return this.list[this.selectedIdx]
    }
  },
  data () {
    return {
      selectedIdx: 0
    }
  },
  methods: {
    updatePropInColumns (service) {
      if (service === 'EC2') { this.changeColSpan('memory', true) }
      if (service === 'EFS') { this.changeColSpan('performanceMode', true) }
      if (service === 'TARGET_GROUP') { this.changeColSpan('registerTarget', false) }
      if (service === 'NLB_L4') { this.changeColSpan('registerListener', false) }
      if (service === 'SG') { this.changeColSpan('vpcId', true) }
      if (service === 'TRANSIT_GATEWAY') { this.changeColSpan('amazonAsn', true) }
    },
    changeColSpan (prop, bool) {
      console.log('#changeColSpan', prop, bool)
      if (prop === 'registerTarget') {
        this.ipColumns.map(c => {
          if (c.binding === prop) { c.colspan = bool }
        })

        this.columns.map(c => {
          if (c.binding === prop) { c.colspan = bool }
        })

        return
      }
      this.newColumns.map(c => {
        if (c.binding === prop) { c.colspan = bool }
      })
    },
    removeStautsPropInColumns () {
      if (this.newColumns) this.newColumns.pop()
      if (this.ipColumns) this.ipColumns.pop()
      if (this.columns) this.columns.pop()
    },
    getTagText (tag) {
      const { label, workItemState } = tag
      const former = {
        CANCELLING: '[주문취소] ',
        CANCELED: '[주문취소 확장] ',
        CANCELED_AT_REVIEW: '[주문취소] '
      }[workItemState] ?? ''
      return former + label + ' ' + workItemState
    },
    getScheduleTime (timeObj) {
      if (!timeObj) return '-'
      const time = Dayjs(timeObj).format('YYYY.MM.DD HH:mm')
      return `${time}`
    },
    setEmitData (emitName, $event) {
      // const { workId, idx, service, autoScheduleAt } = this.selectedService
      // const payload = {
      //   workId,
      //   idx,
      //   service,
      //   autoScheduleAt,
      //   ...$event
      // }
      // console.log('SET EMIT DATA', payload)
      // this.$alert(emitName)
      if (emitName === 'set-success') {
        console.log('emitName', emitName)
        console.log($event)
        this.$emit(emitName, $event)
        return
      }

      if (emitName === 'excute') {
        this.$emit(emitName, this.selectedService, $event)
        return
      }
      this.$emit(emitName, this.selectedService)
    },
    getOrderType (status, isClass) {
      const CLASS_NAMES = {
        NEW: 'is-aws-new',
        CHANGE: 'is-aws-change',
        DELETE: 'is-aws-delete'
      }
      const STATUS_TYPES = {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제')
      }
      return isClass ? CLASS_NAMES[status] : STATUS_TYPES[status]
    },
    clickTagName (idx) {
      this.selectedIdx = idx
    }
  }
}
