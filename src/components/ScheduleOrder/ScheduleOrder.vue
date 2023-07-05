<template>
  <el-dialog
    :title="$v('자동 예약 설정')"
    :visible="active"
    width="900px"
    @close="$emit('close')"
  >
    <register-contents class="border-top">
      <template #title>
        <div class="title">
          {{ $v('작업 예정일') }}
          <el-tooltip
            class="item"
            effect="light"
            :content="$v('(예약설정시 해당 일정에 자동으로 작업이 실행 됩니다)')"
            placement="top"
          >
            <i class="mdi mdi-information-outline" />
          </el-tooltip>
        </div>
      </template>

      <service-date
        use-reset-button
        :init="init"
        @change="serviceDate"
        @cancel="cancelDate"
      />
    </register-contents>
    <!-- /. 작업 예정일 -->

    <div class="modal-button-area -center">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirm(data)"
      >
        {{ $v('등록') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import ServiceDate from '@/components/ServiceDate/ServiceDate'

export default {
  name: 'ScheduleOrder',
  props: {
    active: { // 모달 on/off
      type: Boolean,
      default: false
    },
    data: {
      type: [Object, Array],
      default: () => []
    }
  },
  components: {
    'service-date': ServiceDate
  },
  watch: {
    active (active) {
      if (active) this.initialize()
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
  },
  methods: {
    /**
     * [작업예정일] 변경 이벤트
     */
    serviceDate (date) {
      this.date = date
    },
    /**
     * [예약취소] 버튼 클릭 이벤트
     */
    cancelDate () {
      this.$confirm(this.$v('작업 예정일을 취소하시겠습니까?'))
        .then(() => this.confirm(this.data, true))
        .catch(() => false)
    },
    initialize () {
      // console.log(this.data, '하하핳하ㅏ 그만좀 바껴~!!! 힘들어죽겠어')
      const { autoScheduleAt } = this.data

      // workSchedule은
      //  - 자동이면 Object 형태로 들어가있음
      this.init = autoScheduleAt ? new Date(autoScheduleAt) : null

      this.$forceUpdate()
    },

    /**
     * [예약설정] 저장
     * @param {Object} data
     * @param {Boolean} cancel
     */
    async confirm ({ rows: [itemIdx], workId, type } = this.data, cancel = false) {
      try {
        const autoScheduleAt = this.date

        // [자동] 이면 [작업예정일] 필수 validation
        // [수동] 이면 validation 통과
        // if (!cancel && !autoScheduleAt) {
        // return this.$alert(this.$v('작업예정일을 설정해주세요.'))
        // }

        const payload = { autoScheduleAt: (cancel ? null : autoScheduleAt) }

        const apiName = {
          CONFERENCE: 'updateSourceSchedule', // 사전협의 [예약설정]
          TODO: 'updateTodoSchedule' // 할일 [예약설정]
        }[type]

        await API.work_v3[apiName]({ workId, itemIdx, payload })

        return this.$alert(this.$v('예약설정 변경을 완료하였습니다.'), {
          callback: () => {
            this.$emit('close')
            this.$emit('confirm')
          }
        })
      } catch (error) {
        this.$alert(this.$v('자동 예약 변경 도중 문제가 발생하였습니다.'))
        console.error('@@ ScheduleOrder > updateTodoSchedule', error)
      }
    }
  },
  data: () => ({
    date: {},
    init: undefined,
    initChecbox: undefined
  })
}
</script>

<style lang="scss" scoped>

.title {
  display: flex;
  align-items: center;

  i {
    display: block;
    margin-left: 5px;
  }
}
.border-top {
  border-top: 1px solid $dark-slate;
}

</style>
